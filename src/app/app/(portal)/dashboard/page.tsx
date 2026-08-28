import Link from "next/link";
import { Phone, CalendarCheck, UserPlus, Euro, Clock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatPrice } from "@/lib/utils";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

export default async function SalonDashboardPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const { data: salon } = await supabase
    .from("salons")
    .select("name, onboarding_completed_at")
    .eq("id", salonId)
    .single();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [
    { data: callsToday },
    { data: appointmentsToday },
    { data: newCustomersToday },
    { data: recentCalls },
    { data: callbacks },
    { data: nextAppointments },
    { data: callsYesterday },
    { data: appointmentsYesterday },
    { data: newCustomersYesterday },
  ] = await Promise.all([
      supabase.from("calls").select("id").eq("salon_id", salonId).gte("started_at", todayStart.toISOString()),
      supabase
        .from("appointments")
        .select("id, start_at, status, source, total_price_cents, customers(first_name, last_name), employees(first_name, color), appointment_services(services(name))")
        .eq("salon_id", salonId)
        .neq("status", "cancelled")
        .gte("start_at", todayStart.toISOString())
        .lte("start_at", todayEnd.toISOString())
        .order("start_at"),
      supabase.from("customers").select("id").eq("salon_id", salonId).gte("created_at", todayStart.toISOString()),
      supabase
        .from("calls")
        .select("id, started_at, phone_number, topic, outcome, customers(first_name, last_name)")
        .eq("salon_id", salonId)
        .order("started_at", { ascending: false })
        .limit(5),
      supabase
        .from("callback_requests")
        .select("id, phone_number, reason, requested_at, customers(first_name, last_name)")
        .eq("salon_id", salonId)
        .eq("status", "open")
        .order("requested_at", { ascending: false })
        .limit(5),
      supabase
        .from("appointments")
        .select("id, start_at, source, customers(first_name, last_name), employees(first_name, color), appointment_services(services(name))")
        .eq("salon_id", salonId)
        .eq("status", "booked")
        .gt("start_at", new Date().toISOString())
        .order("start_at")
        .limit(5),
      supabase.from("calls").select("id").eq("salon_id", salonId).gte("started_at", yesterdayStart.toISOString()).lt("started_at", todayStart.toISOString()),
      supabase
        .from("appointments")
        .select("id, status, total_price_cents")
        .eq("salon_id", salonId)
        .eq("status", "booked")
        .gte("start_at", yesterdayStart.toISOString())
        .lt("start_at", todayStart.toISOString()),
      supabase.from("customers").select("id").eq("salon_id", salonId).gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
    ]);

  const bookedToday = (appointmentsToday ?? []).filter((a) => a.status === "booked");
  const totalValue = bookedToday.reduce((sum, a) => sum + a.total_price_cents, 0);
  const yesterdayValue = (appointmentsYesterday ?? []).reduce((sum, a) => sum + a.total_price_cents, 0);

  const trend = (current: number, previous: number): string | undefined => {
    if (previous === 0) return current > 0 ? "neu" : undefined;
    const pct = Math.round(((current - previous) / previous) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}% vs. gestern`;
  };

  const fmtTime = (iso: string) => new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const fmtDay = (iso: string) => new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div>
      <Topbar title={`${greeting()}, ${salon?.name}`} subtitle="Hier ist dein Überblick für heute." avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {!salon?.onboarding_completed_at && (
          <Link
            href="/app/onboarding"
            className="flex items-center justify-between gap-3 rounded-2xl border border-bronze/30 bg-bronze-soft px-5 py-4 transition-colors hover:bg-bronze-soft/80"
          >
            <div>
              <p className="text-sm font-medium text-ink">Einrichtung unvollständig</p>
              <p className="mt-0.5 text-xs text-ink-soft">Unternehmen, Branche und Unternehmensdaten weiter einrichten.</p>
            </div>
            <Badge tone="bronze">Fortsetzen</Badge>
          </Link>
        )}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            icon={Phone}
            label="Anrufe heute"
            value={String((callsToday ?? []).length)}
            deltaLabel={trend((callsToday ?? []).length, (callsYesterday ?? []).length)}
          />
          <StatCard
            icon={CalendarCheck}
            label="Termine gebucht"
            value={String(bookedToday.length)}
            deltaLabel={trend(bookedToday.length, (appointmentsYesterday ?? []).length)}
          />
          <StatCard
            icon={UserPlus}
            label="Neukunden"
            value={String((newCustomersToday ?? []).length)}
            deltaLabel={trend((newCustomersToday ?? []).length, (newCustomersYesterday ?? []).length)}
          />
          <StatCard
            icon={Euro}
            label="Gebuchter Terminwert"
            value={formatPrice(totalValue)}
            deltaLabel={trend(totalValue, yesterdayValue)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader title="Heutige Termine" action={<Link href="/app/calendar" className="text-sm text-bronze-dark hover:underline">Kalender →</Link>} />
              <div className="divide-y divide-border">
                {bookedToday.map((a) => {
                  const customer = a.customers as unknown as { first_name: string; last_name: string } | null;
                  const employee = a.employees as unknown as { first_name: string; color: string | null } | null;
                  const services = (a.appointment_services ?? []) as unknown as { services: { name: string } | null }[];
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: employee?.color ?? "var(--color-bronze)" }} />
                      <span className="w-14 shrink-0 text-sm font-medium text-ink">{fmtTime(a.start_at)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm text-ink">
                          {customer ? `${customer.first_name} ${customer.last_name}`.trim() : "Kunde"}
                          {a.source === "voice_ai" && <Sparkles className="h-3 w-3 shrink-0 text-gold" />}
                        </p>
                        <p className="truncate text-xs text-ink-soft">
                          {services.map((s) => s.services?.name).filter(Boolean).join(", ")} · {employee?.first_name}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-ink-soft">{formatPrice(a.total_price_cents)}</span>
                    </div>
                  );
                })}
                {bookedToday.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Heute sind noch keine Termine gebucht.</p>}
              </div>
            </Card>

            <Card>
              <CardHeader title="Nächste Termine" />
              <div className="divide-y divide-border">
                {(nextAppointments ?? []).map((a) => {
                  const customer = a.customers as unknown as { first_name: string; last_name: string } | null;
                  const employee = a.employees as unknown as { first_name: string; color: string | null } | null;
                  const services = (a.appointment_services ?? []) as unknown as { services: { name: string } | null }[];
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: employee?.color ?? "var(--color-bronze)" }} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm text-ink">
                          {fmtDay(a.start_at)} · {customer ? `${customer.first_name} ${customer.last_name}`.trim() : "Kunde"}
                          {a.source === "voice_ai" && <Sparkles className="h-3 w-3 shrink-0 text-gold" />}
                        </p>
                        <p className="truncate text-xs text-ink-soft">
                          {services.map((s) => s.services?.name).filter(Boolean).join(", ")} · {employee?.first_name}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(nextAppointments ?? []).length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Keine kommenden Termine.</p>}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Letzte Anrufe" action={<Link href="/app/calls" className="text-sm text-bronze-dark hover:underline">Alle anzeigen</Link>} />
              <div className="divide-y divide-border">
                {(recentCalls ?? []).map((c) => {
                  const customer = c.customers as unknown as { first_name: string; last_name: string } | null;
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bronze-soft text-bronze-dark shadow-[0_0_12px_rgba(169,112,255,0.15)]">
                        <Phone className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{customer ? `${customer.first_name} ${customer.last_name}`.trim() : c.phone_number}</p>
                        <p className="truncate text-xs text-ink-soft">{fmtTime(c.started_at)}{c.topic ? ` · ${c.topic}` : ""}</p>
                      </div>
                      {c.outcome === "appointment_booked" && <Badge tone="success" className="shrink-0">Termin gebucht</Badge>}
                    </div>
                  );
                })}
                {(recentCalls ?? []).length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Noch keine Anrufe.</p>}
              </div>
            </Card>

            <Card>
              <CardHeader title="Rückrufe" action={<Link href="/app/calls" className="text-sm text-bronze-dark hover:underline">Alle anzeigen</Link>} />
              <div className="divide-y divide-border">
                {(callbacks ?? []).map((cb) => {
                  const customer = cb.customers as unknown as { first_name: string; last_name: string } | null;
                  return (
                    <div key={cb.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
                        <Clock className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{customer ? `${customer.first_name} ${customer.last_name}`.trim() : cb.phone_number}</p>
                        <p className="truncate text-xs text-ink-soft">{fmtTime(cb.requested_at)}{cb.reason ? ` · ${cb.reason}` : ""}</p>
                      </div>
                    </div>
                  );
                })}
                {(callbacks ?? []).length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Keine offenen Rückrufe.</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
