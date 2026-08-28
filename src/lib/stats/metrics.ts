import "server-only";
import type { DbClient } from "@/lib/scheduling/engine";

// Geteilte Kennzahlen-Berechnung für Dashboard und Statistiken
// (Konzeptabschnitte "Dashboard" und "Statistiken"). Beide Seiten zeigen
// denselben Kennzahlen-Satz für unterschiedliche Zeiträume — diese Logik
// lebt deshalb an einer Stelle statt zweimal dupliziert zu werden.
//
// Grundregel (Konzeptvorgabe "keine erfundenen Live-Daten"): jede Zahl hier
// stammt aus echten Tabellenzeilen für den jeweiligen Salon und Zeitraum.
// Die einzige Ausnahme ist die "geschätzte Zeitersparnis" — das Konzept
// verlangt diese Kennzahl ausdrücklich als *Schätzung*; sie wird als
// klar gekennzeichnete Hochrechnung (Minuten je von Mia angenommenem
// Anruf) aus echten Anrufzahlen abgeleitet, nie als eigenständig erfundene
// Zahl.

/** Minuten, die ein Unternehmen laut Produktannahme durchschnittlich pro von
 * Mia angenommenem Anruf spart (kein manuelles Abnehmen, keine Rückfrage
 * beim Kollegen, keine verpasste Notiz). Bewusst konservativ gewählt und an
 * einer Stelle gepflegt, damit Dashboard und Statistiken übereinstimmen. */
export const ESTIMATED_MINUTES_SAVED_PER_CALL = 4;

export type PeriodMetrics = {
  callsTotal: number;
  callsAnswered: number;
  callsMissed: number;
  bookedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  newCustomers: number;
  /** Anteil der Anrufe, die zu einem gebuchten Termin führten (0..1), oder null ohne Anrufe im Zeitraum. */
  bookingRate: number | null;
  /** Anteil der Anrufe, die Mia beantwortet hat statt sie zu verpassen (0..1), oder null ohne Anrufe im Zeitraum. */
  reachabilityRate: number | null;
  /** Anteil stornierter an allen nicht mehr offenen Termine (0..1), oder null ohne Termine im Zeitraum. */
  cancellationRate: number | null;
  /** Anteil der Anrufe, die zu einem Rückrufwunsch führten (0..1), oder null ohne Anrufe im Zeitraum. */
  callbackRate: number | null;
  /** Durchschnittliche Gesprächsdauer in Sekunden, oder null ohne Anrufe im Zeitraum. */
  avgCallDurationSeconds: number | null;
  estimatedMinutesSaved: number;
  topServices: { name: string; count: number }[];
  topTopics: { topic: string; count: number }[];
};

export async function computePeriodMetrics(
  supabase: DbClient,
  salonId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PeriodMetrics> {
  const startIso = periodStart.toISOString();
  const endIso = periodEnd.toISOString();

  const [{ data: calls }, { data: appointments }, { data: customers }] = await Promise.all([
    supabase
      .from("calls")
      .select("id, status, topic, outcome, duration_seconds")
      .eq("salon_id", salonId)
      .gte("started_at", startIso)
      .lte("started_at", endIso),
    supabase
      .from("appointments")
      .select("id, status, appointment_services(services(name))")
      .eq("salon_id", salonId)
      .gte("start_at", startIso)
      .lte("start_at", endIso),
    supabase.from("customers").select("id").eq("salon_id", salonId).gte("created_at", startIso).lte("created_at", endIso),
  ]);

  const callsTotal = calls?.length ?? 0;
  const callsMissed = (calls ?? []).filter((c) => c.status === "missed").length;
  const callsAnswered = callsTotal - callsMissed;
  const callbacksFromCalls = (calls ?? []).filter((c) => c.outcome === "callback_requested").length;
  const totalDurationSeconds = (calls ?? []).reduce((sum, c) => sum + (c.duration_seconds ?? 0), 0);

  const booked = (appointments ?? []).filter((a) => a.status === "booked" || a.status === "completed");
  const cancelled = (appointments ?? []).filter((a) => a.status === "cancelled");
  const noShow = (appointments ?? []).filter((a) => a.status === "no_show");
  const decidedAppointments = booked.length + cancelled.length + noShow.length;

  const serviceCounts = new Map<string, number>();
  for (const a of booked) {
    const links = (a.appointment_services ?? []) as unknown as { services: { name: string } | null }[];
    for (const link of links) {
      const name = link.services?.name;
      if (!name) continue;
      serviceCounts.set(name, (serviceCounts.get(name) ?? 0) + 1);
    }
  }

  const topicCounts = new Map<string, number>();
  for (const c of calls ?? []) {
    if (!c.topic) continue;
    topicCounts.set(c.topic, (topicCounts.get(c.topic) ?? 0) + 1);
  }

  return {
    callsTotal,
    callsAnswered,
    callsMissed,
    bookedAppointments: booked.length,
    cancelledAppointments: cancelled.length,
    noShowAppointments: noShow.length,
    newCustomers: customers?.length ?? 0,
    bookingRate: callsTotal > 0 ? booked.length / callsTotal : null,
    reachabilityRate: callsTotal > 0 ? callsAnswered / callsTotal : null,
    cancellationRate: decidedAppointments > 0 ? cancelled.length / decidedAppointments : null,
    callbackRate: callsTotal > 0 ? callbacksFromCalls / callsTotal : null,
    avgCallDurationSeconds: callsTotal > 0 ? Math.round(totalDurationSeconds / callsTotal) : null,
    estimatedMinutesSaved: callsAnswered * ESTIMATED_MINUTES_SAVED_PER_CALL,
    topServices: [...serviceCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
    topTopics: [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count })),
  };
}

