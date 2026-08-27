import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneMissed, Voicemail } from "lucide-react";
import { CallbackRow } from "./callback-row";

const OUTCOME_LABEL: Record<string, { label: string; tone: "success" | "info" | "warning" | "neutral" }> = {
  appointment_booked: { label: "Termin gebucht", tone: "success" },
  appointment_rescheduled: { label: "Termin verschoben", tone: "info" },
  appointment_cancelled: { label: "Termin storniert", tone: "warning" },
  info_given: { label: "Info gegeben", tone: "neutral" },
  callback_requested: { label: "Rückruf erbeten", tone: "warning" },
  handoff: { label: "Weitergeleitet", tone: "info" },
  no_action: { label: "Keine Aktion", tone: "neutral" },
};

const STATUS_ICON = { completed: Phone, missed: PhoneMissed, voicemail: Voicemail, in_progress: Phone };

export async function CallsView({
  salonId,
  avatarLabel,
  avatarImageUrl,
  basePath,
}: {
  salonId: string;
  avatarLabel: string;
  avatarImageUrl?: string;
  basePath: string;
}) {
  const supabase = await createClient();
  const [{ data: calls }, { data: callbacks }] = await Promise.all([
    supabase
      .from("calls")
      .select("id, started_at, duration_seconds, phone_number, topic, outcome, status, customers(first_name, last_name), appointments(start_at, employees(first_name), appointment_services(services(name)))")
      .eq("salon_id", salonId)
      .order("started_at", { ascending: false })
      .limit(50),
    supabase
      .from("callback_requests")
      .select("*, customers(first_name, last_name)")
      .eq("salon_id", salonId)
      .order("requested_at", { ascending: false }),
  ]);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div>
      <Topbar title="Anrufe" subtitle={`${(calls ?? []).length} Anrufe protokolliert`} avatarLabel={avatarLabel} avatarImageUrl={avatarImageUrl} />
      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="divide-y divide-border">
              {(calls ?? []).map((c) => {
                const outcome = c.outcome ? OUTCOME_LABEL[c.outcome] : null;
                const customer = c.customers as unknown as { first_name: string; last_name: string } | null;
                const appointment = c.appointments as unknown as {
                  start_at: string;
                  employees: { first_name: string } | null;
                  appointment_services: { services: { name: string } | null }[];
                } | null;
                const StatusIcon = STATUS_ICON[c.status as keyof typeof STATUS_ICON] ?? Phone;
                return (
                  <div key={c.id} className="flex items-start justify-between gap-3 px-5 py-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-ink-soft">
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {customer ? `${customer.first_name} ${customer.last_name}`.trim() : c.phone_number ?? "Unbekannt"}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {fmt(c.started_at)} · {Math.round(c.duration_seconds / 60)} Min.
                          {c.topic ? ` · ${c.topic}` : ""}
                        </p>
                        {appointment && (
                          <p className="mt-0.5 text-xs text-bronze-dark">
                            {(appointment.appointment_services ?? []).map((s) => s.services?.name).filter(Boolean).join(", ")}
                            {appointment.employees ? ` · ${appointment.employees.first_name}` : ""} · {fmt(appointment.start_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    {outcome && <Badge tone={outcome.tone}>{outcome.label}</Badge>}
                  </div>
                );
              })}
              {(calls ?? []).length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-faint">Noch keine Anrufe erfasst.</p>}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Rückrufe" subtitle={`${(callbacks ?? []).filter((c) => c.status === "open").length} offen`} />
            <div className="divide-y divide-border">
              {(callbacks ?? []).map((cb) => (
                <CallbackRow key={cb.id} salonId={salonId} callback={cb} redirectPath={basePath} />
              ))}
              {(callbacks ?? []).length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Keine Rückrufe.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
