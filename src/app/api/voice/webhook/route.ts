import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runTool, toolSchemas } from "@/lib/voice/tools";
import { retellProvider } from "@/lib/voice/providers/retell";

// Webhook entry point for the configured Voice-AI provider (Retell by
// default). Retell posts to this same URL for two different things: (a)
// each custom tool invocation (one per `general_tools` entry configured in
// syncAgent) and (b) agent-level call lifecycle events (call_started,
// call_ended, ...). Their exact payload shapes aren't documented anywhere
// we could check from this environment, so parsing below is deliberately
// permissive — it tries several plausible field names for each shape
// rather than committing to one — and on total failure echoes back what it
// actually received (visible in the Retell dashboard's tool-call inspector)
// so a live payload can be used to tighten this up precisely.

type Json = Record<string, unknown>;

function asObject(value: unknown): Json {
  return value && typeof value === "object" ? (value as Json) : {};
}
function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function extractFunctionCall(body: Json): { name: string; args: Json; call: Json } | null {
  const toolCall = asObject(body.tool_call);
  const name = asString(body.name) ?? asString(body.function_name) ?? asString(body.tool_name) ?? asString(toolCall.name);
  if (!name) return null;

  const rawArgs = body.args ?? body.arguments ?? body.parameters ?? toolCall.arguments ?? toolCall.args;
  let args: Json = {};
  if (typeof rawArgs === "string") {
    try {
      args = JSON.parse(rawArgs);
    } catch {
      args = {};
    }
  } else {
    args = asObject(rawArgs);
  }

  const call = asObject(body.call) ?? asObject(body.call_details);
  return { name, args, call };
}

function extractCallEnded(body: Json): Json | null {
  const call = asObject(body.call);
  const event = asString(body.event);
  const callStatus = asString(call.call_status) ?? asString(body.call_status);
  if (event === "call_ended" || event === "call_analyzed" || callStatus === "ended") {
    return Object.keys(call).length > 0 ? call : body;
  }
  return null;
}

async function resolveSalonId(supabase: ReturnType<typeof createAdminClient>, call: Json) {
  const metadata = asObject(call.metadata) ?? asObject(call.retell_llm_dynamic_variables);
  const metaSalonId = asString(metadata.salonId);
  if (metaSalonId) return metaSalonId;

  // Every call — including Retell's in-dashboard "Test Audio" mode, which
  // has no real phone number at all — is tied to a specific agent. Each
  // salon gets its own agent (syncAgent stores the id in
  // voice_settings.provider_agent_id), so this works even without a call.
  const agentId = asString(call.agent_id) ?? asString(call.agentId);
  if (agentId) {
    const { data } = await supabase.from("voice_settings").select("salon_id").eq("provider_agent_id", agentId).maybeSingle();
    if (data?.salon_id) return data.salon_id;
  }

  const toNumber = asString(call.to_number) ?? asString(call.toNumber);
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

  let body: Json;
  try {
    body = JSON.parse(rawBody) as Json;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const functionCall = extractFunctionCall(body);
  if (functionCall) {
    const { name, args, call } = functionCall;
    const salonId = await resolveSalonId(supabase, call);
    if (!salonId) return NextResponse.json({ error: "salon not found for this number" }, { status: 404 });
    if (!(name in toolSchemas)) return NextResponse.json({ error: `unknown tool: ${name}` }, { status: 400 });

    // Caller ID: for any tool that takes a `phone` argument, prefer the
    // number Retell actually connected the call from over whatever the LLM
    // supplied (or omitted - the prompt now tells it not to bother asking).
    // That's how the agent "recognizes" a returning customer automatically,
    // and it's also just more reliable than a transcribed/spoken number.
    // Falls back to the LLM's value when there's no real caller number (e.g.
    // Retell's in-dashboard "Test Audio" mode).
    const PHONE_TOOLS = new Set(["findCustomer", "createCustomer", "findAppointment", "createCallbackRequest"]);
    const callerNumber = asString(call.from_number) ?? asString(call.fromNumber);
    if (callerNumber && PHONE_TOOLS.has(name)) {
      args.phone = callerNumber;
    }

    const result = await runTool(supabase, salonId, name as keyof typeof toolSchemas, args);
    return NextResponse.json(result);
  }

  const callEnded = extractCallEnded(body);
  if (callEnded) {
    const salonId = await resolveSalonId(supabase, callEnded);
    if (!salonId) return NextResponse.json({ error: "salon not found for this number" }, { status: 404 });

    const durationMs = typeof callEnded.duration_ms === "number" ? callEnded.duration_ms : 0;
    // Retell fires more than one lifecycle event per call (call_ended,
    // call_analyzed, ...), each of which matches extractCallEnded. Without
    // a lookup-then-write, each one inserted a fresh duplicate row.
    const providerCallId = asString(callEnded.call_id) ?? null;
    const transcript = Array.isArray(callEnded.transcript_object)
      ? callEnded.transcript_object
      : Array.isArray(callEnded.transcript)
        ? callEnded.transcript
        : (asString(callEnded.transcript) ?? null);

    const row = {
      salon_id: salonId,
      phone_number: asString(callEnded.from_number) ?? null,
      duration_seconds: Math.round(durationMs / 1000),
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

  return NextResponse.json(
    {
      error: "unrecognized payload",
      // Deliberately echoed back so it shows up in Retell's dashboard —
      // the fastest way to see the real shape without live doc access.
      receivedKeys: Object.keys(body),
      received: body,
    },
    { status: 400 }
  );
}
