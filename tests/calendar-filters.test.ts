import { describe, expect, it } from "vitest";
import { emptyCalendarFilters, matchesCalendarFilters, type FilterableAppointment } from "@/lib/scheduling/calendar-filters";

function appt(overrides: Partial<FilterableAppointment> = {}): FilterableAppointment {
  return {
    employeeId: "emp-1",
    status: "booked",
    notes: null,
    customer: { firstName: "Anna", lastName: "Beispiel", phone: "+49 151 2345678" },
    services: [{ id: "svc-1", name: "Beratung" }],
    ...overrides,
  };
}

describe("matchesCalendarFilters", () => {
  it("shows everything except cancelled when no filter is set (default calendar view)", () => {
    const filters = emptyCalendarFilters();
    expect(matchesCalendarFilters(appt({ status: "booked" }), null, filters)).toBe(true);
    expect(matchesCalendarFilters(appt({ status: "completed" }), null, filters)).toBe(true);
    expect(matchesCalendarFilters(appt({ status: "no_show" }), null, filters)).toBe(true);
    expect(matchesCalendarFilters(appt({ status: "cancelled" }), null, filters)).toBe(false);
  });

  it("shows a cancelled appointment once the status filter explicitly asks for it", () => {
    const filters = { ...emptyCalendarFilters(), statuses: new Set(["cancelled"]) };
    expect(matchesCalendarFilters(appt({ status: "cancelled" }), null, filters)).toBe(true);
    expect(matchesCalendarFilters(appt({ status: "booked" }), null, filters)).toBe(false);
  });

  it("filters by employee", () => {
    const filters = { ...emptyCalendarFilters(), employeeIds: new Set(["emp-2"]) };
    expect(matchesCalendarFilters(appt({ employeeId: "emp-1" }), null, filters)).toBe(false);
    expect(matchesCalendarFilters(appt({ employeeId: "emp-2" }), null, filters)).toBe(true);
  });

  it("filters by the appointment's location (derived from the assigned employee)", () => {
    const filters = { ...emptyCalendarFilters(), locationIds: new Set(["loc-a"]) };
    expect(matchesCalendarFilters(appt(), "loc-a", filters)).toBe(true);
    expect(matchesCalendarFilters(appt(), "loc-b", filters)).toBe(false);
    expect(matchesCalendarFilters(appt(), null, filters)).toBe(false);
  });

  it("filters by Terminart/service", () => {
    const filters = { ...emptyCalendarFilters(), serviceIds: new Set(["svc-2"]) };
    expect(matchesCalendarFilters(appt({ services: [{ id: "svc-1", name: "Beratung" }] }), null, filters)).toBe(false);
    expect(
      matchesCalendarFilters(appt({ services: [{ id: "svc-1", name: "Beratung" }, { id: "svc-2", name: "Folgetermin" }] }), null, filters)
    ).toBe(true);
  });

  it("searches customer name, phone, notes and service names case-insensitively", () => {
    const withNotes = appt({ notes: "Wunsch: kürzer als letztes Mal" });
    expect(matchesCalendarFilters(withNotes, null, { ...emptyCalendarFilters(), search: "anna" })).toBe(true);
    expect(matchesCalendarFilters(withNotes, null, { ...emptyCalendarFilters(), search: "2345678" })).toBe(true);
    expect(matchesCalendarFilters(withNotes, null, { ...emptyCalendarFilters(), search: "kürzer" })).toBe(true);
    expect(matchesCalendarFilters(withNotes, null, { ...emptyCalendarFilters(), search: "beratung" })).toBe(true);
    expect(matchesCalendarFilters(withNotes, null, { ...emptyCalendarFilters(), search: "niemand" })).toBe(false);
  });

  it("combines every active filter with AND", () => {
    const filters = {
      employeeIds: new Set(["emp-1"]),
      locationIds: new Set<string>(),
      serviceIds: new Set(["svc-1"]),
      statuses: new Set(["booked"]),
      search: "anna",
    };
    expect(matchesCalendarFilters(appt(), null, filters)).toBe(true);
    expect(matchesCalendarFilters(appt({ status: "completed" }), null, filters)).toBe(false);
  });
});
