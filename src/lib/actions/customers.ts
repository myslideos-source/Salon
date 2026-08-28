"use server";

// Self-Service-Gegenstück zu `src/lib/actions/admin.ts` für die
// Kundenverwaltung (Konzeptabschnitt "Kundenverwaltung erweitern") — nutzt
// dieselbe `has_permission('manage_customers')`-Prüfung wie die übrigen
// Self-Service-Domänen (Muster: services.ts). Bewusst NICHT verschärft auf
// RLS-Ebene (customers bleibt is_salon_member-scoped, siehe Migration
// 0034), da createManualAppointmentAction beim Buchen im Kalender auch für
// die Rolle "Nur Kalenderzugriff" neue Kunden anlegen können muss — die
// Berechtigungsprüfung für die eigentliche Kundenverwaltung passiert daher
// hier auf Anwendungsebene.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { customerSelfSchema, parseTags, type CustomerSelfInput } from "@/lib/validation/customers";
import { parseCustomFieldValues, type CustomFieldDefinition } from "@/lib/validation/custom-fields";
import { findDuplicateCustomers, type DuplicateMatch } from "@/lib/customers/dedupe";
import type { Json } from "@/lib/supabase/database.types";

export type ActionState = {
  error?: string;
  ok?: boolean;
  duplicates?: DuplicateMatch[];
} | null;

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function safeJsonParse(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function requireCustomersAccess(salonId: string): Promise<string | null> {
  const session = await requireSalonSession();
  // Admin pages render the same CustomerForm/actions for an arbitrary
  // salonId that isn't the admin's own membership - pass salonId through
  // so resolveActiveSalonId can honor the platform-admin override branch
  // instead of falling back to session.salons[0] (which is empty/wrong for
  // an admin with no personal salon membership).
  if (resolveActiveSalonId(session, salonId) !== salonId) return "Kein Zugriff auf dieses Unternehmen.";
  const allowed = await checkPermission(salonId, "manage_customers");
  if (!allowed) return "Dafür fehlt dir die Berechtigung.";
  return null;
}

async function activeCustomerFieldDefinitions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  salonId: string
): Promise<CustomFieldDefinition[]> {
  const { data } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .eq("salon_id", salonId)
    .eq("entity_type", "customer")
    .eq("active", true)
    .order("sort_order");
  return (data ?? []) as CustomFieldDefinition[];
}

function customerRow(salonId: string, parsed: CustomerSelfInput, tags: string[], customFields: Record<string, unknown>) {
  return {
    salon_id: salonId,
    first_name: parsed.first_name || "",
    last_name: parsed.last_name || "",
    phone: parsed.phone,
    email: parsed.email || null,
    preferred_employee_id: parsed.preferred_employee_id || null,
    notes: parsed.notes || null,
    status: parsed.status,
    address: parsed.address || null,
    company: parsed.company || null,
    tags,
    consent_recording: parsed.consent_recording,
    consent_marketing: parsed.consent_marketing,
    custom_fields: customFields as Json,
  };
}

export async function createCustomerAction(
  salonId: string,
  redirectPath: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const denied = await requireCustomersAccess(salonId);
  if (denied) return { error: denied };

  const parsed = customerSelfSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();

  // Dubletten sind nur ein Hinweis, kein Blocker — ein zweiter Klick auf
  // "Trotzdem anlegen" (confirm_duplicate=true) legt den Kunden trotzdem an.
  if (formData.get("confirm_duplicate") !== "true") {
    const duplicates = await findDuplicateCustomers(supabase, salonId, {
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
    });
    if (duplicates.length > 0) return { duplicates };
  }

  const definitions = await activeCustomerFieldDefinitions(supabase, salonId);
  const { values: customFields, error: cfError } = parseCustomFieldValues(definitions, safeJsonParse(formData.get("custom_fields")));
  if (cfError) return { error: cfError };

  const { error } = await supabase
    .from("customers")
    .insert(customerRow(salonId, parsed.data, parseTags(safeJsonParse(formData.get("tags"))), customFields));
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
  const denied = await requireCustomersAccess(salonId);
  if (denied) return { error: denied };

  const parsed = customerSelfSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();

  if (formData.get("confirm_duplicate") !== "true") {
    const duplicates = await findDuplicateCustomers(supabase, salonId, {
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      excludeId: customerId,
    });
    if (duplicates.length > 0) return { duplicates };
  }

  const definitions = await activeCustomerFieldDefinitions(supabase, salonId);
  const { values: customFields, error: cfError } = parseCustomFieldValues(definitions, safeJsonParse(formData.get("custom_fields")));
  if (cfError) return { error: cfError };

  const { error } = await supabase
    .from("customers")
    .update({
      ...customerRow(salonId, parsed.data, parseTags(safeJsonParse(formData.get("tags"))), customFields),
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(redirectPath);
  return { ok: true };
}

// DSGVO Art. 17 — Löschung/Anonymisierung statt Hard-Delete (siehe
// 0026_gdpr.sql, delete_customer_data). Nicht rückgängig zu machen.
export async function deleteCustomerDataAction(salonId: string, customerId: string, redirectPath: string): Promise<ActionState> {
  const denied = await requireCustomersAccess(salonId);
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_customer_data", { target_customer_id: customerId });
  if (error) return { error: error.message };
  revalidatePath(redirectPath);
  return { ok: true };
}

// DSGVO Art. 15/20 — vollständiger Export als JSON (siehe 0026_gdpr.sql,
// export_customer_data).
export async function exportCustomerDataAction(
  salonId: string,
  customerId: string
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const denied = await requireCustomersAccess(salonId);
  if (denied) return { ok: false, error: denied };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_customer_data", { target_customer_id: customerId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}
