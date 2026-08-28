import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditCustomerButton } from "./edit-customer-button";
import { CustomerGdprActions } from "./customer-gdpr-actions";
import { formatPrice, initials } from "@/lib/utils";
import { Phone, Mail, Star, MapPin, Building2 } from "lucide-react";
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_TONE, type CustomerStatus } from "@/lib/validation/customers";
import type { CustomFieldDefinition, CustomFieldType } from "@/lib/validation/custom-fields";

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "danger" | "warning" | "neutral" }> = {
  booked: { label: "Gebucht", tone: "success" },
  completed: { label: "Abgeschlossen", tone: "neutral" },
  cancelled: { label: "Storniert", tone: "danger" },
  no_show: { label: "Nicht erschienen", tone: "warning" },
};

export async function CustomerProfileView({
  salonId,
  customerId,
  basePath,
  avatarLabel,
  avatarImageUrl,
}: {
  salonId: string;
  customerId: string;
  basePath: string;
  avatarLabel: string;
  avatarImageUrl?: string;
}) {
  const supabase = await createClient();
  const [{ data: customer }, { data: employees }, { data: customFieldDefinitions }] = await Promise.all([
    supabase.from("customers").select("*, preferred:preferred_employee_id(first_name, last_name)").eq("id", customerId).eq("salon_id", salonId).single(),
    supabase.from("employees").select("id, first_name, last_name").eq("salon_id", salonId).eq("active", true),
    supabase
      .from("custom_field_definitions")
      .select("*")
      .eq("salon_id", salonId)
      .eq("entity_type", "customer")
      .eq("active", true)
      .order("sort_order"),
  ]);

  if (!customer || customer.deleted_at) notFound();

  const [{ data: appointments }, { data: calls }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, start_at, end_at, status, total_price_cents, employees(first_name, last_name), appointment_services(service_id, services(name))")
      .eq("customer_id", customerId)
      .order("start_at", { ascending: false })
      .limit(20),
    supabase.from("calls").select("id, started_at, duration_seconds, topic, outcome").eq("customer_id", customerId).order("started_at", { ascending: false }).limit(10),
  ]);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div>
      <Topbar
        title={`${customer.first_name} ${customer.last_name}`.trim() || customer.phone}
        subtitle={customer.phone}
        avatarLabel={avatarLabel}
        avatarImageUrl={avatarImageUrl}
        right={
          <EditCustomerButton
            salonId={salonId}
            redirectPath={basePath}
            employees={employees ?? []}
            customFieldDefinitions={(customFieldDefinitions ?? []) as CustomFieldDefinition[]}
            customer={customer}
          />
        }
      />
      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bronze-soft text-sm font-semibold text-bronze-dark">
                  {initials(customer.first_name || "?", customer.last_name || "")}
                </div>
                <div>
                  <p className="font-display text-lg text-ink">
                    {customer.first_name} {customer.last_name}
                  </p>
                  <p className="text-xs text-ink-faint">Kunde seit {new Intl.DateTimeFormat("de-DE").format(new Date(customer.created_at))}</p>
                </div>
              </div>
              <Badge tone={CUSTOMER_STATUS_TONE[customer.status as CustomerStatus] ?? "neutral"}>
                {CUSTOMER_STATUS_LABEL[customer.status as CustomerStatus] ?? customer.status}
              </Badge>
            </div>
            {(customer.tags ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(customer.tags ?? []).map((t: string) => (
                  <span key={t} className="rounded-full bg-sand px-2.5 py-1 text-xs text-ink-soft">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center gap-2 text-ink-soft">
                <Phone className="h-3.5 w-3.5" /> {customer.phone}
              </p>
              {customer.email && (
                <p className="flex items-center gap-2 text-ink-soft">
                  <Mail className="h-3.5 w-3.5" /> {customer.email}
                </p>
              )}
              {customer.company && (
                <p className="flex items-center gap-2 text-ink-soft">
                  <Building2 className="h-3.5 w-3.5" /> {customer.company}
                </p>
              )}
              {customer.address && (
                <p className="flex items-center gap-2 text-ink-soft">
                  <MapPin className="h-3.5 w-3.5" /> {customer.address}
                </p>
              )}
              {customer.preferred && (
                <p className="flex items-center gap-2 text-ink-soft">
                  <Star className="h-3.5 w-3.5" /> Bevorzugt: {(customer.preferred as { first_name: string; last_name: string }).first_name}
                </p>
              )}
            </div>
            {customer.notes && (
              <div className="mt-4 rounded-lg bg-sand p-3 text-sm text-ink-soft">{customer.notes}</div>
            )}
            {customFieldDefinitions && customFieldDefinitions.length > 0 && (
              <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                {(customFieldDefinitions as CustomFieldDefinition[]).map((f) => {
                  const value = (customer.custom_fields as Record<string, unknown> | null)?.[f.key];
                  if (value === undefined || value === null || value === "") return null;
                  return (
                    <p key={f.id} className="text-xs text-ink-soft">
                      <span className="text-ink-faint">{f.label}:</span>{" "}
                      {f.field_type === ("boolean" as CustomFieldType) ? (value ? "Ja" : "Nein") : String(value)}
                    </p>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="mb-3 text-sm font-medium text-ink-soft">Datenschutz</p>
            <div className="mb-3 flex flex-wrap gap-2 text-xs text-ink-soft">
              <Badge tone={customer.consent_recording ? "success" : "neutral"}>
                {customer.consent_recording ? "Aufzeichnung erlaubt" : "Aufzeichnung nicht erlaubt"}
              </Badge>
              <Badge tone={customer.consent_marketing ? "success" : "neutral"}>
                {customer.consent_marketing ? "Marketing erlaubt" : "Marketing nicht erlaubt"}
              </Badge>
            </div>
            <CustomerGdprActions salonId={salonId} customerId={customer.id} redirectPath={basePath} />
          </Card>

          <Card>
            <CardHeader title="Anrufhistorie" />
            <div className="p-5 pt-3 space-y-3">
              {(calls ?? []).length === 0 && <p className="text-sm text-ink-faint">Keine Anrufe erfasst.</p>}
              {(calls ?? []).map((c) => (
                <div key={c.id} className="text-sm">
                  <p className="text-ink">{fmt(c.started_at)}</p>
                  <p className="text-xs text-ink-soft">
                    {Math.round(c.duration_seconds / 60)} Min. {c.topic ? `· ${c.topic}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Termine" subtitle={`${(appointments ?? []).length} Termine`} />
            <div className="divide-y divide-border">
              {(appointments ?? []).map((a) => {
                const status = STATUS_LABEL[a.status] ?? STATUS_LABEL.booked;
                const services = (a.appointment_services ?? [])
                  .map((s: { services: { name: string } | null }) => s.services?.name)
                  .filter(Boolean)
                  .join(", ");
                const employee = a.employees as unknown as { first_name: string; last_name: string } | null;
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-ink">{fmt(a.start_at)}</p>
                      <p className="text-xs text-ink-soft">
                        {services || "Leistung"} · {employee?.first_name ?? ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-ink-soft">{formatPrice(a.total_price_cents)}</span>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
              {(appointments ?? []).length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-ink-faint">Noch keine Termine.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
