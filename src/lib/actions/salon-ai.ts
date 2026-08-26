"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleSalonAiAction(salonId: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("toggle_salon_ai", {
    target_salon_id: salonId,
    active,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app", "layout");
  revalidatePath("/admin/salons/[salonId]", "page");
}
