import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatPrice } from "@/lib/utils";
import { DEFAULT_COMPANY_LABEL, TERMINOLOGY } from "@/lib/terminology";

export default async function SalonServicesPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const [{ data: services }, { data: settings }] = await Promise.all([
    supabase.from("services").select("*").eq("salon_id", salonId).order("sort_order").order("name"),
    supabase.from("voice_settings").select("mention_prices").eq("salon_id", salonId).maybeSingle(),
  ]);

  const showPrices = settings?.mention_prices ?? true;

  return (
    <div>
      <Topbar
        title={TERMINOLOGY.servicePlural}
        subtitle="Terminarten und Leistungen, die Mia telefonisch anbieten kann."
        avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL}
      />
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-3">
        {(services ?? []).map((s) => (
          <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">
                  {s.name} {s.category && <span className="text-xs text-ink-faint">· {s.category}</span>}
                </p>
                <p className="text-xs text-ink-soft">
                  {formatDuration(s.duration_minutes)}
                  {showPrices && ` · ${formatPrice(s.price_cents)}`}
                </p>
              </div>
            </div>
            <Badge tone={s.active ? "success" : "neutral"} dot className="shrink-0">
              {s.active ? "Aktiv" : "Inaktiv"}
            </Badge>
          </Card>
        ))}
        {(services ?? []).length === 0 && (
          <Card className="p-8 text-center text-sm text-ink-soft">Noch keine Leistungen angelegt.</Card>
        )}
      </div>
    </div>
  );
}
