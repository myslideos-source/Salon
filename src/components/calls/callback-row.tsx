"use client";

import { Badge } from "@/components/ui/badge";
import { updateCallbackStatusAction } from "@/lib/actions/calls";

const STATUS_TONE = { open: "warning", contacted: "info", resolved: "success" } as const;
const STATUS_LABEL = { open: "Offen", contacted: "Kontaktiert", resolved: "Erledigt" } as const;

type Callback = {
  id: string;
  phone_number: string;
  reason: string | null;
  note: string | null;
  status: string;
  requested_at: string;
  customers: { first_name: string; last_name: string } | null;
};

export function CallbackRow({ salonId, callback, redirectPath }: { salonId: string; callback: Callback; redirectPath: string }) {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  const nextStatus: Record<string, "open" | "contacted" | "resolved"> = {
    open: "contacted",
    contacted: "resolved",
    resolved: "open",
  };

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          {callback.customers ? `${callback.customers.first_name} ${callback.customers.last_name}`.trim() : callback.phone_number}
        </p>
        <button
          onClick={() => updateCallbackStatusAction(salonId, callback.id, nextStatus[callback.status] ?? "open", redirectPath)}
        >
          <Badge tone={STATUS_TONE[callback.status as keyof typeof STATUS_TONE] ?? "neutral"}>
            {STATUS_LABEL[callback.status as keyof typeof STATUS_LABEL] ?? callback.status}
          </Badge>
        </button>
      </div>
      <p className="text-xs text-ink-soft">{fmt(callback.requested_at)}{callback.reason ? ` · ${callback.reason}` : ""}</p>
      {callback.note && <p className="mt-0.5 text-xs text-ink-faint">{callback.note}</p>}
    </div>
  );
}
