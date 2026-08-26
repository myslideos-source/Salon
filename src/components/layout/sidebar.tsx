"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function Sidebar({
  brandHref,
  navItems,
  footer,
}: {
  brandHref: string;
  navItems: NavItem[];
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex h-screen w-64 shrink-0 flex-col border-r border-border bg-cream-soft/60 px-4 py-6">
      <Link href={brandHref} className="flex items-center gap-2 px-2">
        <span className="font-display text-xl text-ink">
          SalonCall <span className="text-bronze">AI</span>
        </span>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-ink text-cream shadow-sm"
                  : "text-ink-soft hover:bg-sand hover:text-ink"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {footer}
    </aside>
  );
}
