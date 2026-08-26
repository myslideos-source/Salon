import { LayoutGrid, Building2, Phone, CalendarClock, Activity } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/salons", label: "Salons", icon: Building2 },
  { href: "/admin/calls", label: "Anrufe", icon: Phone },
  { href: "/admin/appointments", label: "Termine", icon: CalendarClock },
  { href: "/admin/system", label: "Systemstatus", icon: Activity },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar
        brandHref="/admin/dashboard"
        navItems={navItems}
        footer={
          <div className="mt-auto px-2">
            <p className="rounded-xl bg-sand px-3 py-2.5 text-xs text-ink-faint">
              Betreiber-Admin
            </p>
          </div>
        }
      />
      <div className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-cream/80 px-4 py-3 lg:hidden">
          <span className="font-display text-lg text-ink">
            SalonCall <span className="text-bronze">AI</span>
          </span>
        </div>
        <main className="flex-1">{children}</main>
      </div>
      <MobileNav navItems={navItems} />
    </div>
  );
}
