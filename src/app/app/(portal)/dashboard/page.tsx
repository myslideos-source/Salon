import Link from "next/link";
import { Phone, CalendarCheck, UserPlus, Euro, Clock, Sparkles, PhoneCall, ClipboardList, Gauge, Trophy, Radio, Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { getSalonEmployeesAction } from "@/lib/actions/calendar-data";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { MiaStatusCard, resolveMiaStatus } from "@/components/dashboard/mia-status-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatPrice, formatDuration } from "@/lib/utils";
import { computePeriodMetrics, computeEmployeeUtilization, averageUtilization } from "@/lib/stats/metrics";
import { getRecentActivity, type ActivityItem } from "@/lib/stats/activity";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";
import type { CustomFieldDefinition } from "@/lib/validation/custom-fields";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function pct(rate: number | null): string {
  return rate === null ? "–" : `${Math.round(rate * 100)}%`;
}

const ACTIVITY_ICON: Record<ActivityItem["type"], typeof Phone> = {
  appointment: CalendarCheck,
  call: Phone,
  customer: UserPlus,
  callback: PhoneCall,
  request: ClipboardList,
};

export default async function SalonDashboardPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const { data: salon } = await supabase
    .from("salons")
    .select("name, timezone, onboarding_completed_at, ai_active, is_demo")
    .eq("id", salonId)
    .single();
  const { data: voiceSettings } = await supabase.from("voice_settings").select("phone_number").eq("salon_id", salonId).maybeSingle();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const todayIso = todayStart.toISOString().slice(0, 10);

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
    { data: openRequests },
    todayMetrics,
    utilizationRows,
    activity,
    employees,
    { data: services },
    { data: customFieldDefinitions },
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
    supabase.from("requests").select("id").eq("salon_id", salonId).not("status", "in", "(done,rejected)"),
    computePeriodMetrics(supabase, salonId, todayStart, todayEnd),
    computeEmployeeUtilization(supabase, salonId, todayIso),
    getRecentActivity(supabase, salonId, 8),
    getSalonEmployeesAction(salonId),
    supabase.from("services").select("id, name, duration_minutes, price_cents, color").eq("salon_id", salonId).eq("active", true).order("sort_order"),
    supabase.from("custom_field_definitions").select("*").eq("salon_id", salonId).eq("entity_type", "customer").eq("active", true).order("sort_order"),
  ]);

  const bookedToday = (appointmentsToday ?? []).filter((a) => a.status === "booked");
  const totalValue = bookedToday.reduce((sum, a) => sum + a.total_price_cents, 0);
  const yesterdayValue = (appointmentsYesterday ?? []).reduce((sum, a) => sum + a.total_price_cents, 0);

  const trend = (current: number, previous: number): string | undefined => {
    if (previous === 0) return current > 0 ? "neu" : undefined;
    const percentage = Math.round(((current - previous) / previous) * 100);
    return `${percentage >= 0 ? "+" : ""}${percentage}% vs. gestern`;
  };

  const fmtTime = (iso: string) => new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const fmtDay = (iso: string) => new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const fmtActivityTime = (iso: string) => {
    // eslint-disable-next-line react-hooks/purity -- server component, evaluated per request
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
    if (minutes < 1) return "gerade eben";
    if (minutes < 60) return `vor ${minutes} Min.`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  };

  const miaStatus = resolveMiaStatus({ onboarding_completed_at: salon?.onboarding_completed_at ?? null, ai_active: salon?.ai_active ?? false }, voiceSettings?.phone_number ?? null);
  const avgUtilization = averageUtilization(utilizationRows);

  return (
    <div>
      <Topbar
        title={
          <span className="flex items-center gap-2">
            {greeting()}, {salon?.name}
            {salon?.is_demo && <Badge tone="bronze">Demo</Badge>}
          </span>
        }
        subtitle="Hier ist dein Überblick für heute."
        avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL}
      />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <MiaStatusCard status={miaStatus} />

        <QuickActions
          salonId={salonId}
          timezone={salon?.timezone ?? "Europe/Berlin"}
          employees={employees}
          services={services ?? []}
          customFieldDefinitions={(customFieldDefinitions ?? []) as CustomFieldDefinition[]}
        />

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

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={PhoneCall} label="Offene Rückrufe" value={String((callbacks ?? []).length)} />
          <StatCard icon={ClipboardList} label="Ungelöste Anfragen" value={String((openRequests ?? []).length)} />
          <StatCard icon={Gauge} label="Auslastung heute" value={pct(avgUtilization)} />
          <StatCard icon={Timer} label="Zeitersparnis heute" value={formatDuration(todayMetrics.estimatedMinutesSaved)} />
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={Trophy} label="Erfolgsquote heute" value={pct(todayMetrics.bookingRate)} />
          <StatCard icon={Radio} label="Erreichbarkeit heute" value={pct(todayMetrics.reachabilityRate)} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader title="Heutige Termine" action={<Link href="/app/calendar" className="text-sm text-bronze-dark hover:underline">Kalender →</Link>} />
              <div className="divide-y divide-border">
                {bookedToday.map((a) => {
                  const customer = a.customers as unknown as { first_name: string; last_name: string } | null;
                  const employee = a.employees as unknown as { first_name: string; color: string | null } | null;
                  const appointmentServices = (a.appointment_services ?? []) as unknown as { services: { name: string } | null }[];
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
                          {appointmentServices.map((s) => s.services?.name).filter(Boolean).join(", ")} · {employee?.first_name}
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
                  const appointmentServices = (a.appointment_services ?? []) as unknown as { services: { name: string } | null }[];
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: employee?.color ?? "var(--color-bronze)" }} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm text-ink">
                          {fmtDay(a.start_at)} · {customer ? `${customer.first_name} ${customer.last_name}`.trim() : "Kunde"}
                          {a.source === "voice_ai" && <Sparkles className="h-3 w-3 shrink-0 text-gold" />}
                        </p>
                        <p className="truncate text-xs text-ink-soft">
                          {appointmentServices.map((s) => s.services?.name).filter(Boolean).join(", ")} · {employee?.first_name}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(nextAppointments ?? []).length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Keine kommenden Termine.</p>}
              </div>
            </Card>

            <Card>
              <CardHeader title="Aktuelle Aktivitäten" />
              <div className="divide-y divide-border">
                {activity.map((item) => {
                  const Icon = ACTIVITY_ICON[item.type];
                  return (
                    <Link key={item.id} href={item.href} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-sand">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bronze-soft text-bronze-dark">
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{item.title}</p>
                        <p className="truncate text-xs text-ink-soft">{item.subtitle ? `${item.subtitle} · ` : ""}{fmtActivityTime(item.timestamp)}</p>
                      </div>
                    </Link>
                  );
                })}
                {activity.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Noch keine Aktivitäten.</p>}
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
