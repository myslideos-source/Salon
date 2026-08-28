"use server";

// Self-Service-Verwaltung individueller Felder (Konzeptabschnitt
// "Kundenverwaltung": "individuelle Felder"), gemeinsam genutzt für Kunden
// und Anfragen. Nutzt dieselbe has_permission('manage_settings')-Policy wie
// 0024_custom_field_definitions.sql. Jede Aktion prüft zusätzlich
// serverseitig Salon-Mitgliedschaft und Berechtigung.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { customFieldDefinitionSchema, slugifyFieldKey, type CustomFieldEntityType } from "@/lib/validation/custom-fields";

export type ActionState = { error?: string; ok?: boolean } | null;

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function requireSettingsAccess(salonId: string): Promise<string | null> {
  const session = await requireSalonSession();
  if (!session.isPlatformAdmin && !session.salons.some((s) => s.salonId === salonId)) {
    return "Kein Zugriff auf dieses Unternehmen.";
  }
  const allowed = await checkPermission(salonId, "manage_settings");
  if (!allowed) return "Dafür fehlt dir die Berechtigung.";
  return null;
}

function revalidateFieldPaths() {
  revalidatePath("/app/customers");
  revalidatePath("/app/requests");
}

export async function createCustomFieldDefinitionAction(
  salonId: string,
  entityType: CustomFieldEntityType,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const denied = await requireSettingsAccess(salonId);
  if (denied) return { error: denied };

  const raw = fd(formData);
  const optionsRaw = String(formData.get("options") ?? "[]");
  let options: string[] = [];
  try {
    options = JSON.parse(optionsRaw);
  } catch {
    options = [];
  }
  const parsed = customFieldDefinitionSchema.safeParse({ ...raw, options });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const key = slugifyFieldKey(parsed.data.label);
  const { data: existing } = await supabase
    .from("custom_field_definitions")
    .select("id")
    .eq("salon_id", salonId)
    .eq("entity_type", entityType)
    .eq("key", key)
    .maybeSingle();
  if (existing) return { error: "Ein Feld mit diesem Namen existiert bereits." };

  const { data: maxRow } = await supabase
    .from("custom_field_definitions")
    .select("sort_order")
    .eq("salon_id", salonId)
    .eq("entity_type", entityType)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("custom_field_definitions").insert({
    salon_id: salonId,
    entity_type: entityType,
    key,
    label: parsed.data.label,
    field_type: parsed.data.field_type,
    options: parsed.data.options,
    required: parsed.data.required,
    active: parsed.data.active,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });
  if (error) return { error: error.message };
  revalidateFieldPaths();
  return { ok: true };
}

export async function updateCustomFieldDefinitionAction(
  salonId: string,
  fieldId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const denied = await requireSettingsAccess(salonId);
  if (denied) return { error: denied };

  const raw = fd(formData);
  const optionsRaw = String(formData.get("options") ?? "[]");
  let options: string[] = [];
  try {
    options = JSON.parse(optionsRaw);
  } catch {
    options = [];
  }
  const parsed = customFieldDefinitionSchema.safeParse({ ...raw, options });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_field_definitions")
    .update({
      label: parsed.data.label,
      field_type: parsed.data.field_type,
      options: parsed.data.options,
      required: parsed.data.required,
      active: parsed.data.active,
    })
    .eq("id", fieldId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidateFieldPaths();
  return { ok: true };
}

export async function deleteCustomFieldDefinitionAction(salonId: string, fieldId: string): Promise<ActionState> {
  const denied = await requireSettingsAccess(salonId);
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { error } = await supabase.from("custom_field_definitions").delete().eq("id", fieldId).eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidateFieldPaths();
  return { ok: true };
}
