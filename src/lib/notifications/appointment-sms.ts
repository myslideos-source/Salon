import "server-only";
import type { DbClient } from "@/lib/scheduling/engine";
import { twilioProvider } from "@/lib/sms/providers/twilio";

function firstOrSelf<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/**
 * Sends a booking-confirmation SMS to the customer, if the salon has it
 * enabled (voice_settings.send_confirmation_sms) and Twilio is configured.
 * Called from the single booking choke point (lib/scheduling/engine.ts
 * createAppointment) so it covers every booking source - voice AI, manual
 * admin bookings and future online bookings alike. Deliberately swallows
 * every error: a failed SMS must never fail the booking itself.
 */
export async function sendAppointmentConfirmationSms(supabase: DbClient, salonId: string, appointmentId: string): Promise<void> {
  try {
    if (!twilioProvider.isConfigured()) return;

    const { data: settings } = await supabase
      .from("voice_settings")
      .select("send_confirmation_sms")
      .eq("salon_id", salonId)
      .maybeSingle();
    if (settings?.send_confirmation_sms === false) return;

    const { data: appt } = await supabase
      .from("appointments")
      .select("start_at, customers(first_name, phone), employees(first_name), appointment_services(services(name))")
      .eq("id", appointmentId)
      .maybeSingle();
    if (!appt) return;

    const customer = firstOrSelf(appt.customers);
    if (!customer?.phone) return;
    const employee = firstOrSelf(appt.employees);

    const { data: salon } = await supabase.from("salons").select("name, timezone").eq("id", salonId).single();
    if (!salon) return;

    const startAt = new Date(appt.start_at);
    const date = new Intl.DateTimeFormat("de-DE", {
      timeZone: salon.timezone,
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    }).format(startAt);
    const time = new Intl.DateTimeFormat("de-DE", { timeZone: salon.timezone, hour: "2-digit", minute: "2-digit" }).format(startAt);

    const services = (appt.appointment_services ?? [])
      .map((row) => firstOrSelf(row.services)?.name)
      .filter((name): name is string => Boolean(name))
      .join(", ");

    const message = [
      `Hallo ${customer.first_name}!`,
      `Dein Termin bei ${salon.name} ist bestätigt: ${date}, ${time} Uhr${services ? ` (${services})` : ""}${employee?.first_name ? ` bei ${employee.first_name}` : ""}.`,
      "Bis bald!",
    ].join(" ");

    await twilioProvider.send(customer.phone, message);
  } catch {
    // Best-effort - never let a notification failure fail the booking.
  }
}
