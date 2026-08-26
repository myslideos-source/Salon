"use client";

import { useEffect, useState } from "react";
import { getWeekStatsAction } from "@/lib/actions/calendar-data";
import { formatPrice } from "@/lib/utils";

export function WeekStatsCard({ salonId, dates, refreshKey }: { salonId: string; dates: string[]; refreshKey?: number }) {
  const [stats, setStats] = useState<{ appointmentCount: number; customerCount: number; revenueCents: number } | null>(null);

  useEffect(() => {
    getWeekStatsAction(salonId, dates).then(setStats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId, dates.join(","), refreshKey]);

  return (
    <div className="rounded-2xl border border-border bg-white/[0.03] p-4 backdrop-blur-sm">
      <p className="font-display text-sm text-ink">Diese Woche</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="brand-gradient-text font-display text-xl">{stats?.appointmentCount ?? "–"}</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">Termine</p>
        </div>
        <div>
          <p className="brand-gradient-text font-display text-xl">{stats?.customerCount ?? "–"}</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">Kund:innen</p>
        </div>
        <div>
          <p className="brand-gradient-text font-display text-xl">{stats ? formatPrice(stats.revenueCents) : "–"}</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">Umsatz</p>
        </div>
      </div>
    </div>
  );
}
