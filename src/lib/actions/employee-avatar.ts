"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/auth/session";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function uploadEmployeeAvatarAction(
  salonId: string,
  employeeId: string,
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requirePlatformAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Keine Datei ausgewählt." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Bitte ein Bild hochladen." };
  if (file.size > MAX_SIZE_BYTES) return { ok: false, error: "Bild darf höchstens 5 MB groß sein." };

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `employees/${employeeId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("employees")
    .update({ avatar_url: data.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", employeeId)
    .eq("salon_id", salonId);
  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath(`/admin/salons/${salonId}/employees`);
  return { ok: true, url: data.publicUrl };
}

export async function removeEmployeeAvatarAction(salonId: string, employeeId: string) {
  await requirePlatformAdmin();
  const supabase = createAdminClient();
  await supabase
    .from("employees")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", employeeId)
    .eq("salon_id", salonId);
  revalidatePath(`/admin/salons/${salonId}/employees`);
}
