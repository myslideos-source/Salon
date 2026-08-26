"use client";

import { useEffect, useState } from "react";
import { getWeekStatsAction } from "@/lib/actions/calendar-data";
import { formatPrice } from "@/lib/utils";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (values.length - 1);
  const points = values.map((v, i) => [i * step, h - ((v - min) / range) * (h - 4) - 2] as const);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-7 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="week-stats-sparkline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a970ff" />
          <stop offset="100%" stopColor="#ff6fb0" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="url(#week-stats-sparkline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill="#ff6fb0" />
      ))}
    </svg>
  );
}

export function WeekStatsCard({ salonId, dates, refreshKey }: { salonId: string; dates: string[]; refreshKey?: number }) {
  const [stats, setStats] = useState<{ appointmentCount: number; customerCount: number; revenueCents: number; daily: number[] } | null>(
    null
  );

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
      {stats && <Sparkline values={stats.daily} />}
    </div>
  );
}
