import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewCustomerButton } from "./new-customer-button";
import { initials } from "@/lib/utils";
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_TONE, type CustomerStatus } from "@/lib/validation/customers";
import type { CustomFieldDefinition } from "@/lib/validation/custom-fields";

export async function CustomersView({
  salonId,
  basePath,
  avatarLabel,
  avatarImageUrl,
}: {
  salonId: string;
  basePath: string;
  avatarLabel: string;
  avatarImageUrl?: string;
}) {
  const supabase = await createClient();
  const [{ data: customers }, { data: employees }, { data: customFieldDefinitions }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, first_name, last_name, phone, email, status, tags, created_at")
      .eq("salon_id", salonId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("employees").select("id, first_name, last_name").eq("salon_id", salonId).eq("active", true),
    supabase
      .from("custom_field_definitions")
      .select("*")
      .eq("salon_id", salonId)
      .eq("entity_type", "customer")
      .eq("active", true)
      .order("sort_order"),
  ]);

  const ids = (customers ?? []).map((c) => c.id);
  const { data: appts } = ids.length
    ? await supabase.from("appointments").select("customer_id, start_at, status").in("customer_id", ids)
    : { data: [] as { customer_id: string; start_at: string; status: string }[] };

  // eslint-disable-next-line react-hooks/purity -- server component, evaluated per request
  const now = Date.now();
  const stats = new Map<string, { count: number; next?: string; last?: string }>();
  for (const a of appts ?? []) {
    const s = stats.get(a.customer_id) ?? { count: 0 };
    if (a.status !== "cancelled") s.count += 1;
    const t = new Date(a.start_at).getTime();
    if (t >= now && (!s.next || t < new Date(s.next).getTime())) s.next = a.start_at;
    if (t < now && (!s.last || t > new Date(s.last).getTime())) s.last = a.start_at;
    stats.set(a.customer_id, s);
  }

  const fmt = (iso?: string) => (iso ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(iso)) : "–");

  return (
    <div>
      <Topbar
        title="Kunden"
        subtitle={`${(customers ?? []).length} Kunden insgesamt`}
        avatarLabel={avatarLabel}
        avatarImageUrl={avatarImageUrl}
        right={
          <NewCustomerButton
            salonId={salonId}
            redirectPath={basePath}
            employees={employees ?? []}
            customFieldDefinitions={(customFieldDefinitions ?? []) as CustomFieldDefinition[]}
          />
        }
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-2">
        {(customers ?? []).map((c) => {
          const s = stats.get(c.id);
          const isNew = !s || s.count <= 1;
          return (
            <Link key={c.id} href={`${basePath}/${c.id}`}>
              <Card className="flex items-center justify-between gap-3 p-4 transition-all hover:border-bronze/40 hover:shadow-[0_0_20px_rgba(169,112,255,0.12)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bronze-soft text-xs font-semibold text-bronze-dark">
                    {initials(c.first_name || "?", c.last_name || "")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="truncate text-xs text-ink-soft">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
                    {(c.tags ?? []).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(c.tags ?? []).map((t) => (
                          <span key={t} className="rounded-full bg-sand px-2 py-0.5 text-[10px] text-ink-soft">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-ink-soft shrink-0">
                  <span>Letzter Termin: {fmt(s?.last)}</span>
                  <span>Nächster: {fmt(s?.next)}</span>
                  <Badge tone={CUSTOMER_STATUS_TONE[c.status as CustomerStatus] ?? "neutral"}>
                    {CUSTOMER_STATUS_LABEL[c.status as CustomerStatus] ?? c.status}
                  </Badge>
                  <Badge tone={isNew ? "bronze" : "neutral"}>{isNew ? "Neukunde" : `${s?.count ?? 0} Termine`}</Badge>
                </div>
              </Card>
            </Link>
          );
        })}
        {(customers ?? []).length === 0 && (
          <Card className="p-10 text-center text-ink-soft">Noch keine Kunden erfasst.</Card>
        )}
      </div>
    </div>
  );
}
