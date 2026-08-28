"use client";

import { useState, useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import { NOTIFICATION_EVENT_LABEL, type NotificationEventType } from "@/lib/notifications/types";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
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

export function NotificationsList({ salonId, notifications }: { salonId: string; notifications: NotificationRow[] }) {
  const [rows, setRows] = useState(notifications);
  const [pending, startTransition] = useTransition();
  const unreadCount = rows.filter((r) => !r.read_at).length;

  function markOne(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, read_at: r.read_at ?? new Date().toISOString() } : r)));
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  }

  function markAll() {
    setRows((prev) => prev.map((r) => ({ ...r, read_at: r.read_at ?? new Date().toISOString() })));
    startTransition(async () => {
      await markAllNotificationsReadAction(salonId);
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="font-display text-lg text-ink">Benachrichtigungen</p>
          <p className="text-xs text-ink-soft">{unreadCount > 0 ? `${unreadCount} ungelesen` : "Alles gelesen"}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAll} disabled={pending}>
            <CheckCheck className="h-4 w-4" /> Alle als gelesen markieren
          </Button>
        )}
      </div>
      <div className="divide-y divide-border">
        {rows.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.read_at && markOne(n.id)}
            className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-sand"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bronze-soft text-bronze-dark">
              <Bell className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm text-ink">
                {!n.read_at && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />}
                {n.title}
              </p>
              {n.body && <p className="mt-0.5 text-xs text-ink-soft">{n.body}</p>}
              <p className="mt-1 text-xs text-ink-faint">
                {NOTIFICATION_EVENT_LABEL[n.type as NotificationEventType] ?? n.type} · {timeAgo(n.created_at)}
              </p>
            </div>
          </button>
        ))}
        {rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-faint">Noch keine Benachrichtigungen.</p>}
      </div>
    </Card>
  );
}
