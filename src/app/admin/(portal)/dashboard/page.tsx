import Link from "next/link";
import { Building2, Phone, CalendarCheck, Clock, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ count: activeSalons }, { data: callsToday }, { count: appointmentsToday }, { data: salons }] = await Promise.all([
    supabase.from("salons").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("calls").select("duration_seconds").gte("started_at", todayStart.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .neq("status", "cancelled")
      .gte("start_at", todayStart.toISOString()),
    supabase.from("salons").select("id, name, status, ai_active").order("created_at", { ascending: false }),
  ]);

  const aiMinutesToday = Math.round((callsToday ?? []).reduce((sum, c) => sum + c.duration_seconds, 0) / 60);

  const salonIds = (salons ?? []).map((s) => s.id);
  const { data: callCounts } = salonIds.length
    ? await supabase.from("calls").select("salon_id").in("salon_id", salonIds)
    : { data: [] as { salon_id: string }[] };
  const countBySalon = new Map<string, number>();
  for (const c of callCounts ?? []) countBySalon.set(c.salon_id, (countBySalon.get(c.salon_id) ?? 0) + 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">Überblick über alle SalonCall-Salons.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard icon={Building2} label="Aktive Salons" value={String(activeSalons ?? 0)} />
        <StatCard icon={Phone} label="Anrufe heute" value={String((callsToday ?? []).length)} />
        <StatCard icon={CalendarCheck} label="Termine gebucht" value={String(appointmentsToday ?? 0)} />
        <StatCard icon={Clock} label="KI-Gesprächsminuten" value={String(aiMinutesToday)} />
        <StatCard icon={AlertTriangle} label="Technische Fehler" value="0" />
      </div>

      <Card>
        <CardHeader title="Salons" action={<Link href="/admin/salons" className="text-sm text-bronze-dark hover:underline">Alle anzeigen</Link>} />
        <div className="divide-y divide-border">
          {(salons ?? []).slice(0, 8).map((s) => (
            <Link key={s.id} href={`/admin/salons/${s.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-sand/50 transition-colors">
              <p className="text-sm font-medium text-ink">{s.name}</p>
              <div className="flex items-center gap-2">
                <Badge tone={s.ai_active ? "success" : "neutral"} dot>
                  {s.ai_active ? "KI aktiv" : "KI pausiert"}
                </Badge>
                <span className="text-xs text-ink-soft">{countBySalon.get(s.id) ?? 0} Anrufe</span>
              </div>
            </Link>
          ))}
          {(salons ?? []).length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-faint">Noch kein Salon angelegt.</p>}
        </div>
      </Card>
    </div>
  );
}
