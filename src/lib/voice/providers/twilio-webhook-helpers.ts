import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { twilioProvider } from "./twilio";

/** Twilio posts application/x-www-form-urlencoded, not JSON. */
export async function parseTwilioForm(req: Request): Promise<Record<string, string>> {
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) result[key] = value;
  return result;
}

/**
 * Reconstructs the exact URL Twilio signed, using APP_URL (the same base
 * every provider's webhook URL is built from at sync time — see
 * build-config.ts) rather than req.url, since a proxy/load balancer in
 * front of the app can rewrite the host Next.js sees.
 */
export function verificationUrl(req: Request): string {
  const appUrl = process.env.APP_URL;
  const incoming = new URL(req.url);
  const base = appUrl ? appUrl.replace(/\/$/, "") : `${incoming.protocol}//${incoming.host}`;
  return `${base}${incoming.pathname}${incoming.search}`;
}

/** true = verified or verification not configured (dev fallback, mirrors the Retell/ElevenLabs routes). */
export function isTwilioRequestValid(req: Request, params: Record<string, string>, signatureHeader: string | null): boolean {
  if (!process.env.TWILIO_AUTH_TOKEN) return true;
  return twilioProvider.verifyRequestSignature(verificationUrl(req), params, signatureHeader);
}

export async function resolveSalonIdByDialedNumber(supabase: SupabaseClient<Database>, toNumber: string | undefined) {
  if (!toNumber) return null;
  const { data } = await supabase.from("voice_settings").select("salon_id").eq("phone_number", toNumber).maybeSingle();
  return data?.salon_id ?? null;
}

/**
 * Twilio's RecordingStatusCallback payload does NOT include `To`/`From` (only
 * CallSid, RecordingSid, RecordingUrl, ...) — resolveSalonIdByDialedNumber
 * can't resolve it. Falls back to the `calls` row already created for this
 * CallSid by the voice/events routes (ensureCall/finalizeCall run before any
 * recording can complete, since recording only starts once a call is
 * answered).
 */
export async function resolveSalonIdByCallSid(supabase: SupabaseClient<Database>, callSid: string | undefined) {
  if (!callSid) return null;
  const { data } = await supabase.from("calls").select("salon_id").eq("provider_call_id", callSid).maybeSingle();
  return data?.salon_id ?? null;
}

export function xmlEscape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
