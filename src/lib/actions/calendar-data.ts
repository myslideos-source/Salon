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

export type CalendarEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  color: string;
  workingHours: { startTime: string; endTime: string }[];
};

export async function getDayCalendarDataAction(salonId: string, date: string) {
  const supabase = await createClient();
  const weekday = weekdayOf(date);
  const { start: dayStart, end: dayEnd } = localDayBoundsUtc(date, "Europe/Berlin"); // refined below with real tz

  const { data: salon } = await supabase.from("salons").select("timezone, slug, name").eq("id", salonId).single();
  const timezone = salon?.timezone ?? "Europe/Berlin";
  const bounds = timezone === "Europe/Berlin" ? { start: dayStart, end: dayEnd } : localDayBoundsUtc(date, timezone);

  const [{ data: employees }, { data: workingHours }, { data: businessHours }, { data: appointments }] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, color").eq("salon_id", salonId).eq("active", true).order("sort_order"),
    supabase.from("employee_working_hours").select("employee_id, start_time, end_time").eq("salon_id", salonId).eq("weekday", weekday),
    supabase.from("business_hours").select("is_closed, start_time, end_time").eq("salon_id", salonId).eq("weekday", weekday).maybeSingle(),
    supabase
      .from("appointments")
      .select(
        "id, start_at, end_at, status, source, total_price_cents, notes, employee_id, customers(id, first_name, last_name, phone), appointment_services(sort_order, services(id, name, color))"
      )
      .eq("salon_id", salonId)
      .neq("status", "cancelled")
      .lt("start_at", bounds.end.toISOString())
      .gt("end_at", bounds.start.toISOString())
      .order("start_at"),
  ]);

  const calendarEmployees: CalendarEmployee[] = (employees ?? []).map((e) => ({
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
    color: e.color,
    workingHours: (workingHours ?? [])
      .filter((w) => w.employee_id === e.id)
      .map((w) => ({ startTime: w.start_time, endTime: w.end_time })),
  }));

  const calendarAppointments: CalendarAppointment[] = (appointments ?? []).map((a) => {
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
  });

  return {
    timezone,
    employees: calendarEmployees,
    businessHours: businessHours
      ? { isClosed: businessHours.is_closed, startTime: businessHours.start_time, endTime: businessHours.end_time }
      : null,
    appointments: calendarAppointments,
  };
}

export async function getWeekOverviewAction(salonId: string, dates: string[]) {
  const supabase = await createClient();
  const { data: salon } = await supabase.from("salons").select("timezone").eq("id", salonId).single();
  const timezone = salon?.timezone ?? "Europe/Berlin";

  const first = localDayBoundsUtc(dates[0], timezone);
  const last = localDayBoundsUtc(dates[dates.length - 1], timezone);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, start_at, status, employees(first_name, color), customers(first_name, last_name)")
    .eq("salon_id", salonId)
    .neq("status", "cancelled")
    .gte("start_at", first.start.toISOString())
    .lt("start_at", last.end.toISOString())
    .order("start_at");

  const byDate = new Map<string, { id: string; startAt: string; employeeName: string; employeeColor: string; customerName: string }[]>();
  for (const date of dates) byDate.set(date, []);

  for (const a of appointments ?? []) {
    const employee = a.employees as unknown as { first_name: string; color: string } | null;
    const customer = a.customers as unknown as { first_name: string; last_name: string } | null;
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(a.start_at)
    );
    const list = byDate.get(localDate);
    if (list) {
      list.push({
        id: a.id,
        startAt: a.start_at,
        employeeName: employee?.first_name ?? "",
        employeeColor: employee?.color ?? "#B08968",
        customerName: `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim(),
      });
    }
  }

  return Object.fromEntries(byDate.entries());
}
