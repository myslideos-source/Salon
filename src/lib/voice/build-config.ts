import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/database.types";
import type { VoiceAgentConfig } from "./provider";
import { computeBoostedKeywords } from "./boosted-keywords";

// Shared by every sync action (Retell admin sync, ElevenLabs admin sync,
// and the salon-portal "sync whichever provider is active" action) so the
// config assembled for a given salon never drifts between callers. Leaves
// out voiceId/webhookUrl since those differ per provider - callers spread
// this base and add their own.
export async function loadVoiceAgentContext(supabase: SupabaseClient<Database>, salonId: string) {
  const [{ data: salon }, { data: settings }] = await Promise.all([
    supabase.from("salons").select("name, timezone, description").eq("id", salonId).single(),
    supabase.from("voice_settings").select("*").eq("salon_id", salonId).maybeSingle(),
  ]);

  if (!salon) return { ok: false as const, error: "Salon nicht gefunden." };
  if (!settings) return { ok: false as const, error: "Bitte zuerst die KI-Einstellungen speichern." };

  const boostedKeywords = await computeBoostedKeywords(supabase, salonId);

  const configBase: Omit<VoiceAgentConfig, "webhookUrl" | "voiceId"> = {
    salonId,
    salonName: salon.name,
    timezone: salon.timezone,
    greeting: settings.greeting,
    personality: settings.personality,
    phoneNumber: settings.phone_number,
    forwardingNumber: settings.forwarding_number,
    rules: {
      mentionPrices: settings.mention_prices,
      offerAlternatives: settings.offer_alternatives,
      respectEmployeePreference: settings.respect_employee_preference,
      offerCallback: settings.offer_callback,
      detectNewCustomers: settings.detect_new_customers,
      sendConfirmationSms: settings.send_confirmation_sms,
      emergencyRedirect: settings.emergency_redirect,
      mentionCancellationPolicy: settings.mention_cancellation_policy,
    },
    cancellationNoticeHours: settings.cancellation_notice_hours,
    requiredDocuments: settings.required_documents,
    boostedKeywords,
    customPrompt: settings.custom_prompt,
    assistantName: settings.assistant_name,
    formality: settings.formality === "du" ? "du" : "sie",
    languages: settings.languages.length > 0 ? settings.languages : ["de"],
    neverMention: settings.never_mention,
    afterHoursBehavior:
      settings.after_hours_behavior === "voicemail" || settings.after_hours_behavior === "info_only"
        ? settings.after_hours_behavior
        : "offer_callback",
    handoffNumber: settings.handoff_number,
    urgentKeywords: settings.urgent_keywords,
    notifyAfterCall: settings.notify_after_call,
    businessDescription: salon.description,
  };

  return { ok: true as const, salon, settings: settings as Tables<"voice_settings">, configBase };
}
