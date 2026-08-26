"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { retellProvider } from "@/lib/voice/providers/retell";

export type SyncResult = { ok: true; agentId: string; llmId: string } | { ok: false; error: string };

export async function syncRetellAgentAction(salonId: string): Promise<SyncResult> {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const [{ data: salon }, { data: settings }] = await Promise.all([
    supabase.from("salons").select("name, timezone").eq("id", salonId).single(),
    supabase.from("voice_settings").select("*").eq("salon_id", salonId).maybeSingle(),
  ]);

  if (!salon) return { ok: false, error: "Salon nicht gefunden." };
  if (!settings) return { ok: false, error: "Bitte zuerst die KI-Einstellungen speichern." };

  const appUrl = process.env.APP_URL;
  if (!appUrl) return { ok: false, error: "APP_URL ist nicht gesetzt (siehe .env.example)." };

  const result = await retellProvider.syncAgent({
    salonId,
    salonName: salon.name,
    timezone: salon.timezone,
    greeting: settings.greeting,
    personality: settings.personality,
    voiceId: settings.voice_id,
    phoneNumber: settings.phone_number,
    forwardingNumber: settings.forwarding_number,
    rules: {
      mentionPrices: settings.mention_prices,
      offerAlternatives: settings.offer_alternatives,
      respectEmployeePreference: settings.respect_employee_preference,
      offerCallback: settings.offer_callback,
      detectNewCustomers: settings.detect_new_customers,
    },
    webhookUrl: `${appUrl}/api/voice/webhook`,
  }, { agentId: settings.provider_agent_id, llmId: settings.provider_llm_id });

  if (!result.ok) return result;

  await supabase
    .from("voice_settings")
    .update({ provider_agent_id: result.agentId, provider_llm_id: result.llmId, updated_at: new Date().toISOString() })
    .eq("salon_id", salonId);

  revalidatePath(`/admin/salons/${salonId}/ai`);
  return result;
}
