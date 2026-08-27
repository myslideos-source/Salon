import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, ADMIN_AVATAR_URL } from "@/lib/utils";

export default async function AdminAllAppointmentsPage() {
  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, start_at, status, total_price_cents, salons(id, name), customers(first_name, last_name), employees(first_name)")
    .neq("status", "cancelled")
    .gte("start_at", new Date().toISOString())
    .order("start_at")
    .limit(100);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div>
      <Topbar title="Termine" subtitle="Kommende Termine, alle Salons" avatarLabel="Admin" avatarImageUrl={ADMIN_AVATAR_URL} />
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <div className="divide-y divide-border">
            {(appointments ?? []).map((a) => {
              const salon = a.salons as unknown as { id: string; name: string } | null;
              const customer = a.customers as unknown as { first_name: string; last_name: string } | null;
              const employee = a.employees as unknown as { first_name: string } | null;
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{fmt(a.start_at)}</p>
                    <p className="text-xs text-ink-soft">
                      {customer ? `${customer.first_name} ${customer.last_name}`.trim() : "Kunde"} · {employee?.first_name}
                      {salon && (
                        <>
                          {" · "}
                          <Link href={`/admin/salons/${salon.id}/calendar`} className="text-bronze-dark hover:underline">
                            {salon.name}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-soft">{formatPrice(a.total_price_cents)}</span>
                    <Badge tone={a.status === "booked" ? "success" : "neutral"}>{a.status}</Badge>
                  </div>
                </div>
              );
            })}
            {(appointments ?? []).length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-faint">Keine kommenden Termine.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
