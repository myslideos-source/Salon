import { addDays, startOfWeek, startOfMonth, endOfMonth, format, parseISO } from "date-fns";
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

export function formatWeekdayShort(date: string): string {
  return format(parseISO(date), "EE", { locale: de }).toUpperCase();
}

export function formatDayNum(date: string): string {
  return format(parseISO(date), "d");
}

export function formatMonthLabel(date: string): string {
  return format(parseISO(date), "MMMM yyyy", { locale: de });
}

export function isSameMonth(date: string, referenceDate: string): boolean {
  return date.slice(0, 7) === referenceDate.slice(0, 7);
}

/** 6-week (42 day) grid for a month view, starting the Monday on/before the
 * 1st and ending the Sunday on/after the month's last day. */
export function monthGridDates(anyDateInMonth: string): string[] {
  const first = format(startOfMonth(parseISO(anyDateInMonth)), "yyyy-MM-dd");
  const last = format(endOfMonth(parseISO(anyDateInMonth)), "yyyy-MM-dd");
  const gridStart = startOfWeekStr(first);
  const gridEndExclusive = addDaysStr(startOfWeekStr(last), 7);
  const dates: string[] = [];
  let d = gridStart;
  while (d < gridEndExclusive) {
    dates.push(d);
    d = addDaysStr(d, 1);
  }
  // Always exactly 6 weeks so the grid height never jumps between months.
  while (dates.length < 42) dates.push(addDaysStr(dates[dates.length - 1], 1));
  return dates.slice(0, 42);
}

export function addMonthsStr(date: string, n: number): string {
  const d = parseISO(date);
  d.setMonth(d.getMonth() + n);
  return format(d, "yyyy-MM-dd");
}
