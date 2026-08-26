"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekOverviewAction } from "@/lib/actions/calendar-data";
import { addMonthsStr, formatDayNum, formatMonthLabel, isSameMonth, monthGridDates, todayStr } from "@/lib/date";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function MiniMonthCalendar({
  salonId,
  selectedDate,
  onSelectDate,
}: {
  salonId: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const [cursor, setCursor] = useState(selectedDate);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const today = todayStr();
  const dates = monthGridDates(cursor);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- month navigation refetch
    setCursor(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    getWeekOverviewAction(salonId, dates).then((res) => {
      const next: Record<string, number> = {};
      for (const [date, entries] of Object.entries(res)) next[date] = entries.length;
      setCounts(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId, dates.join(",")]);

  return (
    <div className="rounded-2xl border border-border bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm capitalize text-ink">{formatMonthLabel(cursor)}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => addMonthsStr(c, -1))}
            aria-label="Vorheriger Monat"
            className="rounded-md p-1 text-ink-soft hover:bg-sand"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCursor((c) => addMonthsStr(c, 1))}
            aria-label="Nächster Monat"
            className="rounded-md p-1 text-ink-soft hover:bg-sand"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="text-[10px] font-medium text-ink-faint">
            {w}
          </span>
        ))}
        {dates.map((date) => {
          const inMonth = isSameMonth(date, cursor);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const count = counts[date] ?? 0;
          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={cn(
                "relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors",
                !inMonth && "text-ink-faint/40",
                inMonth && !isSelected && "text-ink-soft hover:bg-sand",
                isSelected && "brand-gradient-bg font-semibold text-white shadow-[0_0_12px_rgba(169,112,255,0.5)]",
                !isSelected && isToday && "font-semibold text-gold"
              )}
            >
              {formatDayNum(date)}
              {count > 0 && inMonth && !isSelected && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-bronze" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
