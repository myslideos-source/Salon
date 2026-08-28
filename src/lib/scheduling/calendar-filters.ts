// Shared filter/search predicate for every calendar view (day/week/month/
// list/mobile agenda) so "Suche" and "Filtern nach Mitarbeiter, Standort,
// Terminart und Status" behave identically everywhere in the calendar.

export type CalendarFilters = {
  employeeIds: Set<string>;
  locationIds: Set<string>;
  serviceIds: Set<string>;
  /** Empty = default view: every status except "cancelled". Non-empty = show exactly these. */
  statuses: Set<string>;
  /** Trimmed, lower-cased search term; empty string = no search active. */
  search: string;
};

export function emptyCalendarFilters(): CalendarFilters {
  return { employeeIds: new Set(), locationIds: new Set(), serviceIds: new Set(), statuses: new Set(), search: "" };
}

export function hasActiveFilters(filters: CalendarFilters): boolean {
  return (
    filters.employeeIds.size > 0 ||
    filters.locationIds.size > 0 ||
    filters.serviceIds.size > 0 ||
    filters.statuses.size > 0 ||
    filters.search.length > 0
  );
}

export type FilterableAppointment = {
  employeeId: string;
  status: string;
  notes: string | null;
  customer: { firstName: string; lastName: string; phone: string } | null;
  services: { id: string; name: string }[];
};

export function matchesCalendarFilters(
  appt: FilterableAppointment,
  employeeLocationId: string | null | undefined,
  filters: CalendarFilters
): boolean {
  if (filters.employeeIds.size > 0 && !filters.employeeIds.has(appt.employeeId)) return false;

  if (filters.locationIds.size > 0) {
    if (!employeeLocationId || !filters.locationIds.has(employeeLocationId)) return false;
  }

  if (filters.serviceIds.size > 0 && !appt.services.some((s) => filters.serviceIds.has(s.id))) return false;

  if (filters.statuses.size > 0) {
    if (!filters.statuses.has(appt.status)) return false;
  } else if (appt.status === "cancelled") {
    // Default view hides cancelled appointments unless the user explicitly
    // asks for them via the status filter.
    return false;
  }

  if (filters.search) {
    const haystack = [
      appt.customer ? `${appt.customer.firstName} ${appt.customer.lastName}` : "",
      appt.customer?.phone ?? "",
      appt.notes ?? "",
      ...appt.services.map((s) => s.name),
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(filters.search)) return false;
  }

  return true;
}
