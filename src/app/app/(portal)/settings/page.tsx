import Link from "next/link";
import { ClipboardList, UsersRound, Sparkles, ChevronRight, MapPin, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiToggle } from "@/components/layout/ai-toggle";
import { DEFAULT_COMPANY_LABEL, TERMINOLOGY } from "@/lib/terminology";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  trial: "Testphase",
  paused: "Pausiert",
};

const LINKS = [
  { href: "/app/ai", label: "Meine Mia", description: "Begrüßung, Tonalität und Fachwissen deines Telefonassistenten.", icon: Sparkles },
  { href: "/app/services", label: TERMINOLOGY.servicePlural, description: "Terminarten, Dauer und Preise.", icon: ClipboardList },
  { href: "/app/team", label: TERMINOLOGY.teamAndResources, description: "Mitarbeiter, Ressourcen und Abwesenheiten verwalten.", icon: UsersRound },
  { href: "/app/locations", label: "Standorte", description: "Filialen und Standorte verwalten.", icon: MapPin },
  { href: "/app/availability", label: "Verfügbarkeit", description: "Öffnungszeiten, Feiertage, Buchungsregeln und Rückrufzeiträume.", icon: CalendarClock },
];

export default async function SalonSettingsPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const { data: salon } = await supabase.from("salons").select("id, name, timezone, status, ai_active").eq("id", salonId).single();

  return (
    <div>
      <Topbar title="Einstellungen" subtitle={`${TERMINOLOGY.company}, KI-Status und weiterführende Bereiche.`} avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-2xl">
        <Card>
          <CardHeader
            title={salon?.name ?? TERMINOLOGY.company}
            subtitle={salon ? `Zeitzone ${salon.timezone}` : undefined}
            action={salon && <Badge tone={salon.status === "active" ? "success" : "neutral"}>{STATUS_LABEL[salon.status] ?? salon.status}</Badge>}
          />
          <div className="flex items-center justify-between gap-3 p-5 pt-4">
            <div>
              <p className="text-sm font-medium text-ink">KI-Telefonassistent</p>
              <p className="text-xs text-ink-soft">Nimmt Anrufe entgegen, wenn aktiv.</p>
            </div>
            {salon && <AiToggle salonId={salon.id} initialActive={salon.ai_active} />}
          </div>
        </Card>

        <Card>
          <CardHeader title="Bereiche" subtitle="Weitere Einstellungen deines Unternehmens." />
          <div className="divide-y divide-border">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-sand">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bronze-soft text-bronze-dark">
                  <link.icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{link.label}</p>
                  <p className="truncate text-xs text-ink-soft">{link.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
