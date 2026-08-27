import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { elevenLabsProvider } from "@/lib/voice/providers/elevenlabs";
import type { Json } from "@/lib/supabase/database.types";

// Call-lifecycle logging for ElevenLabs Agents. ElevenLabs fires a separate
// "post-call webhook" once a conversation ends (distinct from the per-tool
// webhooks in ../[tool]/route.ts), configured once per agent or workspace
// rather than per salon - so unlike the tool webhooks, salonId usually
// can't be baked into this URL and is instead resolved from the agent id
// inside the payload, mirroring Retell's webhook resolveSalonId fallback.
//
// UNVERIFIED: exact payload field names (network access to elevenlabs.io is
// blocked from this environment) - parsing below is deliberately permissive
// (tries several plausible field names) and echoes back what it actually
// received on total failure, the same "let a real payload correct this"
// approach already used in the Retell webhook route.

type JsonObj = Record<string, unknown>;

function asObject(value: unknown): JsonObj {
  return value && typeof value === "object" ? (value as JsonObj) : {};
}
function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

async function resolveSalonId(supabase: ReturnType<typeof createAdminClient>, req: Request, body: JsonObj) {
  const fromQuery = new URL(req.url).searchParams.get("salonId");
  if (fromQuery) return fromQuery;

  const agentId = asString(body.agent_id) ?? asString(body.agentId);
  if (agentId) {
    const { data } = await supabase.from("voice_settings").select("salon_id").eq("elevenlabs_agent_id", agentId).maybeSingle();
    if (data?.salon_id) return data.salon_id;
  }
  return null;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = new URL(req.url).searchParams.get("secret");
  const secretConfigured = Boolean(process.env.ELEVENLABS_WEBHOOK_SECRET);
  if (secretConfigured && !elevenLabsProvider.verifyWebhookSignature(rawBody, secret)) {
    return NextResponse.json({ error: "invalid secret" }, { status: 401 });
  }

  let body: JsonObj;
  try {
    body = JSON.parse(rawBody) as JsonObj;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const salonId = await resolveSalonId(supabase, req, body);
  if (!salonId) {
    return NextResponse.json({ error: "salon not found", receivedKeys: Object.keys(body) }, { status: 404 });
  }

  const durationSeconds =
    typeof body.call_duration_secs === "number"
      ? body.call_duration_secs
      : typeof body.duration_seconds === "number"
        ? body.duration_seconds
        : 0;
  const providerCallId = asString(body.conversation_id) ?? asString(body.call_id) ?? null;
  const transcript = (body.transcript ?? null) as unknown as Json;

  const row = {
    salon_id: salonId,
    phone_number: asString(asObject(body.metadata).caller_id) ?? asString(body.from_number) ?? null,
    duration_seconds: Math.round(durationSeconds),
    status: "completed",
    provider_call_id: providerCallId,
    transcript,
  };

  const existing = providerCallId
    ? await supabase.from("calls").select("id").eq("provider_call_id", providerCallId).maybeSingle()
    : null;
  if (existing?.data) {
    await supabase.from("calls").update(row).eq("id", existing.data.id);
  } else {
    await supabase.from("calls").insert(row);
  }
  return NextResponse.json({ ok: true });
}
