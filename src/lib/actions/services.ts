"use server";

// Self-Service-Gegenstück zu `src/lib/actions/admin.ts` für Terminarten und
// Leistungen (Konzeptabschnitt "Flexible Terminarten") — nutzt die in
// `0033_services_self_service.sql` geöffneten has_permission('manage_services')
// -Policies statt Plattform-Admin-Rechten. Jede Aktion prüft zusätzlich
// serverseitig (nicht nur clientseitig ausgeblendet), dass der Aufrufer
// wirklich Mitglied des Salons ist und die Berechtigung besitzt.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { serviceSchema, parseCustomQuestions, parseRequiredFields, type ServiceInput } from "@/lib/validation/services";

export type ActionState = { error?: string; ok?: boolean } | null;

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function revalidateServicePaths() {
  revalidatePath("/app/services");
  revalidatePath("/app/onboarding");
}

async function requireServicesAccess(salonId: string): Promise<string | null> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session) !== salonId) return "Kein Zugriff auf dieses Unternehmen.";
  const allowed = await checkPermission(salonId, "manage_services");
  if (!allowed) return "Dafür fehlt dir die Berechtigung.";
  return null;
}

function serviceRow(salonId: string, formData: FormData, parsed: ServiceInput) {
  return {
    salon_id: salonId,
    name: parsed.name,
    description: parsed.description || null,
    category: parsed.category || null,
    duration_minutes: parsed.duration_minutes,
    has_price: parsed.has_price,
    price_cents: parsed.has_price ? parsed.price_cents : 0,
    buffer_before_minutes: parsed.buffer_before_minutes,
    buffer_after_minutes: parsed.buffer_after_minutes,
    color: parsed.color,
    location_id: parsed.location_id || null,
    bookable_phone: parsed.bookable_phone,
    bookable_online: parsed.bookable_online,
    active: parsed.active,
    required_customer_fields: parseRequiredFields(safeJsonParse(formData.get("required_customer_fields"))),
    custom_questions: parseCustomQuestions(safeJsonParse(formData.get("custom_questions"))),
  };
}

function safeJsonParse(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

async function syncServiceAssignments(salonId: string, serviceId: string, formData: FormData) {
  const supabase = await createClient();
  const employeeIds = formData.getAll("employee_ids").map(String).filter(Boolean);
  const resourceIds = formData.getAll("resource_ids").map(String).filter(Boolean);

  await supabase.from("employee_services").delete().eq("service_id", serviceId).eq("salon_id", salonId);
  if (employeeIds.length > 0) {
    await supabase
      .from("employee_services")
      .insert(employeeIds.map((employee_id) => ({ salon_id: salonId, employee_id, service_id: serviceId })));
  }

  await supabase.from("service_resources").delete().eq("service_id", serviceId).eq("salon_id", salonId);
  if (resourceIds.length > 0) {
    await supabase
      .from("service_resources")
      .insert(resourceIds.map((resource_id) => ({ salon_id: salonId, resource_id, service_id: serviceId })));
  }
}

// ── Services ────────────────────────────────────────────────────────────

export async function createServiceSelfAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await requireServicesAccess(salonId);
  if (denied) return { error: denied };

  const parsed = serviceSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { data: service, error } = await supabase
    .from("services")
    .insert(serviceRow(salonId, formData, parsed.data))
    .select("id")
    .single();
  if (error) return { error: error.message };

  await syncServiceAssignments(salonId, service.id, formData);
  revalidateServicePaths();
  return { ok: true };
}

export async function updateServiceSelfAction(
  salonId: string,
  serviceId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const denied = await requireServicesAccess(salonId);
  if (denied) return { error: denied };

  const parsed = serviceSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ ...serviceRow(salonId, formData, parsed.data), updated_at: new Date().toISOString() })
    .eq("id", serviceId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  await syncServiceAssignments(salonId, serviceId, formData);
  revalidateServicePaths();
  return { ok: true };
}

// Löschen ist per Fremdschlüssel (appointment_services.service_id, "on
// delete restrict") bereits auf Datenbankebene blockiert, solange
// Termine diese Terminart referenzieren — sichere Behandlung bereits
// vorhandener Termine, ohne Buchungshistorie zu verwaisen. Statt einer
// harten Exception bekommt der Nutzer hier eine verständliche Meldung und
// den Hinweis, die Terminart stattdessen zu deaktivieren.
export async function deleteServiceSelfAction(salonId: string, serviceId: string): Promise<ActionState> {
  const denied = await requireServicesAccess(salonId);
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", serviceId).eq("salon_id", salonId);
  if (error) {
    if (error.code === "23503") {
      return {
        error: "Diese Terminart wird bereits von bestehenden Terminen verwendet und kann nicht gelöscht werden. Deaktiviere sie stattdessen.",
      };
    }
    return { error: error.message };
  }
  revalidateServicePaths();
  return { ok: true };
}

export async function toggleServiceActiveSelfAction(salonId: string, serviceId: string, active: boolean): Promise<ActionState> {
  const denied = await requireServicesAccess(salonId);
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", serviceId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidateServicePaths();
  return { ok: true };
}
