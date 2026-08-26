import "server-only";
import type { DbClient } from "@/lib/scheduling/engine";
import { twilioProvider } from "@/lib/sms/providers/twilio";

function firstOrSelf<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

// Twilio requires E.164 (+49...), but customer.phone is often stored in
// local German format (e.g. "0151...") - typed by staff, or spoken and
// transcribed by the voice AI before caller-ID override existed. Confirmed
// live that this silently broke every SMS: Twilio just rejects a number
// without a country code.
function toE164German(phone: string): string | null {
  const trimmed = phone.replace(/[\s()-]/g, "");
  if (/^\+\d{8,15}$/.test(trimmed)) return trimmed;
  if (/^00\d{8,15}$/.test(trimmed)) return `+${trimmed.slice(2)}`;
  if (/^0\d{7,14}$/.test(trimmed)) return `+49${trimmed.slice(1)}`;
  return null;
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
  const log = (msg: string) => console.log(`[appointment-sms] ${msg} (appointment ${appointmentId})`);
  try {
    if (!twilioProvider.isConfigured()) {
      log("skipped: Twilio ist nicht konfiguriert (TWILIO_ACCOUNT_SID/TWILIO_FROM_NUMBER + Zugangsdaten fehlen)");
      return;
    }

    const { data: settings } = await supabase
      .from("voice_settings")
      .select("send_confirmation_sms")
      .eq("salon_id", salonId)
      .maybeSingle();
    if (settings?.send_confirmation_sms === false) {
      log("skipped: send_confirmation_sms ist für diesen Salon deaktiviert");
      return;
    }

    const { data: appt } = await supabase
      .from("appointments")
      .select("start_at, customers(first_name, phone), employees(first_name), appointment_services(services(name))")
      .eq("id", appointmentId)
      .maybeSingle();
    if (!appt) {
      log("skipped: Termin nicht gefunden");
      return;
    }

    const customer = firstOrSelf(appt.customers);
    if (!customer?.phone) {
      log("skipped: Kundin/Kunde hat keine Telefonnummer hinterlegt");
      return;
    }
    const phone = toE164German(customer.phone);
    if (!phone) {
      log(`skipped: Telefonnummer "${customer.phone}" konnte nicht in ein gültiges Format umgewandelt werden`);
      return;
    }
    const employee = firstOrSelf(appt.employees);

    const { data: salon } = await supabase.from("salons").select("name, timezone").eq("id", salonId).single();
    if (!salon) {
      log("skipped: Salon nicht gefunden");
      return;
    }

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

    const result = await twilioProvider.send(phone, message);
    if (result.ok) {
      log(`sent to ${phone}`);
    } else {
      log(`Twilio lehnte den Versand ab: ${result.error}`);
    }
  } catch (e) {
    // Best-effort - never let a notification failure fail the booking.
    log(`unerwarteter Fehler: ${e instanceof Error ? e.message : String(e)}`);
  }
}
