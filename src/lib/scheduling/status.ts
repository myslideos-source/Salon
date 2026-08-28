// Central German labels/colors for `appointments.status` and `.source`,
// shared by every calendar view (day/week/month/list) so status and
// booking-source read the same way everywhere in the calendar.

export type AppointmentStatus = "booked" | "completed" | "cancelled" | "no_show";
export type AppointmentSource = "voice_ai" | "manual" | "online_booking";

export const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string; tone: "success" | "danger" | "warning" | "neutral" }[] = [
  { value: "booked", label: "Gebucht", tone: "success" },
  { value: "completed", label: "Abgeschlossen", tone: "neutral" },
  { value: "no_show", label: "Nicht erschienen", tone: "warning" },
  { value: "cancelled", label: "Storniert", tone: "danger" },
];

export const APPOINTMENT_SOURCES: { value: AppointmentSource; label: string }[] = [
  { value: "voice_ai", label: "KI-Telefonassistent" },
  { value: "manual", label: "Manuell angelegt" },
  { value: "online_booking", label: "Online-Buchung" },
];

export function statusLabel(status: string): string {
  return APPOINTMENT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusTone(status: string): "success" | "danger" | "warning" | "neutral" {
  return APPOINTMENT_STATUSES.find((s) => s.value === status)?.tone ?? "neutral";
}

export function sourceLabel(source: string): string {
  return APPOINTMENT_SOURCES.find((s) => s.value === source)?.label ?? source;
}
