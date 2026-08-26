"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatShortDay, formatTime } from "@/lib/date";
import { getWeekOverviewAction } from "@/lib/actions/calendar-data";

type DayEntry = { id: string; startAt: string; employeeName: string; employeeColor: string; customerName: string };

export function WeekView({
  salonId,
  dates,
  timezone,
  onSelectDay,
}: {
  salonId: string;
  dates: string[];
  timezone: string;
  onSelectDay: (date: string) => void;
}) {
  const [data, setData] = useState<Record<string, DayEntry[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on date range change
    setLoading(true);
    getWeekOverviewAction(salonId, dates).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [salonId, dates.join(",")]);

  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:p-6 lg:p-8 sm:grid-cols-2 xl:grid-cols-7">
      {dates.map((date) => {
        const entries = data[date] ?? [];
        return (
          <Card key={date} className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelectDay(date)}>
            <p className="text-sm font-medium text-ink capitalize">{formatShortDay(date)}</p>
            <p className="text-xs text-ink-faint mb-2">{loading ? "…" : `${entries.length} Termine`}</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scroll-thin">
              {entries.slice(0, 6).map((e) => (
                <div key={e.id} className="flex items-center gap-1.5 text-xs">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: e.employeeColor }} />
                  <span className="text-ink-faint shrink-0">{formatTime(e.startAt, timezone)}</span>
                  <span className="truncate text-ink-soft">{e.customerName}</span>
                </div>
              ))}
              {entries.length > 6 && <p className="text-[11px] text-ink-faint">+{entries.length - 6} weitere</p>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
