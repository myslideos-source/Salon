"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterOption = { id: string; label: string; color?: string };

/** Generic multi-select dropdown used for the calendar's Mitarbeiter-,
 * Standort-, Terminart- and Status-Filter — same interaction, same look. */
export function MultiSelectFilter({
  label,
  allLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: FilterOption[];
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

  const buttonLabel =
    selected.size === 0
      ? allLabel
      : selected.size === 1
        ? (options.find((o) => o.id === [...selected][0])?.label ?? `1 ${label}`)
        : `${selected.size} ${label}`;

  if (options.length === 0) return null;

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
        {buttonLabel}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 max-h-72 overflow-y-auto scroll-thin rounded-xl border border-border bg-cream-soft p-1.5 shadow-lg">
          <button
            onClick={() => onChange(new Set())}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:bg-sand"
          >
            {allLabel}
            {selected.size === 0 && <Check className="h-3.5 w-3.5 text-bronze" />}
          </button>
          <div className="my-1 border-t border-border" />
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-sand"
            >
              <span className="flex items-center gap-2 truncate">
                {o.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />}
                <span className="truncate">{o.label}</span>
              </span>
              {selected.has(o.id) && <Check className="h-3.5 w-3.5 shrink-0 text-bronze" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
