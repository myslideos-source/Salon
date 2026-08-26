"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { absenceSchema } from "@/lib/validation/salon";
import type { ActionState } from "@/lib/actions/admin";

// Usable by both salon users and platform admins — RLS on employee_absences
// allows any salon member to manage absences (section 44).
export async function createAbsenceAction(
  salonId: string,
  redirectPath: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = absenceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  if (new Date(parsed.data.start_at) >= new Date(parsed.data.end_at)) {
    return { error: "Start muss vor Ende liegen." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employee_absences").insert({
    salon_id: salonId,
    employee_id: parsed.data.employee_id,
    type: parsed.data.type,
    start_at: new Date(parsed.data.start_at).toISOString(),
    end_at: new Date(parsed.data.end_at).toISOString(),
    note: parsed.data.note || null,
  });
  if (error) return { error: error.message };
  revalidatePath(redirectPath);
  return { ok: true };
}

export async function removeAbsenceAction(salonId: string, id: string, redirectPath: string) {
  const supabase = await createClient();
  await supabase.from("employee_absences").delete().eq("id", id).eq("salon_id", salonId);
  revalidatePath(redirectPath);
}
