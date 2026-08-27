import { Phone, CalendarCheck, UserPlus, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

function trend(current: number, previous: number): string | undefined {
  if (previous === 0) return current > 0 ? "neu" : undefined;
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% vs. Vorwoche`;
}

export default async function SalonStatsPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);
  const prevStart = new Date(periodStart);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = periodStart;

  const [
    { data: callsPeriod },
    { data: callsPrev },
    { data: appointmentsPeriod },
    { data: appointmentsPrev },
    { data: customersPeriod },
    { data: customersPrev },
    { data: openRequests },
  ] = await Promise.all([
    supabase.from("calls").select("id").eq("salon_id", salonId).gte("started_at", periodStart.toISOString()).lte("started_at", periodEnd.toISOString()),
    supabase.from("calls").select("id").eq("salon_id", salonId).gte("started_at", prevStart.toISOString()).lt("started_at", prevEnd.toISOString()),
    supabase
      .from("appointments")
      .select("id, status, appointment_services(services(name))")
      .eq("salon_id", salonId)
      .gte("start_at", periodStart.toISOString())
      .lte("start_at", periodEnd.toISOString()),
    supabase.from("appointments").select("id, status").eq("salon_id", salonId).gte("start_at", prevStart.toISOString()).lt("start_at", prevEnd.toISOString()),
    supabase.from("customers").select("id").eq("salon_id", salonId).gte("created_at", periodStart.toISOString()).lte("created_at", periodEnd.toISOString()),
    supabase.from("customers").select("id").eq("salon_id", salonId).gte("created_at", prevStart.toISOString()).lt("created_at", prevEnd.toISOString()),
    supabase.from("callback_requests").select("id").eq("salon_id", salonId).eq("status", "open"),
  ]);

  const bookedPeriod = (appointmentsPeriod ?? []).filter((a) => a.status === "booked");
  const bookedPrev = (appointmentsPrev ?? []).filter((a) => a.status === "booked");
  const cancelledPeriod = (appointmentsPeriod ?? []).filter((a) => a.status === "cancelled");
  const cancelledPrev = (appointmentsPrev ?? []).filter((a) => a.status === "cancelled");

  const serviceCounts = new Map<string, number>();
  for (const a of bookedPeriod) {
    const links = (a.appointment_services ?? []) as unknown as { services: { name: string } | null }[];
    for (const link of links) {
      const name = link.services?.name;
      if (!name) continue;
      serviceCounts.set(name, (serviceCounts.get(name) ?? 0) + 1);
    }
  }
  const topServices = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <Topbar title="Statistiken" subtitle="Die letzten 7 Tage im Überblick." avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={Phone} label="Anrufe (7 Tage)" value={String((callsPeriod ?? []).length)} deltaLabel={trend((callsPeriod ?? []).length, (callsPrev ?? []).length)} />
          <StatCard icon={CalendarCheck} label="Termine gebucht" value={String(bookedPeriod.length)} deltaLabel={trend(bookedPeriod.length, bookedPrev.length)} />
          <StatCard icon={UserPlus} label="Neukunden" value={String((customersPeriod ?? []).length)} deltaLabel={trend((customersPeriod ?? []).length, (customersPrev ?? []).length)} />
          <StatCard icon={XCircle} label="Stornierungen" value={String(cancelledPeriod.length)} deltaLabel={trend(cancelledPeriod.length, cancelledPrev.length)} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Beliebteste Leistungen" subtitle="Nach gebuchten Terminen der letzten 7 Tage." />
            <div className="divide-y divide-border">
              {topServices.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-ink">{name}</p>
                  <p className="text-sm text-ink-soft">{count}</p>
                </div>
              ))}
              {topServices.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Noch keine Daten für diesen Zeitraum.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Offene Anfragen" subtitle="Aktuell wartende Rückrufwünsche." />
            <div className="p-5 pt-4">
              <p className="brand-gradient-text font-display text-3xl tracking-tight">{(openRequests ?? []).length}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
