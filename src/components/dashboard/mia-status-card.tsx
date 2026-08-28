import Link from "next/link";
import { CheckCircle2, PauseCircle, ListTodo, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type MiaStatus = "active" | "paused" | "onboarding_incomplete" | "phone_not_connected";

export function resolveMiaStatus(salon: { onboarding_completed_at: string | null; ai_active: boolean }, phoneNumber: string | null): MiaStatus {
  if (!salon.onboarding_completed_at) return "onboarding_incomplete";
  if (!phoneNumber) return "phone_not_connected";
  if (!salon.ai_active) return "paused";
  return "active";
}

const STATUS_META: Record<
  MiaStatus,
  { icon: typeof CheckCircle2; label: string; description: string; tone: "success" | "warning" | "neutral"; cta?: { label: string; href: string } }
> = {
  active: {
    icon: CheckCircle2,
    label: "Mia ist aktiv",
    description: "Mia nimmt Anrufe entgegen und bucht Termine für dich.",
    tone: "success",
  },
  paused: {
    icon: PauseCircle,
    label: "Mia ist pausiert",
    description: "Anrufe werden aktuell nicht von Mia entgegengenommen.",
    tone: "warning",
    cta: { label: "In Einstellungen aktivieren", href: "/app/settings" },
  },
  onboarding_incomplete: {
    icon: ListTodo,
    label: "Einrichtung unvollständig",
    description: "Schließe die Einrichtung ab, damit Mia für dich arbeiten kann.",
    tone: "warning",
    cta: { label: "Einrichtung fortsetzen", href: "/app/onboarding" },
  },
  phone_not_connected: {
    icon: PhoneOff,
    label: "Telefonnummer noch nicht verbunden",
    description: "Ohne verbundene Nummer läuft Mia im Demo-Modus. Teste sie im Testchat.",
    tone: "warning",
    cta: { label: "Telefonnummer verbinden", href: "/app/onboarding" },
  },
};

const TONE_CLASS: Record<"success" | "warning" | "neutral", string> = {
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-ink",
  neutral: "border-border bg-sand text-ink",
};

export function MiaStatusCard({ status }: { status: MiaStatus }) {
  const meta = STATUS_META[status];
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-2xl border px-5 py-4", TONE_CLASS[meta.tone])}>
      <div className="flex items-center gap-3">
        <meta.icon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
        <div>
          <p className="text-sm font-medium">{meta.label}</p>
          <p className="mt-0.5 text-xs opacity-80">{meta.description}</p>
        </div>
      </div>
      {meta.cta && (
        <Link href={meta.cta.href} className="shrink-0 rounded-full bg-white/60 px-3 py-1.5 text-xs font-medium text-ink hover:bg-white/80">
          {meta.cta.label}
        </Link>
      )}
    </div>
  );
}
