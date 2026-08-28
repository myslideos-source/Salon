import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  computeFreeSlots,
  localDayBoundsUtc,
  type BusinessHoursForDay,
  type PreferredTimeRange,
} from "./availability";
import { sendAppointmentConfirmationSms } from "@/lib/notifications/appointment-sms";

export type DbClient = SupabaseClient<Database>;

export class SchedulingError extends Error {
  constructor(public code: "slot_unavailable" | "not_found" | "invalid_input", message: string) {
    super(message);
  }
}

function weekdayOf(date: string): number {
  // `date` is a plain calendar date (YYYY-MM-DD); the weekday is a property
  // of the calendar date itself, independent of timezone.
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export interface ServiceCombo {
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  totalPriceCents: number;
  items: { id: string; name: string; durationMinutes: number; priceCents: number }[];
}

export async function getServiceCombo(
  supabase: DbClient,
  salonId: string,
  employeeId: string,
  serviceIds: string[]
): Promise<ServiceCombo> {
  if (serviceIds.length === 0) {
    throw new SchedulingError("invalid_input", "At least one service is required.");
  }

  const [{ data: services, error: svcError }, { data: overrides }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, duration_minutes, price_cents, buffer_before_minutes, buffer_after_minutes")
      .eq("salon_id", salonId)
      .in("id", serviceIds)
      .eq("active", true),
    supabase
      .from("employee_services")
      .select("service_id, duration_minutes")
      .eq("employee_id", employeeId)
      .in("service_id", serviceIds),
  ]);

  if (svcError) throw new SchedulingError("invalid_input", svcError.message);
  if (!services || services.length !== serviceIds.length) {
    throw new SchedulingError("invalid_input", "One or more services are unknown or inactive.");
  }

  const overrideMap = new Map((overrides ?? []).map((o) => [o.service_id, o.duration_minutes]));

  // Preserve the order the caller requested the services in.
  const ordered = serviceIds.map((id) => services.find((s) => s.id === id)!);

  const items = ordered.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: overrideMap.get(s.id) ?? s.duration_minutes,
    priceCents: s.price_cents,
  }));

  return {
    durationMinutes: items.reduce((sum, i) => sum + i.durationMinutes, 0),
    bufferBeforeMinutes: ordered[0].buffer_before_minutes,
    bufferAfterMinutes: ordered[ordered.length - 1].buffer_after_minutes,
    totalPriceCents: items.reduce((sum, i) => sum + i.priceCents, 0),
    items,
  };
}

export interface CheckAvailabilityParams {
  salonId: string;
  employeeId: string;
  serviceIds: string[];
  date: string; // YYYY-MM-DD, salon-local
  preferredTimeRange?: PreferredTimeRange;
  /** Exclude this appointment's own occupancy — used when rescheduling. */
  excludeAppointmentId?: string;
  /**
   * Optional resource (room, seat, vehicle, equipment, table, ...) this
   * appointment also needs. When set, a locked/inactive resource or one
   * without configured hours that day yields no slots at all, and existing
   * bookings of that resource are treated as busy just like the
   * employee's own appointments.
   */
  resourceId?: string;
}

async function fetchResourceAvailability(
  supabase: DbClient,
  resourceId: string,
  weekday: number,
  dayStart: Date,
  dayEnd: Date
) {
  const [{ data: resource }, { data: workingHours }, { data: bookings }] = await Promise.all([
    supabase.from("resources").select("active").eq("id", resourceId).maybeSingle(),
    supabase.from("resource_working_hours").select("start_time, end_time").eq("resource_id", resourceId).eq("weekday", weekday),
    supabase
      .from("appointment_resources")
      .select("appointments!inner(start_at, end_at, status)")
      .eq("resource_id", resourceId)
      .eq("appointments.status", "booked")
      .lt("appointments.start_at", dayEnd.toISOString())
      .gt("appointments.end_at", dayStart.toISOString()),
  ]);

  return {
    active: resource?.active ?? false,
    workingHours: (workingHours ?? []).map((w) => ({ startTime: w.start_time, endTime: w.end_time })),
    busyBlocks: (bookings ?? [])
      .map((b) => b.appointments)
      .filter((a): a is { start_at: string; end_at: string; status: string } => Boolean(a))
      .map((a) => ({ startAt: a.start_at, endAt: a.end_at })),
  };
}

