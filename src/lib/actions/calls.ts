"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateCallbackStatusAction(
  salonId: string,
  callbackId: string,
  status: "open" | "contacted" | "resolved",
  revalidate: string
) {
  const supabase = await createClient();
  await supabase.from("callback_requests").update({ status }).eq("id", callbackId).eq("salon_id", salonId);
  revalidatePath(revalidate);
}
