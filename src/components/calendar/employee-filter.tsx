"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEmployee } from "@/lib/actions/calendar-data";

export function EmployeeFilter({
  employees,
  selected,
  onChange,
}: {
  employees: CalendarEmployee[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  const label = selected.size === 0 ? "Alle Mitarbeiter" : selected.size === 1
    ? employees.find((e) => e.id === [...selected][0])?.firstName ?? "1 Mitarbeiter"
    : `${selected.size} Mitarbeiter`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          selected.size > 0
            ? "border-bronze/50 bg-bronze-soft text-bronze-dark shadow-[0_0_0_1px_rgba(169,112,255,0.15)]"
            : "border-border-strong text-ink-soft hover:bg-sand"
        )}
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-border bg-cream-soft p-1.5 shadow-lg">
          <button
            onClick={() => onChange(new Set())}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:bg-sand"
          >
            Alle Mitarbeiter
            {selected.size === 0 && <Check className="h-3.5 w-3.5 text-bronze" />}
          </button>
          <div className="my-1 border-t border-border" />
          {employees.map((e) => (
            <button
              key={e.id}
              onClick={() => toggle(e.id)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-sand"
            >
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                {e.firstName} {e.lastName}
              </span>
              {selected.has(e.id) && <Check className="h-3.5 w-3.5 text-bronze" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
