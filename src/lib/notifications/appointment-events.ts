import "server-only";
import type { DbClient } from "@/lib/scheduling/engine";
import { notify } from "./notify";
import type { NotificationEventType } from "./types";

function firstOrSelf<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

const EVENT_TITLE: Record<"appointment_booked" | "appointment_changed" | "appointment_cancelled", string> = {
  appointment_booked: "Neue Terminbuchung",
  appointment_changed: "Termin geändert",
  appointment_cancelled: "Termin storniert",
};

/**
 * Benachrichtigt das Unternehmen über eine Terminbuchung/-änderung/
 * -stornierung (Konzeptabschnitt "Benachrichtigungen"). Aufgerufen aus dem
 * zentralen Buchungs-Choke-Point (`src/lib/scheduling/engine.ts`), deckt
 * damit automatisch alle Buchungsquellen ab (KI-Telefonassistent, manuelle
 * Buchung im Kalender, Online-Buchung). Best effort wie
 * `sendAppointmentConfirmationSms` — ein Fehler hier darf die eigentliche
 * Termin-Operation nie rückgängig machen oder fehlschlagen lassen.
 */
export async function notifyAppointmentEvent(
  supabase: DbClient,
  salonId: string,
  appointmentId: string,
  type: "appointment_booked" | "appointment_changed" | "appointment_cancelled"
): Promise<void> {
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("start_at, customers(first_name, last_name), employees(first_name), appointment_services(services(name))")
      .eq("id", appointmentId)
      .maybeSingle();
    if (!appt) return;

    const customer = firstOrSelf(appt.customers);
    const employee = firstOrSelf(appt.employees);
    const services = (appt.appointment_services ?? [])
      .map((row) => firstOrSelf(row.services)?.name)
      .filter((name): name is string => Boolean(name))
      .join(", ");

    const who = customer ? `${customer.first_name} ${customer.last_name}`.trim() : "Kunde";
    const startAt = new Date(appt.start_at);
    const when = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(startAt);

    const bodyParts = [who, when];
    if (services) bodyParts.push(services);
    if (employee?.first_name) bodyParts.push(`bei ${employee.first_name}`);

    await notify(supabase, {
      salonId,
      type: type as NotificationEventType,
      title: `${EVENT_TITLE[type]}: ${who}`,
      body: bodyParts.slice(1).join(" · "),
      entityType: "appointment",
      entityId: appointmentId,
    });
  } catch {
    // Best effort - siehe sendAppointmentConfirmationSms.
  }
}
