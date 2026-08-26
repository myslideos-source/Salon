"use client";

import { Badge } from "@/components/ui/badge";
import { updateSignupRequestStatusAction } from "@/lib/actions/signups";

const STATUS_TONE = { new: "warning", contacted: "info", activated: "success", declined: "danger" } as const;
const STATUS_LABEL = { new: "Neu", contacted: "Kontaktiert", activated: "Freigeschaltet", declined: "Abgelehnt" } as const;
const PLAN_LABEL = { starter: "Starter", salon: "Salon", pro: "Pro" } as const;

type SignupRequest = {
  id: string;
  salon_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  plan: string;
  message: string | null;
  status: string;
  created_at: string;
};

export function SignupRequestRow({ request }: { request: SignupRequest }) {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  const nextStatus: Record<string, "new" | "contacted" | "activated" | "declined"> = {
    new: "contacted",
    contacted: "activated",
    activated: "new",
    declined: "new",
  };

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{request.salon_name}</p>
          <p className="text-xs text-ink-soft">{request.contact_name} · {request.email}{request.phone ? ` · ${request.phone}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="bronze">{PLAN_LABEL[request.plan as keyof typeof PLAN_LABEL] ?? request.plan}</Badge>
          <button onClick={() => updateSignupRequestStatusAction(request.id, nextStatus[request.status] ?? "new")}>
            <Badge tone={STATUS_TONE[request.status as keyof typeof STATUS_TONE] ?? "neutral"}>
              {STATUS_LABEL[request.status as keyof typeof STATUS_LABEL] ?? request.status}
            </Badge>
          </button>
        </div>
      </div>
      {request.message && <p className="mt-2 text-sm text-ink-soft">{request.message}</p>}
      <p className="mt-2 text-xs text-ink-faint">Eingegangen {fmt(request.created_at)} · Klick auf den Status, um ihn zu ändern</p>
      {request.status === "contacted" && (
        <button
          className="mt-2 text-xs text-danger hover:underline"
          onClick={() => updateSignupRequestStatusAction(request.id, "declined")}
        >
          Als abgelehnt markieren
        </button>
      )}
    </div>
  );
}