export interface AvailabilityResult {
  employeeId: string;
  date: string;
  combo: ServiceCombo;
  slots: string[]; // ISO instants, UTC
}

export async function checkAvailability(
  supabase: DbClient,
  params: CheckAvailabilityParams
): Promise<AvailabilityResult> {
  const { salonId, employeeId, serviceIds, date, preferredTimeRange, excludeAppointmentId, resourceId } = params;

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select(
      "timezone, slot_granularity_minutes, earliest_booking_lead_minutes, max_advance_booking_days, max_parallel_appointments, max_appointments_per_day"
    )
    .eq("id", salonId)
    .single();
  if (salonError || !salon) throw new SchedulingError("not_found", "Salon not found.");

  const combo = await getServiceCombo(supabase, salonId, employeeId, serviceIds);
  const weekday = weekdayOf(date);
  const { start: dayStart, end: dayEnd } = localDayBoundsUtc(date, salon.timezone);

  const [
    { data: employeeRow },
    { data: businessHoursRow },
    { data: workingHours },
    { data: absences },
    { data: appointments },
    { data: salonAppointments },
    resource,
  ] = await Promise.all([
    supabase.from("employees").select("active").eq("id", employeeId).maybeSingle(),
    supabase
      .from("business_hours")
      .select("is_closed, start_time, end_time")
      .eq("salon_id", salonId)
      .eq("weekday", weekday)
      .maybeSingle(),
    supabase
      .from("employee_working_hours")
      .select("start_time, end_time")
      .eq("employee_id", employeeId)
      .eq("weekday", weekday),
    supabase
      .from("employee_absences")
      .select("start_at, end_at")
      .eq("employee_id", employeeId)
      .lt("start_at", dayEnd.toISOString())
      .gt("end_at", dayStart.toISOString()),
    supabase
      .from("appointments")
      .select("id, start_at, end_at")
      .eq("employee_id", employeeId)
      .eq("status", "booked")
      .lt("start_at", dayEnd.toISOString())
      .gt("end_at", dayStart.toISOString()),
    supabase
      .from("appointments")
      .select("id, start_at, end_at")
      .eq("salon_id", salonId)
      .eq("status", "booked")
      .lt("start_at", dayEnd.toISOString())
      .gt("end_at", dayStart.toISOString()),
    resourceId ? fetchResourceAvailability(supabase, resourceId, weekday, dayStart, dayEnd) : Promise.resolve(null),
  ]);

  const businessHours: BusinessHoursForDay | null = businessHoursRow
    ? {
        isClosed: businessHoursRow.is_closed,
        startTime: businessHoursRow.start_time,
        endTime: businessHoursRow.end_time,
      }
    : null;

  const employeeAppointments = (appointments ?? []).filter((a) => a.id !== excludeAppointmentId);

  const slots = computeFreeSlots({
    date,
    timezone: salon.timezone,
    businessHours,
    workingHours: (workingHours ?? []).map((w) => ({ startTime: w.start_time, endTime: w.end_time })),
    absences: (absences ?? []).map((a) => ({ startAt: a.start_at, endAt: a.end_at })),
    existingAppointments: employeeAppointments.map((a) => ({ startAt: a.start_at, endAt: a.end_at })),
    serviceDurationMinutes: combo.durationMinutes,
    bufferBeforeMinutes: combo.bufferBeforeMinutes,
    bufferAfterMinutes: combo.bufferAfterMinutes,
    slotGranularityMinutes: salon.slot_granularity_minutes,
    earliestBookingLeadMinutes: salon.earliest_booking_lead_minutes,
    maxAdvanceBookingDays: salon.max_advance_booking_days,
    preferredTimeRange,
    employeeActive: employeeRow?.active ?? false,
    resourceActive: resource ? resource.active : undefined,
    resourceWorkingHours: resource ? resource.workingHours : undefined,
    resourceBusyBlocks: resource ? resource.busyBlocks : undefined,
    maxParallelAppointments: salon.max_parallel_appointments ?? undefined,
    salonWideAppointments: (salonAppointments ?? [])
      .filter((a) => a.id !== excludeAppointmentId)
      .map((a) => ({ startAt: a.start_at, endAt: a.end_at })),
    appointmentsBookedToday: employeeAppointments.length,
    maxAppointmentsPerDay: salon.max_appointments_per_day ?? undefined,
  });

  return { employeeId, date, combo, slots: slots.map((s) => s.toISOString()) };
}

