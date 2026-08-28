"use server";

import { createClient } from "@/lib/supabase/server";
import { localDayBoundsUtc } from "@/lib/scheduling/availability";

function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export type CalendarAppointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  source: string;
  totalPriceCents: number;
  notes: string | null;
  employeeId: string;
  customer: { id: string; firstName: string; lastName: string; phone: string } | null;
  services: { id: string; name: string; color: string }[];
};

const APPOINTMENT_SELECT =
  "id, start_at, end_at, status, source, total_price_cents, notes, employee_id, customers(id, first_name, last_name, phone), appointment_services(sort_order, services(id, name, color))";

type AppointmentRow = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  source: string;
  total_price_cents: number;
  notes: string | null;
  employee_id: string;
  customers: unknown;
  appointment_services: unknown;
};

function mapAppointmentRow(a: AppointmentRow): CalendarAppointment {
  const customer = a.customers as unknown as { id: string; first_name: string; last_name: string; phone: string } | null;
  const services = ((a.appointment_services ?? []) as unknown as { sort_order: number; services: { id: string; name: string; color: string } | null }[])
    .sort((x, y) => x.sort_order - y.sort_order)
    .map((s) => s.services)
    .filter(Boolean) as { id: string; name: string; color: string }[];
  return {
    id: a.id,
    startAt: a.start_at,
    endAt: a.end_at,
    status: a.status,
    source: a.source,
    totalPriceCents: a.total_price_cents,
    notes: a.notes,
    employeeId: a.employee_id,
    customer: customer ? { id: customer.id, firstName: customer.first_name, lastName: customer.last_name, phone: customer.phone } : null,
    services,
  };
}

export type CalendarEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  color: string;
  avatarUrl: string | null;
  locationId: string | null;
  workingHours: { startTime: string; endTime: string }[];
};

export async function getSalonEmployeesAction(salonId: string): Promise<CalendarEmployee[]> {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, color, avatar_url, location_id")
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("sort_order");
  return (employees ?? []).map((e) => ({
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
    color: e.color,
    avatarUrl: e.avatar_url,
    locationId: e.location_id,
    workingHours: [],
  }));
}

export type CalendarLocation = { id: string; name: string };

export async function getSalonLocationsAction(salonId: string): Promise<CalendarLocation[]> {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("sort_order");
  // A single-location salon (the common case today) has nothing meaningful
  // to filter by - the picker hides itself in that case (see MultiSelectFilter).
  return locations && locations.length > 1 ? locations.map((l) => ({ id: l.id, name: l.name })) : [];
}

export async function getDayCalendarDataAction(salonId: string, date: string) {
  const supabase = await createClient();
  const weekday = weekdayOf(date);
  const { start: dayStart, end: dayEnd } = localDayBoundsUtc(date, "Europe/Berlin"); // refined below with real tz

  const { data: salon } = await supabase.from("salons").select("timezone, slug, name").eq("id", salonId).single();
  const timezone = salon?.timezone ?? "Europe/Berlin";
  const bounds = timezone === "Europe/Berlin" ? { start: dayStart, end: dayEnd } : localDayBoundsUtc(date, timezone);

  const [{ data: employees }, { data: workingHours }, { data: businessHours }, { data: appointments }] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, color, avatar_url, location_id").eq("salon_id", salonId).eq("active", true).order("sort_order"),
    supabase.from("employee_working_hours").select("employee_id, start_time, end_time").eq("salon_id", salonId).eq("weekday", weekday),
    supabase.from("business_hours").select("is_closed, start_time, end_time").eq("salon_id", salonId).eq("weekday", weekday).maybeSingle(),
    supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("salon_id", salonId)
      .lt("start_at", bounds.end.toISOString())
      .gt("end_at", bounds.start.toISOString())
      .order("start_at"),
  ]);

  const calendarEmployees: CalendarEmployee[] = (employees ?? []).map((e) => ({
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
    color: e.color,
    avatarUrl: e.avatar_url,
    locationId: e.location_id,
    workingHours: (workingHours ?? [])
      .filter((w) => w.employee_id === e.id)
      .map((w) => ({ startTime: w.start_time, endTime: w.end_time })),
  }));

  const calendarAppointments: CalendarAppointment[] = (appointments ?? []).map(mapAppointmentRow);

  return {
    timezone,
    employees: calendarEmployees,
    businessHours: businessHours
      ? { isClosed: businessHours.is_closed, startTime: businessHours.start_time, endTime: businessHours.end_time }
      : null,
    appointments: calendarAppointments,
  };
}

