import { Phone, CalendarCheck, UserPlus, XCircle, PhoneMissed, PhoneCall, Timer, Trophy, Radio, Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatDuration } from "@/lib/utils";
import { computePeriodMetrics, computeEmployeeUtilization } from "@/lib/stats/metrics";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

function trend(current: number, previous: number): string | undefined {
  if (previous === 0) return current > 0 ? "neu" : undefined;
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% vs. Vorwoche`;
}

function pct(rate: number | null): string {
  return rate === null ? "–" : `${Math.round(rate * 100)}%`;
}

function fmtDuration(seconds: number | null): string {
  if (seconds === null) return "–";
  const minutes = Math.round(seconds / 60);
  return minutes === 0 ? `${seconds} Sek.` : formatDuration(minutes);
}

export default async function SalonStatsPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const allowed = await checkPermission(salonId, "view_statistics");
  if (!allowed) {
    return (
      <div>
        <Topbar title="Statistiken" avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} />
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            <p className="px-5 py-8 text-center text-sm text-ink-soft">Für deine Rolle sind Statistiken nicht sichtbar.</p>
          </Card>
        </div>
      </div>
    );
  }

  const { data: salon } = await supabase.from("salons").select("is_demo").eq("id", salonId).single();

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);
  const prevStart = new Date(periodStart);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = periodStart;
  const todayIso = periodEnd.toISOString().slice(0, 10);

  const [current, previous, utilization] = await Promise.all([
    computePeriodMetrics(supabase, salonId, periodStart, periodEnd),
    computePeriodMetrics(supabase, salonId, prevStart, prevEnd),
    computeEmployeeUtilization(supabase, salonId, todayIso),
  ]);

  return (
    <div>
      <Topbar
        title={
          <span className="flex items-center gap-2">
            Statistiken
            {salon?.is_demo && <Badge tone="bronze">Demo</Badge>}
          </span>
        }
        subtitle="Die letzten 7 Tage im Überblick."
        avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL}
      />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={Phone} label="Anrufe (7 Tage)" value={String(current.callsTotal)} deltaLabel={trend(current.callsTotal, previous.callsTotal)} />
          <StatCard icon={CalendarCheck} label="Termine gebucht" value={String(current.bookedAppointments)} deltaLabel={trend(current.bookedAppointments, previous.bookedAppointments)} />
          <StatCard icon={UserPlus} label="Neukunden" value={String(current.newCustomers)} deltaLabel={trend(current.newCustomers, previous.newCustomers)} />
          <StatCard icon={XCircle} label="Stornierungen" value={String(current.cancelledAppointments)} deltaLabel={trend(current.cancelledAppointments, previous.cancelledAppointments)} />
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={Trophy} label="Buchungsquote" value={pct(current.bookingRate)} />
          <StatCard icon={XCircle} label="Stornoquote" value={pct(current.cancellationRate)} />
          <StatCard icon={PhoneCall} label="Rückrufquote" value={pct(current.callbackRate)} />
          <StatCard icon={Radio} label="Erreichbarkeit" value={pct(current.reachabilityRate)} />
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={PhoneMissed} label="Verpasste Anrufe" value={String(current.callsMissed)} deltaLabel={trend(current.callsMissed, previous.callsMissed)} />
          <StatCard icon={Clock3} label="Ø Gesprächsdauer" value={fmtDuration(current.avgCallDurationSeconds)} />
          <StatCard icon={Timer} label="Geschätzte Zeitersparnis" value={formatDuration(current.estimatedMinutesSaved)} />
          <StatCard icon={CalendarCheck} label="Nicht erschienen" value={String(current.noShowAppointments)} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Beliebteste Leistungen" subtitle="Nach gebuchten Terminen der letzten 7 Tage." />
            <div className="divide-y divide-border">
              {current.topServices.map(({ name, count }) => (
                <div key={name} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-ink">{name}</p>
                  <p className="text-sm text-ink-soft">{count}</p>
                </div>
              ))}
              {current.topServices.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Noch keine Daten für diesen Zeitraum.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Häufigste Anliegen" subtitle="Aus den Gesprächsthemen der letzten 7 Tage." />
            <div className="divide-y divide-border">
              {current.topTopics.map(({ topic, count }) => (
                <div key={topic} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-ink">{topic}</p>
                  <p className="text-sm text-ink-soft">{count}</p>
                </div>
              ))}
              {current.topTopics.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Noch keine Daten für diesen Zeitraum.</p>}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Auslastung je Mitarbeiter" subtitle="Gebuchte Terminminuten gegenüber hinterlegter Arbeitszeit, heute." />
          <div className="divide-y divide-border">
            {utilization.map((row) => (
              <div key={row.employeeId} className="flex items-center gap-3 px-5 py-3">
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: row.color ?? "var(--color-bronze)" }} />
                <p className="min-w-0 flex-1 truncate text-sm text-ink">{row.name}</p>
                <p className="shrink-0 text-sm text-ink-soft">{row.rate === null ? "Keine Arbeitszeit hinterlegt" : pct(row.rate)}</p>
              </div>
            ))}
            {utilization.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Keine aktiven Mitarbeiter hinterlegt.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
