"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { locationSchema } from "@/lib/validation/team-resources";

export type ActionState = { error?: string; ok?: boolean } | null;

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function requireLocationAccess(salonId: string): Promise<string | null> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session) !== salonId) return "Kein Zugriff auf dieses Unternehmen.";
  const allowed = await checkPermission(salonId, "manage_settings");
  if (!allowed) return "Dafür fehlt dir die Berechtigung.";
  return null;
}

export async function createLocationAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await requireLocationAccess(salonId);
  if (denied) return { error: denied };

  const parsed = locationSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert({
    salon_id: salonId,
    name: parsed.data.name,
    address: parsed.data.address || null,
    phone: parsed.data.phone || null,
    timezone: parsed.data.timezone || null,
    active: parsed.data.active,
    is_default: false,
  });
  if (error) return { error: error.message };
  revalidatePath("/app/locations");
  revalidatePath("/app/onboarding");
  return { ok: true };
}

export async function updateLocationAction(
  salonId: string,
  locationId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const denied = await requireLocationAccess(salonId);
  if (denied) return { error: denied };

  const parsed = locationSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({
      name: parsed.data.name,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      timezone: parsed.data.timezone || null,
      active: parsed.data.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", locationId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath("/app/locations");
  return { ok: true };
}

// Genau ein Standort pro Unternehmen darf `is_default` sein (partieller
// Unique-Index, siehe 0014_locations.sql) — er ist das implizite Ziel für
// jeden bestehenden Datensatz mit `location_id = null`. Zwei Schritte statt
// eines Transaktions-RPCs, da hier kein sicherheitskritisches Feld
// betroffen ist und ein kurzes Zwischen-"kein Default" unkritisch ist.
export async function setDefaultLocationAction(salonId: string, locationId: string) {
  const denied = await requireLocationAccess(salonId);
  if (denied) throw new Error(denied);
  const supabase = await createClient();
  await supabase.from("locations").update({ is_default: false }).eq("salon_id", salonId).eq("is_default", true);
  const { error } = await supabase.from("locations").update({ is_default: true }).eq("id", locationId).eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/locations");
}

export async function deleteLocationAction(salonId: string, locationId: string) {
  const denied = await requireLocationAccess(salonId);
  if (denied) throw new Error(denied);

  const supabase = await createClient();
  const { data: location } = await supabase.from("locations").select("is_default").eq("id", locationId).eq("salon_id", salonId).maybeSingle();
  if (location?.is_default) throw new Error("Der Standard-Standort kann nicht gelöscht werden.");

  const { count } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId);
  if ((count ?? 0) <= 1) throw new Error("Es muss mindestens ein Standort bestehen bleiben.");

  const { error } = await supabase.from("locations").delete().eq("id", locationId).eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/locations");
}
