"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { customerSchema } from "@/lib/validation/salon";
import type { ActionState } from "@/lib/actions/admin";

export async function createCustomerAction(
  salonId: string,
  redirectPath: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = customerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    salon_id: salonId,
    first_name: parsed.data.first_name || "",
    last_name: parsed.data.last_name || "",
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    preferred_employee_id: parsed.data.preferred_employee_id || null,
    notes: parsed.data.notes || null,
  });
  if (error) {
    return { error: error.code === "23505" ? "Diese Telefonnummer ist bereits erfasst." : error.message };
  }
  revalidatePath(redirectPath);
  return { ok: true };
}

export async function updateCustomerAction(
  salonId: string,
  customerId: string,
  redirectPath: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = customerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      first_name: parsed.data.first_name || "",
      last_name: parsed.data.last_name || "",
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      preferred_employee_id: parsed.data.preferred_employee_id || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(redirectPath);
  return { ok: true };
}
