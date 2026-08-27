"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { z } from "zod";
import type { ActionState } from "@/lib/actions/admin";

const schema = z.object({
  provider: z.enum(["retell", "elevenlabs"]),
  voice_id: z.string().min(1),
  elevenlabs_voice_id: z.string().optional().or(z.literal("")),
  greeting: z.string().min(1),
  personality: z.enum(["freundlich", "professionell", "locker", "elegant"]),
  phone_number: z.string().optional().or(z.literal("")),
  forwarding_number: z.string().optional().or(z.literal("")),
  mention_prices: z.coerce.boolean(),
  offer_alternatives: z.coerce.boolean(),
  respect_employee_preference: z.coerce.boolean(),
  offer_callback: z.coerce.boolean(),
  detect_new_customers: z.coerce.boolean(),
  send_confirmation_sms: z.coerce.boolean(),
});

export async function updateVoiceSettingsAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("voice_settings")
    .upsert({
      salon_id: salonId,
      provider: parsed.data.provider,
      voice_id: parsed.data.voice_id,
      elevenlabs_voice_id: parsed.data.elevenlabs_voice_id || null,
      greeting: parsed.data.greeting,
      personality: parsed.data.personality,
      phone_number: parsed.data.phone_number || null,
      forwarding_number: parsed.data.forwarding_number || null,
      mention_prices: parsed.data.mention_prices,
      offer_alternatives: parsed.data.offer_alternatives,
      respect_employee_preference: parsed.data.respect_employee_preference,
      offer_callback: parsed.data.offer_callback,
      detect_new_customers: parsed.data.detect_new_customers,
      send_confirmation_sms: parsed.data.send_confirmation_sms,
      updated_at: new Date().toISOString(),
    });
  if (error) return { error: error.message };
  revalidatePath(`/admin/salons/${salonId}/ai`);
  return { ok: true };
}
