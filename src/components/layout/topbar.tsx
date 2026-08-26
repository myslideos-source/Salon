"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { initials } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  detail: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.round(hours / 24);
  return `vor ${days} Tg.`;
}

function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const json = (await res.json()) as { notifications: Notification[] };
        if (!cancelled) setNotifications(json.notifications);
      } catch {
        // ignore - bell just stays without a badge
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-ink-soft hover:bg-sand hover:text-ink transition-colors"
        aria-label="Benachrichtigungen"
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} />
        {notifications.length > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-bronze" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-white shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-ink">Benachrichtigungen</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-faint">Keine offenen Benachrichtigungen.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="border-b border-border px-4 py-3 last:border-b-0">
                  <p className="text-sm text-ink">{n.title}</p>
                  {n.detail && <p className="mt-0.5 text-xs text-ink-soft">{n.detail}</p>}
                  <p className="mt-1 text-xs text-ink-faint">{timeAgo(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <Link
              href={notifications[0]!.id.startsWith("signup-") ? "/admin/signups" : "/app/calls"}
              onClick={() => setOpen(false)}
              className="block border-t border-border px-4 py-2.5 text-center text-sm text-bronze-dark hover:bg-sand"
            >
              Alle ansehen
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function Topbar({
  title,
  subtitle,
  avatarLabel,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  avatarLabel: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-cream/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="truncate font-display text-xl text-ink sm:text-2xl">{title}</h1>
        </div>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {right}
        <NotificationsBell />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bronze-soft text-xs font-semibold text-bronze-dark">
          {initials(avatarLabel.split(" ")[0] ?? "S", avatarLabel.split(" ")[1] ?? "C")}
        </div>
      </div>
    </header>
  );
}