export type CalendarBusinessHours = { isClosed: boolean; startTime: string | null; endTime: string | null };

// Full week grid data (real day-columns week view) - same appointment/
// employee shape as the day view so AppointmentCard/AppointmentDetailModal
// work unchanged, just spanning a date range instead of one day.
export async function getWeekCalendarDataAction(salonId: string, dates: string[]) {
  const supabase = await createClient();
  const { data: salon } = await supabase.from("salons").select("timezone").eq("id", salonId).single();
  const timezone = salon?.timezone ?? "Europe/Berlin";

  const first = localDayBoundsUtc(dates[0], timezone);
  const last = localDayBoundsUtc(dates[dates.length - 1], timezone);
  const weekdays = dates.map((d) => weekdayOf(d));

  const [{ data: employees }, { data: businessHoursRows }, { data: appointments }] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, color, avatar_url, location_id").eq("salon_id", salonId).eq("active", true).order("sort_order"),
    supabase.from("business_hours").select("weekday, is_closed, start_time, end_time").eq("salon_id", salonId).in("weekday", weekdays),
    supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("salon_id", salonId)
      .lt("start_at", last.end.toISOString())
      .gt("end_at", first.start.toISOString())
      .order("start_at"),
  ]);

  const calendarEmployees: CalendarEmployee[] = (employees ?? []).map((e) => ({
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
    color: e.color,
    avatarUrl: e.avatar_url,
    locationId: e.location_id,
    workingHours: [],
  }));

  const calendarAppointments: CalendarAppointment[] = (appointments ?? []).map(mapAppointmentRow);

  const businessHoursByWeekday: Record<number, CalendarBusinessHours> = {};
  for (const row of businessHoursRows ?? []) {
    businessHoursByWeekday[row.weekday] = { isClosed: row.is_closed, startTime: row.start_time, endTime: row.end_time };
  }
  const businessHoursByDate: Record<string, CalendarBusinessHours | null> = {};
  dates.forEach((d, i) => {
    businessHoursByDate[d] = businessHoursByWeekday[weekdays[i]] ?? null;
  });

  return {
    timezone,
    employees: calendarEmployees,
    appointments: calendarAppointments,
    businessHoursByDate,
  };
}

export type MonthEntry = {
  id: string;
  startAt: string;
  employeeId: string;
  employeeLocationId: string | null;
  employeeName: string;
  employeeColor: string;
  customerName: string;
  serviceNames: string[];
  serviceIds: string[];
  status: string;
  source: string;
};

