"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  salonSchema,
  employeeSchema,
  serviceSchema,
  workingHourSchema,
  businessHourSchema,
  absenceSchema,
} from "@/lib/validation/salon";

export type ActionState = { error?: string; ok?: boolean } | null;

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

// ── Salons ──────────────────────────────────────────────────────────────

export async function createSalonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const parsed = salonSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { data: salon, error } = await supabase
    .from("salons")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      timezone: parsed.data.timezone,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      slot_granularity_minutes: parsed.data.slot_granularity_minutes,
      earliest_booking_lead_minutes: parsed.data.earliest_booking_lead_minutes,
      max_advance_booking_days: parsed.data.max_advance_booking_days,
    })
    .select("id")
    .single();

  if (error) return { error: error.code === "23505" ? "Dieser Slug ist bereits vergeben." : error.message };

  // Seed default (closed) business hours rows Mon–Sun and default voice settings.
  await supabase.from("business_hours").insert(
    Array.from({ length: 7 }, (_, weekday) => ({
      salon_id: salon.id,
      weekday,
      is_closed: weekday === 1,
      start_time: weekday === 1 ? null : "09:00:00",
      end_time: weekday === 1 ? null : "18:00:00",
    }))
  );
  await supabase.from("voice_settings").insert({
    salon_id: salon.id,
    greeting: `Hallo und herzlich willkommen bei ${parsed.data.name}. Sie sprechen mit unserer digitalen Telefonassistenz. Wie kann ich Ihnen helfen?`,
  });

  revalidatePath("/admin/salons");
  redirect(`/admin/salons/${salon.id}`);
}

export async function updateSalonAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const parsed = salonSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("salons")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      timezone: parsed.data.timezone,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      slot_granularity_minutes: parsed.data.slot_granularity_minutes,
      earliest_booking_lead_minutes: parsed.data.earliest_booking_lead_minutes,
      max_advance_booking_days: parsed.data.max_advance_booking_days,
      updated_at: new Date().toISOString(),
    })
    .eq("id", salonId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/salons/${salonId}`);
  return { ok: true };
}

export async function setSalonStatusAction(salonId: string, status: "active" | "paused" | "trial") {
  await requirePlatformAdmin();
  const supabase = await createClient();
  await supabase.from("salons").update({ status, updated_at: new Date().toISOString() }).eq("id", salonId);
  revalidatePath("/admin/salons");
  revalidatePath(`/admin/salons/${salonId}`);
}

export async function setSalonAiActiveAction(salonId: string, active: boolean) {
  await requirePlatformAdmin();
  const supabase = await createClient();
  await supabase.from("salons").update({ ai_active: active, updated_at: new Date().toISOString() }).eq("id", salonId);
  revalidatePath("/admin/salons");
  revalidatePath(`/admin/salons/${salonId}`);
}

// ── Employees ───────────────────────────────────────────────────────────

export async function createEmployeeAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const parsed = employeeSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.from("employees").insert({
    salon_id: salonId,
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name || "",
    color: parsed.data.color,
    active: parsed.data.active,
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/salons/${salonId}/employees`);
  return { ok: true };
}

export async function updateEmployeeAction(salonId: string, employeeId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const parsed = employeeSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name || "",
      color: parsed.data.color,
      active: parsed.data.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/salons/${salonId}/employees`);
  return { ok: true };
}

export async function deleteEmployeeAction(salonId: string, employeeId: string) {
  await requirePlatformAdmin();
  const supabase = await createClient();
  await supabase.from("employees").delete().eq("id", employeeId).eq("salon_id", salonId);
  revalidatePath(`/admin/salons/${salonId}/employees`);
}

// ── Services ────────────────────────────────────────────────────────────

export async function createServiceAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const parsed = serviceSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({ salon_id: salonId, ...parsed.data, category: parsed.data.category || null });
  if (error) return { error: error.message };
  revalidatePath(`/admin/salons/${salonId}/services`);
  return { ok: true };
}

export async function updateServiceAction(salonId: string, serviceId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const parsed = serviceSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ ...parsed.data, category: parsed.data.category || null, updated_at: new Date().toISOString() })
    .eq("id", serviceId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/salons/${salonId}/services`);
  return { ok: true };
}

export async function deleteServiceAction(salonId: string, serviceId: string) {
  await requirePlatformAdmin();
  const supabase = await createClient();
  await supabase.from("services").delete().eq("id", serviceId).eq("salon_id", salonId);
  revalidatePath(`/admin/salons/${salonId}/services`);
}

export async function setEmployeeServiceAction(
  salonId: string,
  employeeId: string,
  serviceId: string,
  enabled: boolean
) {
  await requirePlatformAdmin();
  const supabase = await createClient();
  if (enabled) {
    await supabase.from("employee_services").upsert({ salon_id: salonId, employee_id: employeeId, service_id: serviceId });
  } else {
    await supabase.from("employee_services").delete().eq("employee_id", employeeId).eq("service_id", serviceId);
  }
  revalidatePath(`/admin/salons/${salonId}/services`);
}

// ── Business hours ──────────────────────────────────────────────────────

export async function updateBusinessHoursAction(salonId: string, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const rows = Array.from({ length: 7 }, (_, weekday) => {
    const parsed = businessHourSchema.safeParse({
      weekday,
      is_closed: formData.get(`closed_${weekday}`) === "on",
      start_time: formData.get(`start_${weekday}`),
      end_time: formData.get(`end_${weekday}`),
    });
    if (!parsed.success) return null;
    return {
      salon_id: salonId,
      weekday,
      is_closed: parsed.data.is_closed,
      start_time: parsed.data.is_closed ? null : `${parsed.data.start_time}:00`,
      end_time: parsed.data.is_closed ? null : `${parsed.data.end_time}:00`,
    };
  }).filter(Boolean);

  const { error } = await supabase.from("business_hours").upsert(rows as never[], { onConflict: "salon_id,weekday" });
  if (error) return { error: error.message };
  revalidatePath(`/admin/salons/${salonId}/hours`);
  return { ok: true };
}

// ── Working hours ───────────────────────────────────────────────────────

export async function addWorkingHourAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
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
  revalidatePath(`/admin/salons/${salonId}/hours`);
  return { ok: true };
}

export async function deleteWorkingHourAction(salonId: string, id: string) {
  await requirePlatformAdmin();
  const supabase = await createClient();
  await supabase.from("employee_working_hours").delete().eq("id", id).eq("salon_id", salonId);
  revalidatePath(`/admin/salons/${salonId}/hours`);
}

// ── Absences (admin side; salon users have their own action) ───────────

export async function addAbsenceAction(salonId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const parsed = absenceSchema.safeParse(fd(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  if (new Date(parsed.data.start_at) >= new Date(parsed.data.end_at)) {
    return { error: "Start muss vor Ende liegen." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employee_absences").insert({
    salon_id: salonId,
    employee_id: parsed.data.employee_id,
    type: parsed.data.type,
    start_at: new Date(parsed.data.start_at).toISOString(),
    end_at: new Date(parsed.data.end_at).toISOString(),
    note: parsed.data.note || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/salons/${salonId}/hours`);
  return { ok: true };
}

export async function deleteAbsenceAction(salonId: string, id: string, redirectPath: string) {
  const supabase = await createClient();
  await supabase.from("employee_absences").delete().eq("id", id).eq("salon_id", salonId);
  revalidatePath(redirectPath);
}
