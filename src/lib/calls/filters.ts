// Pure filter logic for die Gesprächsübersicht (Konzeptabschnitt
// "Gesprächsübersicht": "Filter: Alle Gespräche / Termin gebucht / Rückruf
// erforderlich / Nicht gelöst / Dringend / Bestandskunde / Neukunde").
// Kept separate from the UI so it's independently unit-testable, same
// pattern as lib/scheduling/calendar-filters.ts.

export const CALL_FILTER_KEYS = [
  "appointment_booked",
  "callback_needed",
  "unresolved",
  "urgent",
  "existing_customer",
  "new_customer",
] as const;
export type CallFilterKey = (typeof CALL_FILTER_KEYS)[number];

export const CALL_FILTER_LABELS: Record<CallFilterKey, string> = {
  appointment_booked: "Termin gebucht",
  callback_needed: "Rückruf erforderlich",
  unresolved: "Nicht gelöst",
  urgent: "Dringend",
  existing_customer: "Bestandskunde",
  new_customer: "Neukunde",
};

export type FilterableCall = {
  appointmentId: string | null;
  hasCallback: boolean;
  resolved: boolean;
  urgency: "low" | "normal" | "high" | "urgent" | null;
  customerStatus: string | null;
};

export function matchesCallFilters(call: FilterableCall, active: Set<CallFilterKey>): boolean {
  if (active.has("appointment_booked") && !call.appointmentId) return false;
  if (active.has("callback_needed") && !call.hasCallback) return false;
  if (active.has("unresolved") && call.resolved) return false;
  if (active.has("urgent") && call.urgency !== "high" && call.urgency !== "urgent") return false;
  if (active.has("existing_customer") && !(call.customerStatus && call.customerStatus !== "new")) return false;
  if (active.has("new_customer") && call.customerStatus !== "new") return false;
  return true;
}
