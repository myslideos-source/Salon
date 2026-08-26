import { addDays, startOfWeek, format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function addDaysStr(date: string, n: number): string {
  return format(addDays(parseISO(date), n), "yyyy-MM-dd");
}

export function startOfWeekStr(date: string): string {
  return format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function weekDatesFrom(startDate: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysStr(startDate, i));
}

export function formatDayLabel(date: string): string {
  return format(parseISO(date), "EEEE, d. MMMM yyyy", { locale: de });
}

export function formatShortDay(date: string): string {
  return format(parseISO(date), "EEE d.M.", { locale: de });
}

export function formatWeekRange(startDate: string): string {
  const end = addDaysStr(startDate, 6);
  return `${format(parseISO(startDate), "d.", { locale: de })} – ${format(parseISO(end), "d. MMMM yyyy", { locale: de })}`;
}

export function formatTime(iso: string, timezone = "Europe/Berlin"): string {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(new Date(iso));
}
