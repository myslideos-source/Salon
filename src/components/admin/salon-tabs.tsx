"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminSalonTabs({ salonId }: { salonId: string }) {
  const pathname = usePathname();
  const base = `/admin/salons/${salonId}`;
  const tabs = [
    { href: base, label: "Übersicht" },
    { href: `${base}/calendar`, label: "Kalender" },
    { href: `${base}/employees`, label: "Mitarbeiter" },
    { href: `${base}/services`, label: "Leistungen" },
    { href: `${base}/opening-hours`, label: "Öffnungszeiten" },
    { href: `${base}/working-hours`, label: "Arbeitszeiten" },
    { href: `${base}/customers`, label: "Kunden" },
    { href: `${base}/calls`, label: "Anrufe" },
    { href: `${base}/ai`, label: "KI-Assistent" },
    { href: `${base}/settings`, label: "Einstellungen" },
  ];

  return (
    <div className="mt-4 -mb-4 flex gap-1 overflow-x-auto scroll-thin">
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active ? "border-bronze text-ink" : "border-transparent text-ink-faint hover:text-ink-soft"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