// Unfiltered - MonthGrid applies matchesCalendarFilters itself so the same
// Suche/Mitarbeiter/Standort/Terminart/Status filters as day/week/list work
// in the month view too (including "cancelled" staying hidden by default).
export async function getWeekOverviewAction(salonId: string, dates: string[]): Promise<Record<string, MonthEntry[]>> {
  const supabase = await createClient();
  const { data: salon } = await supabase.from("salons").select("timezone").eq("id", salonId).single();
  const timezone = salon?.timezone ?? "Europe/Berlin";

  const first = localDayBoundsUtc(dates[0], timezone);
  const last = localDayBoundsUtc(dates[dates.length - 1], timezone);

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, start_at, status, source, employee_id, employees(first_name, color, location_id), customers(first_name, last_name), appointment_services(sort_order, services(id, name))"
    )
    .eq("salon_id", salonId)
    .gte("start_at", first.start.toISOString())
    .lt("start_at", last.end.toISOString())
    .order("start_at");

  const byDate = new Map<string, MonthEntry[]>();
  for (const date of dates) byDate.set(date, []);

  for (const a of appointments ?? []) {
    const employee = a.employees as unknown as { first_name: string; color: string; location_id: string | null } | null;
    const customer = a.customers as unknown as { first_name: string; last_name: string } | null;
    const services = ((a.appointment_services ?? []) as unknown as { sort_order: number; services: { id: string; name: string } | null }[])
      .sort((x, y) => x.sort_order - y.sort_order)
      .map((s) => s.services)
      .filter(Boolean) as { id: string; name: string }[];
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(a.start_at)
    );
    const list = byDate.get(localDate);
    if (list) {
      list.push({
        id: a.id,
        startAt: a.start_at,
        employeeId: a.employee_id,
        employeeLocationId: employee?.location_id ?? null,
        employeeName: employee?.first_name ?? "",
        employeeColor: employee?.color ?? "#B08968",
        customerName: `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim(),
        serviceNames: services.map((s) => s.name),
        serviceIds: services.map((s) => s.id),
        status: a.status,
        source: a.source,
      });
    }
  }

  return Object.fromEntries(byDate.entries());
}

// "Terminliste" - the calendar's Liste view, an upcoming-appointments window
// starting at `fromDate`, filtered the same way as day/week/month.
export async function getListCalendarDataAction(salonId: string, fromDate: string, toDate: string) {
  const supabase = await createClient();
  const { data: salon } = await supabase.from("salons").select("timezone").eq("id", salonId).single();
  const timezone = salon?.timezone ?? "Europe/Berlin";

  const from = localDayBoundsUtc(fromDate, timezone);
  const to = localDayBoundsUtc(toDate, timezone);

  const [{ data: employees }, { data: appointments }] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, color, avatar_url, location_id").eq("salon_id", salonId).eq("active", true).order("sort_order"),
    supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("salon_id", salonId)
      .gte("start_at", from.start.toISOString())
      .lt("start_at", to.end.toISOString())
      .order("start_at")
      .limit(500),
  ]);

  const calendarEmployees: CalendarEmployee[] = (employees ?? []).map((e) => ({
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
    color: e.color,
    avatarUrl: e.avatar_url,
    locationId: e.location_id,
    workingHours: [],
  }));

  return {
    timezone,
    employees: calendarEmployees,
    appointments: (appointments ?? []).map(mapAppointmentRow),
  };
}

export async function getWeekStatsAction(salonId: string, dates: string[]) {
  const supabase = await createClient();
  const { data: salon } = await supabase.from("salons").select("timezone").eq("id", salonId).single();
  const timezone = salon?.timezone ?? "Europe/Berlin";

  const first = localDayBoundsUtc(dates[0], timezone);
  const last = localDayBoundsUtc(dates[dates.length - 1], timezone);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, start_at, customer_id, total_price_cents")
    .eq("salon_id", salonId)
    .neq("status", "cancelled")
    .gte("start_at", first.start.toISOString())
    .lt("start_at", last.end.toISOString());

  const rows = appointments ?? [];
  const uniqueCustomers = new Set(rows.map((r) => r.customer_id)).size;
  const revenueCents = rows.reduce((sum, r) => sum + r.total_price_cents, 0);

  const countByDate = new Map<string, number>();
  for (const date of dates) countByDate.set(date, 0);
  for (const row of rows) {
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(row.start_at)
    );
    if (countByDate.has(localDate)) countByDate.set(localDate, (countByDate.get(localDate) ?? 0) + 1);
  }
  const daily = dates.map((d) => countByDate.get(d) ?? 0);

  return { appointmentCount: rows.length, customerCount: uniqueCustomers, revenueCents, daily };
}
