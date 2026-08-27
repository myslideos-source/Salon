"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { leadSchema, LEAD_STATUSES, type LeadStatus } from "@/lib/validation/leads";

export type ActionState = { error?: string; ok?: boolean } | null;

const LEADS_PATH = "/admin/leads";

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createLeadAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const parsed = leadSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.from("sales_leads").insert({
    name: parsed.data.name,
    address: parsed.data.address || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    website: parsed.data.website || null,
    distance_km: parsed.data.distance_km === "" || parsed.data.distance_km === undefined ? null : parsed.data.distance_km,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: error.message };
  revalidatePath(LEADS_PATH);
  return { ok: true };
}

export async function updateLeadStatusAction(id: string, status: LeadStatus) {
  await requirePlatformAdmin();
  if (!LEAD_STATUSES.includes(status)) return;
  const supabase = await createClient();
  await supabase.from("sales_leads").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(LEADS_PATH);
}

export async function updateLeadNotesAction(id: string, notes: string) {
  await requirePlatformAdmin();
  const supabase = await createClient();
  await supabase.from("sales_leads").update({ notes: notes || null, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(LEADS_PATH);
}

export async function deleteLeadAction(id: string) {
  await requirePlatformAdmin();
  const supabase = await createClient();
  await supabase.from("sales_leads").delete().eq("id", id);
  revalidatePath(LEADS_PATH);
}
