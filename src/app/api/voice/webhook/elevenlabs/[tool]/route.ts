import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runTool, toolSchemas } from "@/lib/voice/tools";
import { elevenLabsProvider } from "@/lib/voice/providers/elevenlabs";

// Per-tool webhook entry point for ElevenLabs Agents (see providers/
// elevenlabs.ts): unlike Retell's one shared endpoint with the tool name in
// the body, ElevenLabs is configured with one webhook URL per tool, so the
// tool name is the dynamic route segment instead. salonId travels as a
// query param baked into each tool's URL at sync time.
//
// KNOWN GAP vs. Retell's route: Retell auto-detects the caller's phone
// number from the live call and overrides whatever the LLM supplied for
// findCustomer/createCustomer/findAppointment/createCallbackRequest. We
// don't yet know ElevenLabs' dynamic-variable field name for the caller ID
// from this environment (network access to elevenlabs.io is blocked), so
// this route currently trusts whatever phone number the LLM itself passes
// as a normal tool argument. Once a real test call confirms the field name,
// the same override can be added here.

export async function POST(req: Request, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const url = new URL(req.url);
  const salonId = url.searchParams.get("salonId");
  const secret = url.searchParams.get("secret");

  const secretConfigured = Boolean(process.env.ELEVENLABS_WEBHOOK_SECRET);
  if (secretConfigured && !elevenLabsProvider.verifyWebhookSignature("", secret)) {
    return NextResponse.json({ error: "invalid secret" }, { status: 401 });
  }
  if (!salonId) return NextResponse.json({ error: "missing salonId" }, { status: 400 });
  if (!(tool in toolSchemas)) return NextResponse.json({ error: `unknown tool: ${tool}` }, { status: 400 });

  let args: unknown;
  try {
    args = await req.json();
  } catch {
    args = {};
  }

  const supabase = createAdminClient();
  const result = await runTool(supabase, salonId, tool as keyof typeof toolSchemas, args);
  return NextResponse.json(result);
}
