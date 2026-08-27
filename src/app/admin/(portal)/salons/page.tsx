import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Phone, ArrowRight } from "lucide-react";
import { NewSalonButton } from "@/components/admin/new-salon-button";
import { ADMIN_AVATAR_URL } from "@/lib/utils";

export default async function AdminSalonsPage() {
  const session = await requirePlatformAdmin();
  const supabase = await createClient();

  const { data: salons } = await supabase
    .from("salons")
    .select("id, name, slug, status, ai_active, address, created_at")
    .order("created_at", { ascending: false });

  const salonIds = (salons ?? []).map((s) => s.id);
  const { data: callCounts } = salonIds.length
    ? await supabase.from("calls").select("salon_id").in("salon_id", salonIds)
    : { data: [] as { salon_id: string }[] };

  const countBySalon = new Map<string, number>();
  for (const c of callCounts ?? []) {
    countBySalon.set(c.salon_id, (countBySalon.get(c.salon_id) ?? 0) + 1);
  }

  return (
    <div>
      <Topbar title="Salons" subtitle={`Angemeldet als ${session.email}`} avatarLabel="Admin" avatarImageUrl={ADMIN_AVATAR_URL} right={<NewSalonButton />} />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(salons ?? []).map((salon) => (
            <Link key={salon.id} href={`/admin/salons/${salon.id}`}>
              <Card className="group h-full p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg text-ink">{salon.name}</h3>
                    <p className="mt-0.5 text-xs text-ink-faint">{salon.address ?? "Keine Adresse hinterlegt"}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge tone={salon.status === "active" ? "success" : salon.status === "trial" ? "info" : "neutral"} dot>
                    {salon.status === "active" ? "Aktiv" : salon.status === "trial" ? "Testphase" : "Pausiert"}
                  </Badge>
                  <Badge tone={salon.ai_active ? "bronze" : "neutral"} dot>
                    {salon.ai_active ? "KI aktiv" : "KI pausiert"}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-sm text-ink-soft">
                  <Phone className="h-3.5 w-3.5" />
                  {countBySalon.get(salon.id) ?? 0} Anrufe insgesamt
                </div>
              </Card>
            </Link>
          ))}
        </div>
        {(salons ?? []).length === 0 && (
          <Card className="p-10 text-center text-ink-soft">
            Noch kein Salon angelegt. Lege den ersten Salon an, um zu starten.
          </Card>
        )}
      </div>
    </div>
  );
}
