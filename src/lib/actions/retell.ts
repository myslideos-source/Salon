"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { retellProvider } from "@/lib/voice/providers/retell";
import { loadVoiceAgentContext } from "@/lib/voice/build-config";

export type SyncResult = { ok: true; agentId: string; llmId: string } | { ok: false; error: string };

export async function syncRetellAgentAction(salonId: string): Promise<SyncResult> {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const context = await loadVoiceAgentContext(supabase, salonId);
  if (!context.ok) return { ok: false, error: context.error };
  const { settings, configBase } = context;

  const appUrl = process.env.APP_URL;
  if (!appUrl) return { ok: false, error: "APP_URL ist nicht gesetzt (siehe .env.example)." };

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

  revalidatePath(`/admin/salons/${salonId}/ai`);
  return result;
}
