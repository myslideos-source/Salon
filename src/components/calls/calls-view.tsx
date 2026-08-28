import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { PhoneOff } from "lucide-react";
import { CallbackRow } from "./callback-row";
import { CallsList, type CallListItem } from "./calls-list";
import { RecordingConsentCard } from "./recording-consent-card";

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
  const [{ data: calls }, { data: callbacks }, { data: voiceSettings }] = await Promise.all([
    supabase
      .from("calls")
      .select(
        "id, started_at, duration_seconds, phone_number, topic, summary, outcome, status, urgency, resolved, notes, transcript, recording_url, appointment_id, customers(first_name, last_name, status), appointments(start_at, employees(first_name), appointment_services(services(name)))"
      )
      .eq("salon_id", salonId)
      .order("started_at", { ascending: false })
      .limit(100),
    supabase
      .from("callback_requests")
      .select("*, customers(first_name, last_name)")
      .eq("salon_id", salonId)
      .order("requested_at", { ascending: false }),
    supabase.from("voice_settings").select("phone_number, provider, recording_enabled").eq("salon_id", salonId).maybeSingle(),
  ]);

  const callbackCallIds = new Set((callbacks ?? []).filter((cb) => cb.call_id).map((cb) => cb.call_id as string));

  const callItems: CallListItem[] = (calls ?? []).map((c) => {
    const customer = c.customers as unknown as { first_name: string; last_name: string; status: string } | null;
    const appointment = c.appointments as unknown as {
      start_at: string;
      employees: { first_name: string } | null;
      appointment_services: { services: { name: string } | null }[];
    } | null;
    return {
      id: c.id,
      startedAt: c.started_at,
      durationSeconds: c.duration_seconds,
      phoneNumber: c.phone_number,
      customerName: customer ? `${customer.first_name} ${customer.last_name}`.trim() : null,
      customerStatus: customer?.status ?? null,
      topic: c.topic,
      summary: c.summary,
      outcome: c.outcome,
      status: c.status,
      urgency: c.urgency as CallListItem["urgency"],
      resolved: c.resolved,
      notes: c.notes,
      transcript: c.transcript,
      recordingUrl: c.recording_url,
      hasCallback: callbackCallIds.has(c.id) || c.outcome === "callback_requested",
      appointmentId: c.appointment_id,
      appointment: appointment
        ? {
            startAt: appointment.start_at,
            employeeName: appointment.employees?.first_name ?? null,
            serviceNames: (appointment.appointment_services ?? []).map((s) => s.services?.name).filter((n): n is string => Boolean(n)),
          }
        : null,
    };
  });

  const phoneConnected = Boolean(voiceSettings?.phone_number);

  return (
    <div>
      <Topbar title="Anrufe" subtitle={`${callItems.length} Anrufe protokolliert`} avatarLabel={avatarLabel} avatarImageUrl={avatarImageUrl} />
      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {!phoneConnected && (
            <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-5 py-4">
              <PhoneOff className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-medium text-ink">Demo-Modus · keine Telefonnummer verbunden</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Es sind noch keine echten Anrufe möglich. Unten angezeigte Gespräche stammen aus Testdaten bzw. dem
                  Testchat unter „Meine Mia&rdquo;. Sobald eine Telefonnummer verbunden ist, erscheinen hier echte
                  Anrufe automatisch.
                </p>
              </div>
            </div>
          )}

          <Card>
            <CallsList salonId={salonId} calls={callItems} redirectPath={basePath} />
          </Card>
        </div>

        <div className="space-y-6">
          <RecordingConsentCard salonId={salonId} initialEnabled={voiceSettings?.recording_enabled ?? false} revalidatePath={basePath} />

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
