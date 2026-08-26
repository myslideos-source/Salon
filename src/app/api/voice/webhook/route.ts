import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { runTool, toolSchemas } from "@/lib/voice/tools";
import { retellProvider } from "@/lib/voice/providers/retell";

// Webhook entry point for the configured Voice-AI provider (Retell by
// default). NOTE: the exact payload shape below follows Retell's documented
// "custom function" + call-lifecycle webhook conventions, but must be
// double-checked against the live Retell account once RETELL_API_KEY /
// RETELL_WEBHOOK_SECRET are configured — adjust the zod schemas below to
// match exactly rather than guessing further at runtime.

const functionCallSchema = z.object({
  event: z.literal("function_call"),
  name: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
  call: z.object({
    call_id: z.string(),
    from_number: z.string().optional(),
    to_number: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

const callEndedSchema = z.object({
  event: z.literal("call_ended"),
  call: z.object({
    call_id: z.string(),
    from_number: z.string().optional(),
    to_number: z.string().optional(),
    duration_ms: z.number().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    transcript: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
  }),
});

async function resolveSalonId(supabase: ReturnType<typeof createAdminClient>, metadata: Record<string, unknown> | undefined, toNumber: string | undefined) {
  const metaSalonId = metadata?.salonId;
  if (typeof metaSalonId === "string") return metaSalonId;
  if (!toNumber) return null;
  const { data } = await supabase.from("voice_settings").select("salon_id").eq("phone_number", toNumber).maybeSingle();
  return data?.salon_id ?? null;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secretConfigured = Boolean(process.env.RETELL_WEBHOOK_SECRET);
  if (secretConfigured) {
    const signature = req.headers.get("x-retell-signature");
    if (!retellProvider.verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const functionCall = functionCallSchema.safeParse(body);
  if (functionCall.success) {
    const { name, args, call } = functionCall.data;
    const salonId = await resolveSalonId(supabase, call.metadata, call.to_number);
    if (!salonId) return NextResponse.json({ error: "salon not found for this number" }, { status: 404 });
    if (!(name in toolSchemas)) return NextResponse.json({ error: `unknown tool: ${name}` }, { status: 400 });

    const result = await runTool(supabase, salonId, name as keyof typeof toolSchemas, args ?? {});
    return NextResponse.json({ result });
  }

  const callEnded = callEndedSchema.safeParse(body);
  if (callEnded.success) {
    const { call } = callEnded.data;
    const salonId = await resolveSalonId(supabase, call.metadata, call.to_number);
    if (!salonId) return NextResponse.json({ error: "salon not found for this number" }, { status: 404 });

    await supabase.from("calls").insert({
      salon_id: salonId,
      phone_number: call.from_number ?? null,
      duration_seconds: Math.round((call.duration_ms ?? 0) / 1000),
      status: "completed",
      provider_call_id: call.call_id,
      transcript: call.transcript ?? [],
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unrecognized payload" }, { status: 400 });
}
