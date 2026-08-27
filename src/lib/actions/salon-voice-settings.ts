"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { retellProvider } from "@/lib/voice/providers/retell";
import { elevenLabsProvider } from "@/lib/voice/providers/elevenlabs";
import { loadVoiceAgentContext } from "@/lib/voice/build-config";
import type { ActionState } from "@/lib/actions/admin";
import type { SyncResult } from "@/lib/actions/retell";

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
});

export async function updateSalonVoiceSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
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
  });

  if (error) return { error: error.message };
  revalidatePath("/app/ai");
  return { ok: true };
}

// Syncs whichever provider is currently active for this salon (set by the
// admin in voice_settings.provider) - the salon owner doesn't need to know
// or choose between Retell/ElevenLabs, just click one "Übertragen" button.
export async function syncActiveVoiceAgentAction(): Promise<SyncResult> {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session);
  if (!salonId) return { ok: false, error: "Kein Salon gefunden." };

  const supabase = await createClient();
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
