"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { twilioProvider } from "@/lib/voice/providers/twilio";
import { loadVoiceAgentContext } from "@/lib/voice/build-config";

export type SyncResult = { ok: true; agentId: string; llmId: string } | { ok: false; error: string };

export async function syncTwilioNumberAction(salonId: string): Promise<SyncResult> {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const context = await loadVoiceAgentContext(supabase, salonId);
  if (!context.ok) return { ok: false, error: context.error };
  const { settings, configBase } = context;

  const appUrl = process.env.APP_URL;
  if (!appUrl) return { ok: false, error: "APP_URL ist nicht gesetzt (siehe .env.example)." };

  const result = await twilioProvider.syncAgent(
    {
      ...configBase,
      voiceId: "",
      webhookUrl: `${appUrl}/api/voice/webhook/twilio`,
    },
    { agentId: settings.twilio_phone_number_sid }
  );

  if (!result.ok) return result;

  await supabase
    .from("voice_settings")
    .update({ twilio_phone_number_sid: result.agentId, updated_at: new Date().toISOString() })
    .eq("salon_id", salonId);

  revalidatePath(`/admin/salons/${salonId}/ai`);
  return result;
}