export interface CreateAppointmentParams {
  salonId: string;
  customerId: string;
  employeeId: string;
  serviceIds: string[];
  startAt: string; // ISO instant
  notes?: string;
  source: "voice_ai" | "manual" | "online_booking";
}

export async function createAppointment(supabase: DbClient, params: CreateAppointmentParams) {
  const { salonId, customerId, employeeId, serviceIds, startAt, notes, source } = params;

  const date = startAt.slice(0, 10);
  const availability = await checkAvailability(supabase, { salonId, employeeId, serviceIds, date });
  const stillAvailable = availability.slots.some(
    (s) => new Date(s).getTime() === new Date(startAt).getTime()
  );
  if (!stillAvailable) {
    throw new SchedulingError("slot_unavailable", "Dieser Zeitraum ist nicht verfügbar.");
  }

  const { data, error } = await supabase.rpc("book_appointment", {
    p_salon_id: salonId,
    p_customer_id: customerId,
    p_employee_id: employeeId,
    p_start_at: startAt,
    p_end_at: new Date(new Date(startAt).getTime() + availability.combo.durationMinutes * 60_000).toISOString(),
    p_service_ids: serviceIds,
    p_source: source,
    p_notes: notes ?? undefined,
  });

  if (error) {
    if (error.code === "23P01") {
      throw new SchedulingError("slot_unavailable", "Dieser Zeitraum ist nicht verfügbar.");
    }
    throw new SchedulingError("invalid_input", error.message);
  }

  await sendAppointmentConfirmationSms(supabase, salonId, data.id);

  return data;
}

export interface RescheduleAppointmentParams {
  salonId: string;
  appointmentId: string;
  newEmployeeId: string;
  newStartAt: string;
}

export async function rescheduleAppointment(supabase: DbClient, params: RescheduleAppointmentParams) {
  const { salonId, appointmentId, newEmployeeId, newStartAt } = params;

  const { data: existing, error: fetchError } = await supabase
    .from("appointments")
    .select("id, appointment_services(duration_minutes)")
    .eq("id", appointmentId)
    .eq("salon_id", salonId)
    .single();
  if (fetchError || !existing) throw new SchedulingError("not_found", "Termin wurde nicht gefunden.");

  const totalMinutes = (existing.appointment_services ?? []).reduce(
    (sum: number, s: { duration_minutes: number }) => sum + s.duration_minutes,
    0
  );
  const newEndAt = new Date(new Date(newStartAt).getTime() + totalMinutes * 60_000).toISOString();

  const date = newStartAt.slice(0, 10);
  const serviceIds = await getServiceIdsForAppointment(supabase, appointmentId);
  const availability = await checkAvailability(supabase, {
    salonId,
    employeeId: newEmployeeId,
    serviceIds,
    date,
    excludeAppointmentId: appointmentId,
  });
  const stillAvailable = availability.slots.some(
    (s) => new Date(s).getTime() === new Date(newStartAt).getTime()
  );
  if (!stillAvailable) {
    throw new SchedulingError("slot_unavailable", "Dieser Zeitraum ist nicht verfügbar.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ employee_id: newEmployeeId, start_at: newStartAt, end_at: newEndAt, updated_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("salon_id", salonId)
    .select()
    .single();

  if (error) {
    if (error.code === "23P01") {
      throw new SchedulingError("slot_unavailable", "Dieser Zeitraum ist nicht verfügbar.");
    }
    throw new SchedulingError("invalid_input", error.message);
  }

  return data;
}

async function getServiceIdsForAppointment(supabase: DbClient, appointmentId: string): Promise<string[]> {
  const { data } = await supabase
    .from("appointment_services")
    .select("service_id, sort_order")
    .eq("appointment_id", appointmentId)
    .order("sort_order");
  return (data ?? []).map((d) => d.service_id);
}

export async function cancelAppointment(supabase: DbClient, salonId: string, appointmentId: string) {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("salon_id", salonId)
    .select()
    .single();
  if (error) throw new SchedulingError("invalid_input", error.message);
  return data;
}
