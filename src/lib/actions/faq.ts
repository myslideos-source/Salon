"use server";

// Self-Service für "Häufige Fragen" (Konzeptabschnitt "Meine Mia" - FAQ),
// gleiches Muster wie lib/actions/locations.ts: die `faq`-Tabelle
// (0020_faq.sql) ist bereits über has_permission('manage_settings')
// self-service-schreibbar, hier kommt nur die serverseitige
// Zugriffsprüfung + Validierung dazu.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { faqSchema } from "@/lib/validation/faq";

export type ActionState = { error?: string; ok?: boolean } | null;

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function requireFaqAccess(salonId: string): Promise<string | null> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session) !== salonId) return "Kein Zugriff auf dieses Unternehmen.";
  const allowed = await checkPermission(salonId, "manage_settings");
  if (!allowed) return "Dafür fehlt dir die Berechtigung.";
  return null;
}

export async function createFaqAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await requireFaqAccess(salonId);
  if (denied) return { error: denied };

  const parsed = faqSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.from("faq").insert({
    salon_id: salonId,
    question: parsed.data.question,
    answer: parsed.data.answer,
    category: parsed.data.category || null,
    active: parsed.data.active,
  });
  if (error) return { error: error.message };
  revalidatePath("/app/ai");
  return { ok: true };
}

export async function updateFaqAction(salonId: string, faqId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await requireFaqAccess(salonId);
  if (denied) return { error: denied };

  const parsed = faqSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("faq")
    .update({
      question: parsed.data.question,
      answer: parsed.data.answer,
      category: parsed.data.category || null,
      active: parsed.data.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", faqId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath("/app/ai");
  return { ok: true };
}

export async function deleteFaqAction(salonId: string, faqId: string): Promise<void> {
  const denied = await requireFaqAccess(salonId);
  if (denied) throw new Error(denied);

  const supabase = await createClient();
  const { error } = await supabase.from("faq").delete().eq("id", faqId).eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/ai");
}

export async function toggleFaqActiveAction(salonId: string, faqId: string, active: boolean): Promise<void> {
  const denied = await requireFaqAccess(salonId);
  if (denied) throw new Error(denied);

  const supabase = await createClient();
  const { error } = await supabase
    .from("faq")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", faqId)
    .eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/ai");
}
