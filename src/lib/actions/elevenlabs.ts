"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { elevenLabsProvider } from "@/lib/voice/providers/elevenlabs";
import { loadVoiceAgentContext } from "@/lib/voice/build-config";

export type SyncResult = { ok: true; agentId: string; llmId: string } | { ok: false; error: string };

export async function syncElevenLabsAgentAction(salonId: string): Promise<SyncResult> {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const context = await loadVoiceAgentContext(supabase, salonId);
  if (!context.ok) return { ok: false, error: context.error };
  const { settings, configBase } = context;

  const appUrl = process.env.APP_URL;
  if (!appUrl) return { ok: false, error: "APP_URL ist nicht gesetzt (siehe .env.example)." };

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

  revalidatePath(`/admin/salons/${salonId}/ai`);
  return result;
}
