import { redirect } from "next/navigation";
import { LayoutGrid, Calendar, Clock, Users, Phone, CalendarOff, Sparkles, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SalonProvider } from "@/components/layout/salon-context";
import { AiToggle } from "@/components/layout/ai-toggle";
import { Logo } from "@/components/brand/logo";

const iconProps = { className: "h-5 w-5", strokeWidth: 1.8 };

const navItems: NavItem[] = [
  { href: "/app/dashboard", label: "Übersicht", icon: <LayoutGrid {...iconProps} /> },
  { href: "/app/calendar", label: "Kalender", icon: <Calendar {...iconProps} /> },
  { href: "/app/appointments", label: "Termine", icon: <Clock {...iconProps} /> },
  { href: "/app/customers", label: "Kunden", icon: <Users {...iconProps} /> },
  { href: "/app/calls", label: "Anrufe", icon: <Phone {...iconProps} /> },
  { href: "/app/absences", label: "Abwesenheiten", icon: <CalendarOff {...iconProps} /> },
  { href: "/app/ai", label: "KI-Assistent", icon: <Sparkles {...iconProps} /> },
];

export default async function SalonAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session);
  if (!salonId) redirect("/app/login?error=no_salon");

  const supabase = await createClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, slug, status, ai_active, timezone")
    .eq("id", salonId)
    .single();

  if (!salon) redirect("/app/login?error=no_salon");

  return (
    <SalonProvider
      salon={{
        id: salon.id,
        name: salon.name,
        slug: salon.slug,
        status: salon.status,
        aiActive: salon.ai_active,
        timezone: salon.timezone,
      }}
    >
      <div className="flex min-h-screen bg-cream">
        <Sidebar
          brandHref="/app/dashboard"
          navItems={navItems}
          footer={
            <div className="mt-auto space-y-3 px-2">
              <a
                href="mailto:support@saloncall.ai"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-sand hover:text-ink transition-colors"
              >
                <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.8} />
                Support
              </a>
            </div>
          }
        />
        <div className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-cream/80 px-4 py-3 lg:hidden">
            <Logo size="lg" />
            <AiToggle salonId={salon.id} initialActive={salon.ai_active} />
          </div>
          <main className="flex-1">{children}</main>
        </div>
        <MobileNav navItems={navItems} />
      </div>
    </SalonProvider>
  );
}
