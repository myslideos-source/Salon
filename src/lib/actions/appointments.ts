"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  checkAvailability,
  createAppointment,
  rescheduleAppointment,
  resizeAppointment,
  cancelAppointment,
  getServiceCombo,
  SchedulingError,
} from "@/lib/scheduling/engine";
import type { PreferredTimeRange } from "@/lib/scheduling/availability";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function checkAvailabilityAction(params: {
  salonId: string;
  employeeId: string;
  serviceIds: string[];
  date: string;
  preferredTimeRange?: PreferredTimeRange;
}): Promise<ActionResult<{ slots: string[]; durationMinutes: number; totalPriceCents: number }>> {
  const supabase = await createClient();
  try {
    const result = await checkAvailability(supabase, params);
    return {
      ok: true,
      data: { slots: result.slots, durationMinutes: result.combo.durationMinutes, totalPriceCents: result.combo.totalPriceCents },
    };
  } catch (e) {
    return { ok: false, error: e instanceof SchedulingError ? e.message : "Unbekannter Fehler" };
  }
}

export async function serviceComboAction(
  salonId: string,
  employeeId: string,
  serviceIds: string[]
): Promise<ActionResult<{ durationMinutes: number; totalPriceCents: number }>> {
  const supabase = await createClient();
  try {
    const combo = await getServiceCombo(supabase, salonId, employeeId, serviceIds);
    return { ok: true, data: { durationMinutes: combo.durationMinutes, totalPriceCents: combo.totalPriceCents } };
  } catch (e) {
    return { ok: false, error: e instanceof SchedulingError ? e.message : "Unbekannter Fehler" };
  }
}

export async function createAppointmentAction(params: {
  salonId: string;
  customerId: string;
  employeeId: string;
  serviceIds: string[];
  startAt: string;
  notes?: string;
  revalidate: string;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  try {
    const appt = await createAppointment(supabase, { ...params, source: "manual" });
    revalidatePath(params.revalidate);
    return { ok: true, data: { id: (appt as { id: string }).id } };
  } catch (e) {
    return { ok: false, error: e instanceof SchedulingError ? e.message : "Unbekannter Fehler" };
  }
}

export async function findCustomerByPhoneAction(
  salonId: string,
  phone: string
): Promise<ActionResult<{ id: string; firstName: string; lastName: string } | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, first_name, last_name")
    .eq("salon_id", salonId)
    .eq("phone", phone.trim())
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? { id: data.id, firstName: data.first_name, lastName: data.last_name } : null };
}

export async function createManualAppointmentAction(params: {
  salonId: string;
  employeeId: string;
  serviceIds: string[];
  startAt: string;
  notes?: string;
  customerPhone: string;
  customerFirstName: string;
  customerLastName: string;
  revalidate: string;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  try {
    let { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("salon_id", params.salonId)
      .eq("phone", params.customerPhone.trim())
      .maybeSingle();

    if (!customer) {
      const { data: created, error: createError } = await supabase
        .from("customers")
        .insert({
          salon_id: params.salonId,
          phone: params.customerPhone.trim(),
          first_name: params.customerFirstName,
          last_name: params.customerLastName,
        })
        .select("id")
        .single();
      if (createError) throw new SchedulingError("invalid_input", createError.message);
      customer = created;
    }

    const appt = await createAppointment(supabase, {
      salonId: params.salonId,
      customerId: customer.id,
      employeeId: params.employeeId,
      serviceIds: params.serviceIds,
      startAt: params.startAt,
      notes: params.notes,
      source: "manual",
    });
    revalidatePath(params.revalidate);
    return { ok: true, data: { id: (appt as { id: string }).id } };
  } catch (e) {
    return { ok: false, error: e instanceof SchedulingError ? e.message : "Unbekannter Fehler" };
  }
}

export async function rescheduleAppointmentAction(params: {
  salonId: string;
  appointmentId: string;
  newEmployeeId: string;
  newStartAt: string;
  revalidate: string;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  try {
    const appt = await rescheduleAppointment(supabase, params);
    revalidatePath(params.revalidate);
    return { ok: true, data: { id: (appt as { id: string }).id } };
  } catch (e) {
    return { ok: false, error: e instanceof SchedulingError ? e.message : "Unbekannter Fehler" };
  }
}

export async function resizeAppointmentAction(params: {
  salonId: string;
  appointmentId: string;
  newDurationMinutes: number;
  revalidate: string;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  try {
    const appt = await resizeAppointment(supabase, params);
    revalidatePath(params.revalidate);
    return { ok: true, data: { id: (appt as { id: string }).id } };
  } catch (e) {
    return { ok: false, error: e instanceof SchedulingError ? e.message : "Unbekannter Fehler" };
  }
}

export async function cancelAppointmentAction(salonId: string, appointmentId: string, revalidate: string) {
  const supabase = await createClient();
  await cancelAppointment(supabase, salonId, appointmentId);
  revalidatePath(revalidate);
}

export async function markAppointmentStatusAction(
  salonId: string,
  appointmentId: string,
  status: "completed" | "no_show" | "booked",
  revalidate: string
) {
  const supabase = await createClient();
  await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("salon_id", salonId);
  revalidatePath(revalidate);
}
