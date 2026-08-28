import { describe, expect, it } from "vitest";
import { matchesCallFilters, type FilterableCall } from "@/lib/calls/filters";

function call(overrides: Partial<FilterableCall> = {}): FilterableCall {
  return {
    appointmentId: null,
    hasCallback: false,
    resolved: true,
    urgency: "normal",
    customerStatus: null,
    ...overrides,
  };
}

describe("matchesCallFilters", () => {
  it("shows every call when no filter is active", () => {
    expect(matchesCallFilters(call(), new Set())).toBe(true);
    expect(matchesCallFilters(call({ resolved: false, urgency: "urgent" }), new Set())).toBe(true);
  });

  it("filters by booked appointment", () => {
    const active = new Set(["appointment_booked"] as const);
    expect(matchesCallFilters(call({ appointmentId: null }), active)).toBe(false);
    expect(matchesCallFilters(call({ appointmentId: "appt-1" }), active)).toBe(true);
  });

  it("filters by callback requirement", () => {
    const active = new Set(["callback_needed"] as const);
    expect(matchesCallFilters(call({ hasCallback: false }), active)).toBe(false);
    expect(matchesCallFilters(call({ hasCallback: true }), active)).toBe(true);
  });

  it("filters unresolved calls", () => {
    const active = new Set(["unresolved"] as const);
    expect(matchesCallFilters(call({ resolved: true }), active)).toBe(false);
    expect(matchesCallFilters(call({ resolved: false }), active)).toBe(true);
  });

  it("treats both 'high' and 'urgent' urgency as urgent", () => {
    const active = new Set(["urgent"] as const);
    expect(matchesCallFilters(call({ urgency: "low" }), active)).toBe(false);
    expect(matchesCallFilters(call({ urgency: "normal" }), active)).toBe(false);
    expect(matchesCallFilters(call({ urgency: "high" }), active)).toBe(true);
    expect(matchesCallFilters(call({ urgency: "urgent" }), active)).toBe(true);
  });

  it("distinguishes new vs. existing customers", () => {
    const existing = new Set(["existing_customer"] as const);
    const fresh = new Set(["new_customer"] as const);
    expect(matchesCallFilters(call({ customerStatus: null }), existing)).toBe(false);
    expect(matchesCallFilters(call({ customerStatus: "new" }), existing)).toBe(false);
    expect(matchesCallFilters(call({ customerStatus: "returning" }), existing)).toBe(true);
    expect(matchesCallFilters(call({ customerStatus: "new" }), fresh)).toBe(true);
    expect(matchesCallFilters(call({ customerStatus: "returning" }), fresh)).toBe(false);
    expect(matchesCallFilters(call({ customerStatus: null }), fresh)).toBe(false);
  });

  it("combines multiple active filters with AND semantics", () => {
    const active = new Set(["urgent", "callback_needed"] as const);
    expect(matchesCallFilters(call({ urgency: "urgent", hasCallback: true }), active)).toBe(true);
    expect(matchesCallFilters(call({ urgency: "urgent", hasCallback: false }), active)).toBe(false);
    expect(matchesCallFilters(call({ urgency: "low", hasCallback: true }), active)).toBe(false);
  });
});
