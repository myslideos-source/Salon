"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./sidebar";
import { cn } from "@/lib/utils";

export function MobileNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-cream/95 px-2 py-2 backdrop-blur-sm lg:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
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
