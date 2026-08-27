import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ADMIN_AVATAR_URL } from "@/lib/utils";

export default async function AdminAllCallsPage() {
  const supabase = await createClient();
  const { data: calls } = await supabase
    .from("calls")
    .select("id, started_at, duration_seconds, phone_number, outcome, status, salons(id, name), customers(first_name, last_name)")
    .order("started_at", { ascending: false })
    .limit(100);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div>
      <Topbar title="Anrufe" subtitle="Alle Salons" avatarLabel="Admin" avatarImageUrl={ADMIN_AVATAR_URL} />
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <div className="divide-y divide-border">
            {(calls ?? []).map((c) => {
              const salon = c.salons as unknown as { id: string; name: string } | null;
              const customer = c.customers as unknown as { first_name: string; last_name: string } | null;
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {customer ? `${customer.first_name} ${customer.last_name}`.trim() : c.phone_number ?? "Unbekannt"}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {fmt(c.started_at)} · {Math.round(c.duration_seconds / 60)} Min.
                      {salon && (
                        <>
                          {" · "}
                          <Link href={`/admin/salons/${salon.id}/calls`} className="text-bronze-dark hover:underline">
                            {salon.name}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  {c.outcome && <Badge tone="neutral">{c.outcome}</Badge>}
                </div>
              );
            })}
            {(calls ?? []).length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-faint">Noch keine Anrufe.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
