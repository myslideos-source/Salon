"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getWeekOverviewAction } from "@/lib/actions/calendar-data";
import { formatTime, todayStr } from "@/lib/date";

type Entry = { id: string; startAt: string; employeeColor: string; customerName: string; serviceName: string; source: string };

export function TodayAppointmentsCard({
  salonId,
  timezone,
  refreshKey,
  appointmentsHref,
}: {
  salonId: string;
  timezone: string;
  refreshKey?: number;
  appointmentsHref: string;
}) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const today = todayStr();

  useEffect(() => {
    getWeekOverviewAction(salonId, [today]).then((res) => setEntries((res[today] ?? []) as Entry[]));
  }, [salonId, today, refreshKey]);

  return (
    <div className="rounded-2xl border border-border bg-white/[0.03] p-4 backdrop-blur-sm">
      <p className="font-display text-sm text-ink">Termine heute</p>
      <div className="mt-3 space-y-3">
        {entries === null && <p className="text-xs text-ink-faint">Wird geladen…</p>}
        {entries?.length === 0 && <p className="text-xs text-ink-faint">Heute noch keine Termine.</p>}
        {entries?.map((e) => (
          <div key={e.id} className="flex items-start gap-3">
            <div className="mt-0.5 w-10 shrink-0 text-xs font-medium text-ink-soft">{formatTime(e.startAt, timezone)}</div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm text-ink">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: e.employeeColor }} />
                {e.customerName}
                {e.source === "voice_ai" && <Sparkles className="h-3 w-3 shrink-0 text-gold" />}
              </p>
              <p className="truncate text-xs text-ink-faint">{e.serviceName}</p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href={appointmentsHref}
        className="mt-3 block rounded-lg py-1.5 text-center text-xs font-medium text-bronze-dark hover:bg-sand"
      >
        Alle Termine anzeigen →
      </Link>
    </div>
  );
}
