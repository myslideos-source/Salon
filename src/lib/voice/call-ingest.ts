import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, Tables } from "@/lib/supabase/database.types";

// Provider-agnostic call-lifecycle ingestion (Konzeptabschnitt "Telefonie
// und Integrationen"). Whichever Voice-AI/telephony provider is configured
// (Retell, ElevenLabs, Twilio, ...) reports call-lifecycle events to this
// module through the same handful of functions instead of each webhook
// route writing to `calls` directly with its own ad-hoc upsert logic. This
// is what makes the webhook layer provider-agnostic: swapping or adding a
// provider means writing a thin adapter that calls these functions, not
// duplicating the idempotency/linking logic again.
//
// The canonical event set from the product spec ("Plane Webhooks für: ..."):
export type CallLifecycleEvent =
  | "incoming_call"
  | "call_started"
  | "call_ended"
  | "transcript_available"
  | "summary_available"
  | "appointment_requested"
  | "appointment_booked"
  | "callback_created"
  | "handoff_triggered";

type AnyClient = SupabaseClient<Database>;
type CallRow = Tables<"calls">;

/**
 * "Eingehender Anruf" / "Gespräch gestartet": ensures a `calls` row exists
 * for this provider call id, creating a minimal `in_progress` row on first
 * contact and returning its id. Safe to call multiple times for the same
 * provider call id (e.g. once per tool invocation during the call) — never
 * creates a duplicate row, which is the idempotency guarantee every
 * provider adapter needs (each fires more than one lifecycle event per
 * call).
 */
export async function ensureCall(
  supabase: AnyClient,
  input: { salonId: string; providerCallId: string; phoneNumber?: string | null; direction?: "inbound" | "outbound" }
): Promise<CallRow> {
  const existing = await supabase.from("calls").select("*").eq("provider_call_id", input.providerCallId).maybeSingle();
  if (existing.data) return existing.data;

  const { data, error } = await supabase
    .from("calls")
    .insert({
      salon_id: input.salonId,
      provider_call_id: input.providerCallId,
      phone_number: input.phoneNumber ?? null,
      direction: input.direction ?? "inbound",
      status: "in_progress",
    })
    .select("*")
    .single();
  if (error) {
    // Race: two events for the same call arrived concurrently and both
    // missed the initial select. Fall back to reading the row the other
    // request just created rather than erroring the whole webhook.
    const retry = await supabase.from("calls").select("*").eq("provider_call_id", input.providerCallId).maybeSingle();
    if (retry.data) return retry.data;
    throw new Error(error.message);
  }
  return data;
}

/** Resolves an existing customer by phone number, without creating one. */
export async function resolveCustomerByPhone(supabase: AnyClient, salonId: string, phone: string | null | undefined) {
  if (!phone) return null;
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("salon_id", salonId)
    .eq("phone", phone.trim())
    .maybeSingle();
  return data?.id ?? null;
}

/** "Termin angefragt"/"Termin gebucht": links a booked/rescheduled appointment back onto its call. */
export async function linkCallAppointment(
  supabase: AnyClient,
  callId: string,
  appointmentId: string,
  outcome: "appointment_booked" | "appointment_rescheduled" | "appointment_cancelled"
) {
  await supabase.from("calls").update({ appointment_id: appointmentId, outcome }).eq("id", callId);
}

/** "Rückruf erstellt": marks the call as having produced a callback request. */
export async function linkCallCallback(supabase: AnyClient, callId: string) {
  await supabase.from("calls").update({ outcome: "callback_requested" }).eq("id", callId);
}

/** "Weiterleitung ausgelöst": marks the call as handed off to a human. */
export async function markCallHandoff(supabase: AnyClient, callId: string) {
  await supabase.from("calls").update({ outcome: "handoff" }).eq("id", callId);
}

/** Sentiment values a provider might report, normalized to the DB's fixed set. */
export function normalizeSentiment(raw: string | null | undefined): "positive" | "neutral" | "negative" | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v.includes("positiv") || v === "positive" || v === "good" || v === "happy") return "positive";
  if (v.includes("negativ") || v === "negative" || v === "bad" || v === "angry" || v === "frustrated") return "negative";
  if (v.includes("neutral")) return "neutral";
  return null;
}

