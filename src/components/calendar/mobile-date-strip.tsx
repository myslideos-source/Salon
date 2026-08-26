"use client";

import { formatWeekdayShort, formatDayNum, todayStr } from "@/lib/date";
import { cn } from "@/lib/utils";

export function MobileDateStrip({
  dates,
  selectedDate,
  onSelect,
}: {
  dates: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const today = todayStr();
  return (
    <div className="flex gap-2 overflow-x-auto scroll-thin px-4 pb-1 sm:px-6">
      {dates.map((date) => {
        const selected = date === selectedDate;
        return (
          <button
            key={date}
            onClick={() => onSelect(date)}
            className={cn(
              "flex min-h-[44px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-3.5 py-1.5 transition-colors",
              selected
                ? "brand-gradient-bg text-white shadow-[0_0_16px_rgba(169,112,255,0.45)]"
                : "text-ink-soft hover:bg-sand"
            )}
          >
            <span className="text-[10px] font-medium uppercase">{formatWeekdayShort(date)}</span>
            <span className={cn("font-display text-sm", !selected && date === today && "text-gold")}>{formatDayNum(date)}</span>
          </button>
        );
      })}
    </div>
  );
}
