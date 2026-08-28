"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { AppointmentDetailModal } from "./appointment-detail-modal";
import { Badge } from "@/components/ui/badge";
import { getListCalendarDataAction, type CalendarAppointment, type CalendarEmployee } from "@/lib/actions/calendar-data";
import { matchesCalendarFilters, type CalendarFilters } from "@/lib/scheduling/calendar-filters";
import { statusLabel, statusTone } from "@/lib/scheduling/status";
import { formatDayLabel, formatTime } from "@/lib/date";

/** "Terminliste" - the calendar's list view alongside Tag/Woche/Monat:
 * every upcoming appointment in the selected window, grouped by day, with
 * the same search/employee/location/service/status filters as the other
 * views (see `calendar-shell.tsx`). */
export function CalendarListView({
  salonId,
  fromDate,
  toDate,
  filters,
  canEdit,
  revalidatePath,
  refreshKey,
  onChanged,
}: {
  salonId: string;
  fromDate: string;
  toDate: string;
  filters: CalendarFilters;
  canEdit: boolean;
  revalidatePath: string;
  refreshKey?: number;
  onChanged: () => void;
}) {
  const [data, setData] = useState<{ timezone: string; employees: CalendarEmployee[]; appointments: CalendarAppointment[] } | null>(null);
  const [detail, setDetail] = useState<CalendarAppointment | null>(null);

  const load = () => getListCalendarDataAction(salonId, fromDate, toDate).then(setData);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId, fromDate, toDate, refreshKey]);

  const employeesById = useMemo(() => new Map((data?.employees ?? []).map((e) => [e.id, e])), [data]);

  const grouped = useMemo(() => {
    if (!data) return [] as { date: string; appointments: CalendarAppointment[] }[];
    const timezone = data.timezone;
    const visible = data.appointments.filter((a) => matchesCalendarFilters(a, employeesById.get(a.employeeId)?.locationId, filters));
    const byDate = new Map<string, CalendarAppointment[]>();
    for (const a of visible) {
      const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
        new Date(a.startAt)
      );
      byDate.set(localDate, [...(byDate.get(localDate) ?? []), a]);
    }
    return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, appointments]) => ({ date, appointments }));
  }, [data, employeesById, filters]);

  if (!data) {
    return <div className="p-10 text-center text-sm text-ink-faint">Kalender wird geladen…</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {grouped.length === 0 && (
        <div className="rounded-2xl border border-border bg-white/[0.03] p-8 text-center text-sm text-ink-soft">
          Keine Termine in diesem Zeitraum.
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(({ date, appointments }) => (
          <div key={date}>
            <p className="mb-2 font-display text-sm capitalize text-ink-soft">{formatDayLabel(date)}</p>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
              {appointments.map((a) => {
                const emp = employeesById.get(a.employeeId);
                const customerName = a.customer ? `${a.customer.firstName} ${a.customer.lastName}`.trim() : "Kunde";
                const serviceNames = a.services.map((s) => s.name).join(", ");
                const color = a.services[0]?.color ?? emp?.color ?? "#B08968";
                return (
                  <button
                    key={a.id}
                    onClick={() => setDetail(a)}
                    style={{ borderLeftColor: color }}
                    className="flex w-full items-center gap-3 border-l-4 bg-cream-soft/40 px-4 py-3 text-left transition-colors hover:bg-sand"
                  >
                    <div className="w-14 shrink-0 text-sm font-semibold text-ink">{formatTime(a.startAt, data.timezone)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                        {customerName}
                        {a.source === "voice_ai" && <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" />}
                      </p>
                      <p className="truncate text-xs text-ink-soft">
                        {serviceNames}
                        {emp ? ` · ${emp.firstName}` : ""}
                      </p>
                    </div>
                    <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {detail && (
        <AppointmentDetailModal
          appointment={detail}
          salonId={salonId}
          timezone={data.timezone}
          canEdit={canEdit}
          revalidatePath={revalidatePath}
          employees={data.employees}
          onClose={() => setDetail(null)}
          onChanged={() => {
            load();
            onChanged();
          }}
        />
      )}
    </div>
  );
}
