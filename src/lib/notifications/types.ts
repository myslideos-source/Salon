// Ereignistypen exakt wie im Check-Constraint von `notifications.type`
// (supabase/migrations/0022_notifications.sql) — Konzeptabschnitt
// "Benachrichtigungen".

export const NOTIFICATION_EVENT_TYPES = [
  "appointment_booked",
  "appointment_changed",
  "appointment_cancelled",
  "callback_requested",
  "request_unresolved",
  "urgent_request",
  "customer_unreachable",
  "employee_absence",
  "calendar_conflict",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export const NOTIFICATION_EVENT_LABEL: Record<NotificationEventType, string> = {
  appointment_booked: "Neue Terminbuchung",
  appointment_changed: "Termin geändert",
  appointment_cancelled: "Termin storniert",
  callback_requested: "Neuer Rückrufwunsch",
  request_unresolved: "Ungelöste Anfrage",
  urgent_request: "Dringende Anfrage",
  customer_unreachable: "Kunde nicht erreicht",
  employee_absence: "Ausfall eines Mitarbeiters",
  calendar_conflict: "Konflikt im Kalender",
};

/** Kanäle wie im Check-Constraint von `notifications.channel`/`notification_preferences.channel`. */
export const NOTIFICATION_CHANNELS = ["in_app", "email", "sms", "push"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_CHANNEL_LABEL: Record<NotificationChannel, string> = {
  in_app: "In-App",
  email: "E-Mail",
  sms: "SMS",
  push: "Push",
};

/** Kanäle, für die tatsächlich eine technische Anbindung besteht bzw.
 * vorbereitet ist (Konzeptvorgabe: "SMS und Push nur aktivieren, wenn eine
 * echte technische Anbindung vorhanden ist"). In-App schreibt immer in die
 * `notifications`-Tabelle. E-Mail versendet über den Anbieter in
 * `providers/email.ts`, sobald dessen Zugangsdaten hinterlegt sind — beides
 * ist reale, lauffähige Zustellungslogik, kein Platzhalter.
 *
 * SMS und Push sind bewusst als *nicht eingerichtet* markiert: Twilio ist
 * im Projekt zwar für Kundenbestätigungen (appointment-sms.ts) verbunden,
 * aber es gibt keine hinterlegte Mobilnummer für Mitarbeiter-Benachrichtigungen
 * und keine Push-Infrastruktur (Service Worker/Gerätetoken) — eine
 * Aktivierung wäre eine vorgetäuschte Funktion ohne echten Empfänger. */
export const NOTIFICATION_CHANNEL_AVAILABLE: Record<NotificationChannel, boolean> = {
  in_app: true,
  email: true,
  sms: false,
  push: false,
};

export const NOTIFICATION_CHANNEL_UNAVAILABLE_REASON: Partial<Record<NotificationChannel, string>> = {
  sms: "Nicht eingerichtete Integration — für Mitarbeiter-Benachrichtigungen ist noch keine Mobilnummer hinterlegt.",
  push: "Nicht eingerichtete Integration — Push-Benachrichtigungen erfordern eine Browser-/App-Anbindung, die noch nicht besteht.",
};