export type EmployeeUtilization = {
  employeeId: string;
  name: string;
  color: string | null;
  bookedMinutes: number;
  capacityMinutes: number;
  /** null, wenn für diesen Wochentag keine Arbeitszeit hinterlegt ist (Auslastung nicht berechenbar). */
  rate: number | null;
};

/** Auslastung je Mitarbeiter für einen einzelnen Kalendertag: gebuchte
 * Terminminuten geteilt durch die hinterlegte Arbeitszeit an diesem
 * Wochentag. Ohne hinterlegte Arbeitszeit gibt es bewusst keine Quote
 * (nicht 0%) — das wäre eine erfundene Zahl statt einer echten "keine
 * Daten"-Situation. */
export async function computeEmployeeUtilization(supabase: DbClient, salonId: string, dateIso: string): Promise<EmployeeUtilization[]> {
  const weekday = new Date(`${dateIso}T00:00:00Z`).getUTCDay();
  const dayStart = `${dateIso}T00:00:00.000Z`;
  const dayEnd = `${dateIso}T23:59:59.999Z`;

  const [{ data: employees }, { data: workingHours }, { data: appointments }] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, color").eq("salon_id", salonId).eq("active", true).order("sort_order"),
    supabase.from("employee_working_hours").select("employee_id, start_time, end_time").eq("salon_id", salonId).eq("weekday", weekday),
    supabase
      .from("appointments")
      .select("employee_id, start_at, end_at")
      .eq("salon_id", salonId)
      .eq("status", "booked")
      .gte("start_at", dayStart)
      .lte("start_at", dayEnd),
  ]);

  function minutesBetween(start: string, end: string): number {
    return Math.max(0, (new Date(`${dateIso}T${end}Z`).getTime() - new Date(`${dateIso}T${start}Z`).getTime()) / 60_000);
  }

  const capacityByEmployee = new Map<string, number>();
  for (const w of workingHours ?? []) {
    capacityByEmployee.set(w.employee_id, (capacityByEmployee.get(w.employee_id) ?? 0) + minutesBetween(w.start_time, w.end_time));
  }

  const bookedByEmployee = new Map<string, number>();
  for (const a of appointments ?? []) {
    if (!a.employee_id) continue;
    const minutes = (new Date(a.end_at).getTime() - new Date(a.start_at).getTime()) / 60_000;
    bookedByEmployee.set(a.employee_id, (bookedByEmployee.get(a.employee_id) ?? 0) + minutes);
  }

  return (employees ?? []).map((e) => {
    const capacityMinutes = capacityByEmployee.get(e.id) ?? 0;
    const bookedMinutes = bookedByEmployee.get(e.id) ?? 0;
    return {
      employeeId: e.id,
      name: `${e.first_name} ${e.last_name}`.trim(),
      color: e.color,
      bookedMinutes,
      capacityMinutes,
      rate: capacityMinutes > 0 ? Math.min(1, bookedMinutes / capacityMinutes) : null,
    };
  });
}

/** Durchschnittliche Auslastung über alle Mitarbeiter mit hinterlegter
 * Arbeitszeit an diesem Tag (0..1), oder null ohne verwertbare Daten. */
export function averageUtilization(rows: EmployeeUtilization[]): number | null {
  const withCapacity = rows.filter((r) => r.rate !== null);
  if (withCapacity.length === 0) return null;
  return withCapacity.reduce((sum, r) => sum + (r.rate ?? 0), 0) / withCapacity.length;
}
