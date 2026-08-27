"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { retellProvider } from "@/lib/voice/providers/retell";
import { elevenLabsProvider } from "@/lib/voice/providers/elevenlabs";
import { loadVoiceAgentContext } from "@/lib/voice/build-config";
import type { SyncResult } from "@/lib/actions/retell";

export type AiSettingsActionState = { error?: string; ok?: boolean; syncWarning?: string } | null;

// Customer-facing counterpart to lib/actions/voice-settings.ts (admin-only).
// Exposes only what a salon owner should be able to touch themselves -
// greeting, personality, rule toggles and their own free-text prompt
// addition - never the technical/infrastructure fields (phone numbers,
// provider choice, voice IDs) which stay admin-controlled.
const schema = z.object({
  greeting: z.string().min(1),
  personality: z.enum(["freundlich", "professionell", "locker", "elegant"]),
  custom_prompt: z.string().max(4000).optional().or(z.literal("")),
  mention_prices: z.coerce.boolean(),
  offer_alternatives: z.coerce.boolean(),
  respect_employee_preference: z.coerce.boolean(),
  offer_callback: z.coerce.boolean(),
  detect_new_customers: z.coerce.boolean(),
  send_confirmation_sms: z.coerce.boolean(),
  emergency_redirect: z.coerce.boolean(),
  mention_cancellation_policy: z.coerce.boolean(),
  cancellation_notice_hours: z.coerce.number().int().min(1).max(168),
  required_documents: z.string().max(500).optional().or(z.literal("")),
});

// Saves the settings and immediately pushes them live in one step - a
// separate manual "Übertragen" click used to be required after saving,
// which meant a saved-but-not-synced state was easy to miss. Save failures
// still block (error), but a sync failure after a successful save is
// reported as a non-blocking warning since the settings themselves are
// safely stored either way and syncActiveVoiceAgentAction can retry later.
export async function updateSalonVoiceSettingsAction(_prev: AiSettingsActionState, formData: FormData): Promise<AiSettingsActionState> {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session);
  if (!salonId) return { error: "Kein Salon gefunden." };

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_voice_settings_customer_fields", {
    target_salon_id: salonId,
    p_greeting: parsed.data.greeting,
    p_personality: parsed.data.personality,
    // Postgres accepts null for a `text` param even though the generated
    // type doesn't know that (the function has no DEFAULT), hence the cast.
    p_custom_prompt: (parsed.data.custom_prompt || null) as string,
    p_mention_prices: parsed.data.mention_prices,
    p_offer_alternatives: parsed.data.offer_alternatives,
    p_respect_employee_preference: parsed.data.respect_employee_preference,
    p_offer_callback: parsed.data.offer_callback,
    p_detect_new_customers: parsed.data.detect_new_customers,
    p_send_confirmation_sms: parsed.data.send_confirmation_sms,
    p_emergency_redirect: parsed.data.emergency_redirect,
    p_mention_cancellation_policy: parsed.data.mention_cancellation_policy,
    p_cancellation_notice_hours: parsed.data.cancellation_notice_hours,
    // Same null-vs-string generated-type mismatch as p_custom_prompt above.
    p_required_documents: (parsed.data.required_documents || null) as string,
  });

  if (error) return { error: error.message };

  const syncResult = await performSync(supabase, salonId);
  revalidatePath("/app/ai");
  if (!syncResult.ok) return { ok: true, syncWarning: sanitizeSyncError(syncResult.error) };
  return { ok: true };
}

// Manual retry, exposed for the fallback button that appears when the
// automatic sync inside updateSalonVoiceSettingsAction above failed (e.g. a
// transient provider error) - lets the owner retry without re-saving.
export async function syncActiveVoiceAgentAction(): Promise<SyncResult> {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session);
  if (!salonId) return { ok: false, error: "Kein Salon gefunden." };
  const supabase = await createClient();
  const result = await performSync(supabase, salonId);
  revalidatePath("/app/ai");
  if (!result.ok) return { ok: false, error: sanitizeSyncError(result.error) };
  return result;
}

// Which voice-AI vendor we use behind the scenes (currently ElevenLabs) is
// admin-only knowledge - the admin sync panel shows the real provider error
// for debugging, but nothing customer-facing should ever surface a vendor
// name or raw API error text. Logged server-side so the real error is still
// diagnosable from the Vercel function logs.
function sanitizeSyncError(raw: string): string {
  console.error("[salon-voice-settings] sync failed:", raw);
  return "Die Übertragung an deinen Telefonassistenten hat gerade nicht geklappt. Bitte versuche es in ein paar Minuten erneut oder kontaktiere den Support.";
}

async function performSync(supabase: Awaited<ReturnType<typeof createClient>>, salonId: string): Promise<SyncResult> {
  const context = await loadVoiceAgentContext(supabase, salonId);
  if (!context.ok) return { ok: false, error: context.error };
  const { settings, configBase } = context;

  const appUrl = process.env.APP_URL;
  if (!appUrl) return { ok: false, error: "APP_URL ist nicht gesetzt (siehe .env.example)." };

  if (settings.provider === "elevenlabs") {
    const result = await elevenLabsProvider.syncAgent(
      {
        ...configBase,
        voiceId: settings.elevenlabs_voice_id ?? "",
        webhookUrl: `${appUrl}/api/voice/webhook/elevenlabs`,
      },
      { agentId: settings.elevenlabs_agent_id }
    );
    if (!result.ok) return result;
    await supabase
      .from("voice_settings")
      .update({ elevenlabs_agent_id: result.agentId, updated_at: new Date().toISOString() })
      .eq("salon_id", salonId);
    revalidatePath("/app/ai");
    return result;
  }

  const result = await retellProvider.syncAgent(
    {
      ...configBase,
      voiceId: settings.voice_id,
      webhookUrl: `${appUrl}/api/voice/webhook`,
    },
    { agentId: settings.provider_agent_id, llmId: settings.provider_llm_id }
  );
  if (!result.ok) return result;
  await supabase
    .from("voice_settings")
    .update({ provider_agent_id: result.agentId, provider_llm_id: result.llmId, updated_at: new Date().toISOString() })
    .eq("salon_id", salonId);
  revalidatePath("/app/ai");
  return result;
}
