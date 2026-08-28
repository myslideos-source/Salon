"use client";

import { useEffect, useState } from "react";
import { getWeekOverviewAction, type MonthEntry } from "@/lib/actions/calendar-data";
import { isSameMonth, monthGridDates, todayStr } from "@/lib/date";
import { cn } from "@/lib/utils";
import { matchesCalendarFilters, type CalendarFilters } from "@/lib/scheduling/calendar-filters";

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function MonthGrid({
  salonId,
  monthDate,
  filters,
  onSelectDay,
  refreshKey,
}: {
  salonId: string;
  monthDate: string;
  filters: CalendarFilters;
  onSelectDay: (date: string) => void;
  refreshKey?: number;
}) {
  const dates = monthGridDates(monthDate);
  const [data, setData] = useState<Record<string, MonthEntry[]>>({});
  const today = todayStr();

  useEffect(() => {
    getWeekOverviewAction(salonId, dates).then(setData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId, dates.join(","), refreshKey]);

  function visibleEntries(entries: MonthEntry[]): MonthEntry[] {
    return entries.filter((en) =>
      matchesCalendarFilters(
        {
          employeeId: en.employeeId,
          status: en.status,
          notes: null,
          customer: en.customerName ? { firstName: en.customerName, lastName: "", phone: "" } : null,
          services: en.serviceIds.map((id, i) => ({ id, name: en.serviceNames[i] ?? "" })),
        },
        en.employeeLocationId,
        filters
      )
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-border">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="border-b border-border bg-cream-soft/60 py-2 text-center text-xs font-medium text-ink-faint">
            {w}
          </div>
        ))}
        {dates.map((date) => {
          const entries = visibleEntries(data[date] ?? []);
          const inMonth = isSameMonth(date, monthDate);
          const isToday = date === today;
          return (
            <button
              key={date}
              onClick={() => onSelectDay(date)}
              className={cn(
                "flex min-h-24 flex-col items-start gap-1 border-b border-r border-border p-2 text-left transition-colors hover:bg-sand",
                !inMonth && "bg-cream-soft/30"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  inMonth ? "text-ink" : "text-ink-faint/50",
                  isToday && "brand-gradient-bg font-semibold text-white"
                )}
              >
                {Number(date.slice(-2))}
              </span>
              <div className="flex flex-wrap gap-1">
                {entries.slice(0, 4).map((e) => (
                  <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: e.employeeColor }} />
                ))}
              </div>
              {entries.length > 0 && <span className="text-[10px] text-ink-faint">{entries.length} Termine</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