/** Derives urgency from the salon's configured keyword list against transcript/summary text. */
export function deriveUrgency(text: string, urgentKeywords: string[]): "low" | "normal" | "high" | "urgent" | null {
  if (!text) return null;
  const haystack = text.toLowerCase();
  const hit = urgentKeywords.some((kw) => kw.trim() && haystack.includes(kw.trim().toLowerCase()));
  return hit ? "urgent" : null;
}

export type FinalizeCallInput = {
  salonId: string;
  providerCallId: string;
  phoneNumber?: string | null;
  durationSeconds: number;
  status?: "completed" | "missed" | "voicemail";
  transcript?: Json | null;
  summary?: string | null;
  topic?: string | null;
  sentiment?: "positive" | "neutral" | "negative" | null;
  urgency?: "low" | "normal" | "high" | "urgent" | null;
  resolved?: boolean;
  recordingUrl?: string | null;
  consentRecording?: boolean | null;
};

/**
 * "Gespräch beendet" / "Transkript verfügbar" / "Zusammenfassung
 * verfügbar": finalizes the call row (create-or-update by provider_call_id
 * so a provider that fires more than one terminal event, e.g. Retell's
 * call_ended + call_analyzed, never produces duplicate rows). Also
 * best-effort resolves customer_id from the phone number so "Bestandskunde
 * /Neukunde" filtering works even for calls that never invoked a
 * customer-creating tool.
 */
export async function finalizeCall(supabase: AnyClient, input: FinalizeCallInput): Promise<CallRow> {
  const customerId = await resolveCustomerByPhone(supabase, input.salonId, input.phoneNumber);

  // Only ever overwrites fields this particular event actually reports —
  // an earlier lifecycle event (e.g. the status callback that already set
  // phone_number/duration) must not be clobbered back to null by a later,
  // narrower one (e.g. a recording-only callback that knows nothing about
  // duration or phone number).
  const patch: Partial<CallRow> = {
    salon_id: input.salonId,
    provider_call_id: input.providerCallId,
    duration_seconds: Math.max(0, Math.round(input.durationSeconds)),
    status: input.status ?? "completed",
  };
  if (input.phoneNumber !== undefined) patch.phone_number = input.phoneNumber;
  if (customerId) patch.customer_id = customerId;
  if (input.transcript !== undefined) patch.transcript = input.transcript ?? [];
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.topic !== undefined) patch.topic = input.topic;
  if (input.sentiment !== undefined) patch.sentiment = input.sentiment;
  if (input.urgency !== undefined && input.urgency !== null) patch.urgency = input.urgency;
  if (input.resolved !== undefined) patch.resolved = input.resolved;
  if (input.recordingUrl !== undefined) patch.recording_url = input.recordingUrl;
  if (input.consentRecording !== undefined) patch.consent_recording = input.consentRecording;

  const existing = await supabase.from("calls").select("id").eq("provider_call_id", input.providerCallId).maybeSingle();
  if (existing.data) {
    const { data, error } = await supabase.from("calls").update(patch).eq("id", existing.data.id).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await supabase.from("calls").insert(patch as CallRow).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Attaches a recording (Twilio's recording-status callback fires as its
 * own event, separate from and often after the call-status "completed"
 * event) without touching duration/status/transcript — those belong to
 * the call-lifecycle finalize step, not the recording step, so this never
 * overwrites them.
 */
export async function attachRecording(
  supabase: AnyClient,
  input: { salonId: string; providerCallId: string; recordingUrl: string; consentRecording: boolean }
): Promise<void> {
  const patch = { recording_url: input.recordingUrl, consent_recording: input.consentRecording };
  const existing = await supabase.from("calls").select("id").eq("provider_call_id", input.providerCallId).maybeSingle();
  if (existing.data) {
    await supabase.from("calls").update(patch).eq("id", existing.data.id);
    return;
  }
  await supabase
    .from("calls")
    .insert({ salon_id: input.salonId, provider_call_id: input.providerCallId, duration_seconds: 0, status: "completed", ...patch });
}
