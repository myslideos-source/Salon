"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./sidebar";
import { cn } from "@/lib/utils";

export function MobileNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 overflow-x-auto border-t border-border bg-cream/95 px-2 py-2 backdrop-blur-sm scroll-thin lg:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-center text-[11px] font-medium leading-tight whitespace-nowrap transition-colors",
              active ? "text-bronze-dark" : "text-ink-faint"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
