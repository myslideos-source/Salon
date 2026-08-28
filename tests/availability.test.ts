import { describe, expect, it } from "vitest";
import { computeFreeSlots } from "@/lib/scheduling/availability";

const TZ = "Europe/Berlin";
const DATE = "2025-05-23"; // a Friday, well outside DST edge cases
const NOW = new Date("2025-05-01T08:00:00Z");

function iso(date: string, time: string) {
  // Helper for readable UTC-ish local instants (Europe/Berlin is UTC+2 in May).
  return `${date}T${time}:00+02:00`;
}

const baseInput = {
  date: DATE,
  timezone: TZ,
  businessHours: { isClosed: false, startTime: "09:00:00", endTime: "18:00:00" },
  workingHours: [{ startTime: "09:00:00", endTime: "18:00:00" }],
  absences: [],
  existingAppointments: [],
  serviceDurationMinutes: 60,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  slotGranularityMinutes: 15,
  earliestBookingLeadMinutes: 0,
  maxAdvanceBookingDays: 60,
  now: NOW,
};

describe("computeFreeSlots", () => {
  it("returns no slots when the salon is closed that day", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      businessHours: { isClosed: true, startTime: null, endTime: null },
    });
    expect(slots).toEqual([]);
  });

  it("returns no slots when the employee has no working hours that day", () => {
    const slots = computeFreeSlots({ ...baseInput, workingHours: [] });
    expect(slots).toEqual([]);
  });

  it("fills the whole open day on the slot grid when nothing else is booked", () => {
    const slots = computeFreeSlots(baseInput);
    // 09:00 -> last 60-min slot must start by 17:00 to end by 18:00.
    expect(slots[0].toISOString()).toBe(new Date(iso(DATE, "09:00")).toISOString());
    expect(slots[slots.length - 1].toISOString()).toBe(new Date(iso(DATE, "17:00")).toISOString());
    // 15-minute grid over 8 hours of bookable start times: (17:00-09:00)/15min + 1
    expect(slots.length).toBe(33);
  });

  it("blocks the section-13 example correctly (existing appt, break, absence)", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      existingAppointments: [{ startAt: iso(DATE, "09:00"), endAt: iso(DATE, "10:00") }],
      absences: [
        { startAt: iso(DATE, "12:30"), endAt: iso(DATE, "13:00") }, // Pause
        { startAt: iso(DATE, "15:00"), endAt: iso(DATE, "16:00") }, // Abwesenheit
      ],
    });

    const times = slots.map((s) => s.toISOString());

    // The pre-existing appointment blocks 09:00–10:00.
    expect(times).not.toContain(new Date(iso(DATE, "09:00")).toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "09:45")).toISOString());
    expect(times).toContain(new Date(iso(DATE, "10:00")).toISOString());

    // A 60-minute cut can't start at 11:45 (would run into the 12:30 break).
    expect(times).not.toContain(new Date(iso(DATE, "11:45")).toISOString());
    expect(times).toContain(new Date(iso(DATE, "11:00")).toISOString());

    // Nothing can start inside the break itself.
    expect(times).not.toContain(new Date(iso(DATE, "12:30")).toISOString());

    // The 15:00–16:00 absence blocks anything that would overlap it.
    expect(times).not.toContain(new Date(iso(DATE, "14:30")).toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "15:00")).toISOString());
    expect(times).toContain(new Date(iso(DATE, "16:00")).toISOString());

    // Day still closes at 18:00, so the last bookable 60-min start is 17:00.
    expect(times).toContain(new Date(iso(DATE, "17:00")).toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "17:15")).toISOString());
  });

  it("respects buffers before/after when spacing around existing appointments", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      bufferBeforeMinutes: 15,
      bufferAfterMinutes: 15,
      existingAppointments: [{ startAt: iso(DATE, "11:00"), endAt: iso(DATE, "12:00") }],
    });
    const times = slots.map((s) => s.toISOString());

    // A new 60-min booking with 15-min buffers needs to end (incl. buffer)
    // by 10:45 to leave a gap before the 11:00 appointment — so 09:45 is the
    // last valid start (09:45 + 60min + 15min buffer = 11:00).
    expect(times).toContain(new Date(iso(DATE, "09:45")).toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "10:00")).toISOString());

    // Symmetrically, the next slot must start at 12:15 or later (12:00 end
    // + 15min buffer before the new appointment's own buffer starts).
    expect(times).not.toContain(new Date(iso(DATE, "12:00")).toISOString());
    expect(times).toContain(new Date(iso(DATE, "12:15")).toISOString());
  });

  it("never offers a slot before the earliest booking lead time", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      now: new Date(iso(DATE, "10:00")),
      earliestBookingLeadMinutes: 120,
    });
    const times = slots.map((s) => s.toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "10:00")).toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "11:45")).toISOString());
    expect(times).toContain(new Date(iso(DATE, "12:00")).toISOString());
  });

  it("never offers a slot beyond the max advance booking window", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      now: new Date("2025-01-01T08:00:00Z"),
      maxAdvanceBookingDays: 5,
    });
    expect(slots).toEqual([]);
  });

  it("narrows to a preferred time range (e.g. Friday afternoon)", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      preferredTimeRange: { fromTime: "14:00", toTime: "18:00" },
    });
    const times = slots.map((s) => s.toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "09:00")).toISOString());
    expect(times).toContain(new Date(iso(DATE, "14:00")).toISOString());
    expect(times[0]).toBe(new Date(iso(DATE, "14:00")).toISOString());
  });

  it("intersects employee working hours with salon business hours", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      businessHours: { isClosed: false, startTime: "09:00:00", endTime: "14:00:00" },
      workingHours: [{ startTime: "09:00:00", endTime: "18:00:00" }],
    });
    const times = slots.map((s) => s.toISOString());
    expect(times).toContain(new Date(iso(DATE, "13:00")).toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "13:15")).toISOString());
  });

  it("supports multiple working-hour blocks per day (split shift)", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      workingHours: [
        { startTime: "09:00:00", endTime: "12:00:00" },
        { startTime: "13:00:00", endTime: "18:00:00" },
      ],
    });
    const times = slots.map((s) => s.toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "11:30")).toISOString());
    expect(times).toContain(new Date(iso(DATE, "11:00")).toISOString());
    expect(times).toContain(new Date(iso(DATE, "13:00")).toISOString());
  });

  // ── Standorte, Team, Ressourcen und Verfügbarkeit ─────────────────────

  it("never offers a slot for an inactive employee", () => {
    const slots = computeFreeSlots({ ...baseInput, employeeActive: false });
    expect(slots).toEqual([]);
  });

  it("never offers a slot when the required resource is locked/inactive", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      resourceActive: false,
      resourceWorkingHours: [{ startTime: "09:00:00", endTime: "18:00:00" }],
    });
    expect(slots).toEqual([]);
  });

  it("never offers a slot when the resource has no working hours that day", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      resourceActive: true,
      resourceWorkingHours: [],
    });
    expect(slots).toEqual([]);
  });

  it("intersects with the resource's own working hours", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      resourceActive: true,
      resourceWorkingHours: [{ startTime: "09:00:00", endTime: "12:00:00" }],
    });
    const times = slots.map((s) => s.toISOString());
    expect(times).toContain(new Date(iso(DATE, "11:00")).toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "12:00")).toISOString());
  });

  it("excludes slots that overlap an existing booking of the same resource", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      resourceActive: true,
      resourceWorkingHours: [{ startTime: "09:00:00", endTime: "18:00:00" }],
      resourceBusyBlocks: [{ startAt: iso(DATE, "10:00"), endAt: iso(DATE, "11:00") }],
    });
    const times = slots.map((s) => s.toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "10:00")).toISOString());
    expect(times).toContain(new Date(iso(DATE, "11:00")).toISOString());
  });

  it("never offers a slot once the employee already reached the daily appointment cap", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      maxAppointmentsPerDay: 2,
      appointmentsBookedToday: 2,
    });
    expect(slots).toEqual([]);
  });

  it("still offers slots below the daily appointment cap", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      maxAppointmentsPerDay: 2,
      appointmentsBookedToday: 1,
    });
    expect(slots.length).toBeGreaterThan(0);
  });

  it("excludes a slot once the company-wide parallel appointment cap is reached", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      maxParallelAppointments: 1,
      salonWideAppointments: [{ startAt: iso(DATE, "10:00"), endAt: iso(DATE, "11:00") }],
    });
    const times = slots.map((s) => s.toISOString());
    expect(times).not.toContain(new Date(iso(DATE, "10:00")).toISOString());
    expect(times).toContain(new Date(iso(DATE, "11:00")).toISOString());
  });

  it("allows overlapping appointments below the parallel cap", () => {
    const slots = computeFreeSlots({
      ...baseInput,
      maxParallelAppointments: 2,
      salonWideAppointments: [{ startAt: iso(DATE, "10:00"), endAt: iso(DATE, "11:00") }],
    });
    const times = slots.map((s) => s.toISOString());
    expect(times).toContain(new Date(iso(DATE, "10:00")).toISOString());
  });

  it("is unaffected by resource/parallel/daily-cap fields when they are simply omitted", () => {
    const slots = computeFreeSlots(baseInput);
    expect(slots.length).toBe(33);
  });

  // ── Kern-Terminabläufe des Kalenders: erstellen/verschieben (blockiert),
  // stornieren (gibt frei) und Dauer ändern per Resize (verändert die
  // verbleibende Kapazität am Tagesende) ────────────────────────────────

  it("create/move: a newly booked appointment blocks its own time range for further bookings", () => {
    const before = computeFreeSlots(baseInput);
    const after = computeFreeSlots({
      ...baseInput,
      existingAppointments: [{ startAt: iso(DATE, "10:00"), endAt: iso(DATE, "11:00") }],
    });
    expect(before.map((s) => s.toISOString())).toContain(new Date(iso(DATE, "10:00")).toISOString());
    expect(after.map((s) => s.toISOString())).not.toContain(new Date(iso(DATE, "10:00")).toISOString());
  });

  it("cancel: removing a cancelled appointment from the occupancy list frees its slot again", () => {
    const occupied = computeFreeSlots({
      ...baseInput,
      existingAppointments: [{ startAt: iso(DATE, "10:00"), endAt: iso(DATE, "11:00") }],
    });
    // Cancelling means the engine's caller simply stops passing this
    // appointment as occupancy (mirrors `cancelAppointment` no longer
    // counting as "booked" for `checkAvailability`'s query).
    const freedAgain = computeFreeSlots(baseInput);
    expect(occupied.map((s) => s.toISOString())).not.toContain(new Date(iso(DATE, "10:00")).toISOString());
    expect(freedAgain.map((s) => s.toISOString())).toContain(new Date(iso(DATE, "10:00")).toISOString());
  });

  it("resize: lengthening the duration removes start times that no longer fit before closing", () => {
    const shortSlots = computeFreeSlots({ ...baseInput, serviceDurationMinutes: 60 }).map((s) => s.toISOString());
    const longSlots = computeFreeSlots({ ...baseInput, serviceDurationMinutes: 180 }).map((s) => s.toISOString());
    // 17:00 + 60min still fits before 18:00 closing, but 17:00 + 180min does not.
    expect(shortSlots).toContain(new Date(iso(DATE, "17:00")).toISOString());
    expect(longSlots).not.toContain(new Date(iso(DATE, "17:00")).toISOString());
    expect(longSlots[longSlots.length - 1]).toBe(new Date(iso(DATE, "15:00")).toISOString());
  });

  it("resize: shortening the duration around an existing appointment reopens slots that used to collide", () => {
    const withExisting = {
      ...baseInput,
      existingAppointments: [{ startAt: iso(DATE, "10:00"), endAt: iso(DATE, "11:00") }],
    };
    // A 90-minute service starting at 09:00 would run until 10:30, colliding
    // with the 10:00 appointment.
    const longService = computeFreeSlots({ ...withExisting, serviceDurationMinutes: 90 }).map((s) => s.toISOString());
    expect(longService).not.toContain(new Date(iso(DATE, "09:00")).toISOString());
    // Resized down to 60 minutes, 09:00 no longer overlaps 10:00 and is free again.
    const shortService = computeFreeSlots({ ...withExisting, serviceDurationMinutes: 60 }).map((s) => s.toISOString());
    expect(shortService).toContain(new Date(iso(DATE, "09:00")).toISOString());
  });
});
