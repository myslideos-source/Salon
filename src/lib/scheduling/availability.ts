// The SalonCall Termin-Engine — pure, DB-free slot calculation.
//
// This is intentionally isolated from Supabase so it can be unit tested in
// full (buffers, breaks, absences, overlapping appointments, lead time,
// max advance booking) without spinning up a database. `lib/scheduling/
// engine.ts` fetches the inputs from Postgres and calls this function.

import { fromZonedTime } from "date-fns-tz";
import { addDays, format, parseISO } from "date-fns";

export type TimeRange = { start: Date; end: Date };

export type WorkingHourBlock = { startTime: string; endTime: string }; // "HH:mm:ss" or "HH:mm"
export type BusinessHoursForDay = {
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
};

export type ExistingAppointment = { startAt: string; endAt: string };
export type Absence = { startAt: string; endAt: string };

export type PreferredTimeRange = { fromTime: string; toTime: string } | null; // "HH:mm"

export interface ComputeFreeSlotsInput {
  /** Calendar date in the salon's local timezone, "YYYY-MM-DD". */
  date: string;
  timezone: string;
  businessHours: BusinessHoursForDay | null;
  workingHours: WorkingHourBlock[];
  absences: Absence[];
  /** Already-booked appointments for this employee (any day they might overlap the window). */
  existingAppointments: ExistingAppointment[];
  serviceDurationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  slotGranularityMinutes: number;
  earliestBookingLeadMinutes: number;
  maxAdvanceBookingDays: number;
  /** Injectable "now" for deterministic tests; defaults to `new Date()`. */
  now?: Date;
  preferredTimeRange?: PreferredTimeRange;
}

export function localTimeToUtc(date: string, time: string, timezone: string): Date {
  const [h, m, s] = time.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  const wallClock = new Date(Date.UTC(y, mo - 1, d, h, m ?? 0, s ?? 0));
  return fromZonedTime(wallClock, timezone);
}

/** UTC instants for local midnight-to-midnight of `date` in `timezone`. */
export function localDayBoundsUtc(date: string, timezone: string): TimeRange {
  const start = localTimeToUtc(date, "00:00:00", timezone);
  const nextDate = format(addDays(parseISO(date), 1), "yyyy-MM-dd");
  const end = localTimeToUtc(nextDate, "00:00:00", timezone);
  return { start, end };
}

function subtractRange(windows: TimeRange[], cut: TimeRange): TimeRange[] {
  const result: TimeRange[] = [];
  for (const w of windows) {
    if (cut.end <= w.start || cut.start >= w.end) {
      result.push(w);
      continue;
    }
    if (cut.start > w.start) {
      result.push({ start: w.start, end: new Date(Math.min(cut.start.getTime(), w.end.getTime())) });
    }
    if (cut.end < w.end) {
      result.push({ start: new Date(Math.max(cut.end.getTime(), w.start.getTime())), end: w.end });
    }
  }
  return result.filter((r) => r.end > r.start);
}

/**
 * Returns every valid appointment start time (as UTC Date instants) for a
 * single employee on a single day, given their working hours, the salon's
 * business hours, existing bookings, absences, service duration/buffers and
 * booking-window constraints. Never invents availability — an empty
 * business-hours day or a fully-absent employee correctly yields `[]`.
 */
export function computeFreeSlots(input: ComputeFreeSlotsInput): Date[] {
  const {
    date,
    timezone,
    businessHours,
    workingHours,
    absences,
    existingAppointments,
    serviceDurationMinutes,
    bufferBeforeMinutes,
    bufferAfterMinutes,
    slotGranularityMinutes,
    earliestBookingLeadMinutes,
    maxAdvanceBookingDays,
    preferredTimeRange,
  } = input;
  const now = input.now ?? new Date();

  if (!businessHours || businessHours.isClosed || !businessHours.startTime || !businessHours.endTime) {
    return [];
  }
  if (workingHours.length === 0) return [];

  const businessWindow: TimeRange = {
    start: localTimeToUtc(date, businessHours.startTime, timezone),
    end: localTimeToUtc(date, businessHours.endTime, timezone),
  };

  // Employee working-hour blocks, intersected with business hours.
  let windows: TimeRange[] = workingHours
    .map((block) => ({
      start: localTimeToUtc(date, block.startTime, timezone),
      end: localTimeToUtc(date, block.endTime, timezone),
    }))
    .map((w) => ({
      start: new Date(Math.max(w.start.getTime(), businessWindow.start.getTime())),
      end: new Date(Math.min(w.end.getTime(), businessWindow.end.getTime())),
    }))
    .filter((w) => w.end > w.start);

  // Remove absences (vacation, sick, break, ...).
  for (const absence of absences) {
    const cut = { start: new Date(absence.startAt), end: new Date(absence.endAt) };
    windows = windows.flatMap((w) => subtractRange([w], cut));
  }

  if (preferredTimeRange) {
    const pref: TimeRange = {
      start: localTimeToUtc(date, preferredTimeRange.fromTime, timezone),
      end: localTimeToUtc(date, preferredTimeRange.toTime, timezone),
    };
    windows = windows
      .map((w) => ({
        start: new Date(Math.max(w.start.getTime(), pref.start.getTime())),
        end: new Date(Math.min(w.end.getTime(), pref.end.getTime())),
      }))
      .filter((w) => w.end > w.start);
  }

  const totalMs = serviceDurationMinutes * 60_000;
  const bufferBeforeMs = bufferBeforeMinutes * 60_000;
  const bufferAfterMs = bufferAfterMinutes * 60_000;
  const stepMs = slotGranularityMinutes * 60_000;
  const earliestStart = new Date(now.getTime() + earliestBookingLeadMinutes * 60_000);
  const latestStart = new Date(now.getTime() + maxAdvanceBookingDays * 24 * 60 * 60_000);

  const busyBlocks: TimeRange[] = existingAppointments.map((a) => ({
    start: new Date(a.startAt),
    end: new Date(a.endAt),
  }));

  const slots: Date[] = [];

  for (const window of windows) {
    // Align the first candidate to the slot grid within the window.
    let cursor = new Date(
      Math.ceil(window.start.getTime() / stepMs) * stepMs
    );

    while (cursor.getTime() + totalMs <= window.end.getTime()) {
      const occupancyStart = new Date(cursor.getTime() - bufferBeforeMs);
      const occupancyEnd = new Date(cursor.getTime() + totalMs + bufferAfterMs);

      const withinLeadTime = cursor >= earliestStart && cursor <= latestStart;
      const overlapsExisting = busyBlocks.some(
        (b) => occupancyStart < b.end && occupancyEnd > b.start
      );

      if (withinLeadTime && !overlapsExisting) {
        slots.push(new Date(cursor));
      }

      cursor = new Date(cursor.getTime() + stepMs);
    }
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
}
