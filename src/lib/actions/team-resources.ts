"use server";

// Self-Service-Gegenstück zu `src/lib/actions/admin.ts` für Mitarbeiter,
// Arbeitszeiten und Ressourcen — nutzt die in
// `0031_self_service_team_resources_availability.sql` geöffneten
// has_permission('manage_team')-Policies statt Plattform-Admin-Rechten.
// Jede Aktion prüft zusätzlich serverseitig (nicht nur clientseitig
// ausgeblendet), dass der Aufrufer wirklich Mitglied des Salons ist.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import {
  employeeSchema,
  workingHourSchema,
} from "@/lib/validation/salon";
import { resourceSchema, resourceWorkingHourSchema } from "@/lib/validation/team-resources";

export type ActionState = { error?: string; ok?: boolean } | null;

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function requireTeamAccess(salonId: string): Promise<string | null> {
  const session = await requireSalonSession();
  if (resolveActiveSalonId(session) !== salonId) return "Kein Zugriff auf dieses Unternehmen.";
  const allowed = await checkPermission(salonId, "manage_team");
  if (!allowed) return "Dafür fehlt dir die Berechtigung.";
  return null;
}

// ── Employees ───────────────────────────────────────────────────────────

export async function createEmployeeSelfAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await requireTeamAccess(salonId);
  if (denied) return { error: denied };

  const parsed = employeeSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const locationId = String(formData.get("location_id") ?? "") || null;
  const { error } = await supabase.from("employees").insert({
    salon_id: salonId,
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name || "",
    color: parsed.data.color,
    active: parsed.data.active,
    location_id: locationId,
  });
  if (error) return { error: error.message };
  revalidatePath("/app/team");
  return { ok: true };
}

export async function updateEmployeeSelfAction(
  salonId: string,
  employeeId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const denied = await requireTeamAccess(salonId);
  if (denied) return { error: denied };

  const parsed = employeeSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const locationId = String(formData.get("location_id") ?? "") || null;
  const { error } = await supabase
    .from("employees")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name || "",
      color: parsed.data.color,
      active: parsed.data.active,
      location_id: locationId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath("/app/team");
  return { ok: true };
}

export async function deleteEmployeeSelfAction(salonId: string, employeeId: string) {
  const denied = await requireTeamAccess(salonId);
  if (denied) throw new Error(denied);
  const supabase = await createClient();
  const { error } = await supabase.from("employees").delete().eq("id", employeeId).eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/team");
}

// ── Employee working hours ─────────────────────────────────────────────

export async function addEmployeeWorkingHourSelfAction(
  salonId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const denied = await requireTeamAccess(salonId);
  if (denied) return { error: denied };

  const parsed = workingHourSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  if (parsed.data.start_time >= parsed.data.end_time) return { error: "Startzeit muss vor Endzeit liegen." };

  const supabase = await createClient();
  const { error } = await supabase.from("employee_working_hours").insert({
    salon_id: salonId,
    employee_id: parsed.data.employee_id,
    weekday: parsed.data.weekday,
    start_time: `${parsed.data.start_time}:00`,
    end_time: `${parsed.data.end_time}:00`,
  });
  if (error) return { error: error.message };
  revalidatePath("/app/team");
  return { ok: true };
}

export async function deleteEmployeeWorkingHourSelfAction(salonId: string, id: string) {
  const denied = await requireTeamAccess(salonId);
  if (denied) throw new Error(denied);
  const supabase = await createClient();
  const { error } = await supabase.from("employee_working_hours").delete().eq("id", id).eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/team");
}

// ── Resources ───────────────────────────────────────────────────────────

export async function createResourceAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await requireTeamAccess(salonId);
  if (denied) return { error: denied };

  const parsed = resourceSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.from("resources").insert({
    salon_id: salonId,
    name: parsed.data.name,
    type: parsed.data.type,
    description: parsed.data.description || null,
    location_id: parsed.data.location_id || null,
    color: parsed.data.color,
    active: parsed.data.active,
  });
  if (error) return { error: error.message };
  revalidatePath("/app/team");
  return { ok: true };
}

export async function updateResourceAction(
  salonId: string,
  resourceId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const denied = await requireTeamAccess(salonId);
  if (denied) return { error: denied };

  const parsed = resourceSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("resources")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description || null,
      location_id: parsed.data.location_id || null,
      color: parsed.data.color,
      active: parsed.data.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath("/app/team");
  return { ok: true };
}

export async function deleteResourceAction(salonId: string, resourceId: string) {
  const denied = await requireTeamAccess(salonId);
  if (denied) throw new Error(denied);
  const supabase = await createClient();
  const { error } = await supabase.from("resources").delete().eq("id", resourceId).eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/team");
}

// ── Resource working hours ─────────────────────────────────────────────

export async function addResourceWorkingHourAction(
  salonId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const denied = await requireTeamAccess(salonId);
  if (denied) return { error: denied };

  const parsed = resourceWorkingHourSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  if (parsed.data.start_time >= parsed.data.end_time) return { error: "Startzeit muss vor Endzeit liegen." };

  const supabase = await createClient();
  const { error } = await supabase.from("resource_working_hours").insert({
    salon_id: salonId,
    resource_id: parsed.data.resource_id,
    weekday: parsed.data.weekday,
    start_time: `${parsed.data.start_time}:00`,
    end_time: `${parsed.data.end_time}:00`,
  });
  if (error) return { error: error.message };
  revalidatePath("/app/team");
  return { ok: true };
}

export async function deleteResourceWorkingHourAction(salonId: string, id: string) {
  const denied = await requireTeamAccess(salonId);
  if (denied) throw new Error(denied);
  const supabase = await createClient();
  const { error } = await supabase.from("resource_working_hours").delete().eq("id", id).eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/team");
}
