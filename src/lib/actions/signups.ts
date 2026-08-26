"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";

export async function updateSignupRequestStatusAction(
  id: string,
  status: "new" | "contacted" | "activated" | "declined"
) {
  const session = await requirePlatformAdmin();
  const supabase = await createClient();
  await supabase
    .from("signup_requests")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: session.userId })
    .eq("id", id);
  revalidatePath("/admin/signups");
}
