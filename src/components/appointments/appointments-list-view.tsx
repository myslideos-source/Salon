import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { CancelAppointmentButton } from "./cancel-appointment-button";

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "danger" | "warning" | "neutral" }> = {
  booked: { label: "Gebucht", tone: "success" },
  completed: { label: "Abgeschlossen", tone: "neutral" },
  cancelled: { label: "Storniert", tone: "danger" },
  no_show: { label: "Nicht erschienen", tone: "warning" },
};

export async function AppointmentsListView({
  salonId,
  basePath,
  avatarLabel,
}: {
  salonId: string;
  basePath: string;
  avatarLabel: string;
}) {
  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, start_at, end_at, status, source, total_price_cents, customers(id, first_name, last_name), employees(first_name), appointment_services(services(name))"
    )
    .eq("salon_id", salonId)
    // eslint-disable-next-line react-hooks/purity -- server component, evaluated per request
    .gte("start_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("start_at")
    .limit(100);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div>
      <Topbar title="Termine" subtitle="Alle bevorstehenden Termine" avatarLabel={avatarLabel} />
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <div className="divide-y divide-border">
            {(appointments ?? []).map((a) => {
              const status = STATUS_LABEL[a.status] ?? STATUS_LABEL.booked;
              const customer = a.customers as unknown as { id: string; first_name: string; last_name: string } | null;
              const employee = a.employees as unknown as { first_name: string } | null;
              const services = ((a.appointment_services ?? []) as unknown as { services: { name: string } | null }[])
                .map((s) => s.services?.name)
                .filter(Boolean)
                .join(", ");
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{fmt(a.start_at)}</p>
                    <p className="text-xs text-ink-soft">
                      {customer ? `${customer.first_name} ${customer.last_name}`.trim() : "Kunde"} · {services} · {employee?.first_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-soft">{formatPrice(a.total_price_cents)}</span>
                    {a.source === "voice_ai" && <Badge tone="bronze">KI</Badge>}
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {a.status === "booked" && <CancelAppointmentButton salonId={salonId} appointmentId={a.id} revalidatePath={basePath} />}
                  </div>
                </div>
              );
            })}
            {(appointments ?? []).length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-faint">Keine Termine gefunden.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
