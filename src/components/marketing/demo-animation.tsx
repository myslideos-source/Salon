"use client";

import { useEffect, useState } from "react";
import { Phone, Sparkles, Scissors, User, Calendar, Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Phone, label: "Julia ruft an", detail: "„Ich brauche Freitag Nachmittag einen Termin zum Schneiden.“" },
  { icon: Sparkles, label: "Anfrage verstanden", detail: "Die KI erkennt Anliegen, Kundin und Wunschzeit." },
  { icon: Scissors, label: "Damen Schnitt", detail: "Leistung wird erkannt · 60 Minuten" },
  { icon: User, label: "Anna", detail: "Bevorzugter Mitarbeiter wird berücksichtigt" },
  { icon: Search, label: "Kalender wird geprüft", detail: "SalonCall prüft Annas echten Terminkalender" },
  { icon: Calendar, label: "15:30 Uhr verfügbar", detail: "Freitag, 15:30–16:30 Uhr" },
  { icon: CheckCircle2, label: "Termin gebucht ✓", detail: "Erscheint sofort im Salon-Kalender" },
];

export function DemoAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-3xl border border-border bg-white/70 p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bronze/60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-bronze" />
        </span>
        <p className="text-sm font-medium text-ink-soft">Live-Simulation eines Anrufs</p>
      </div>

      <div className="space-y-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div
              key={s.label}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500",
                active
                  ? "border-bronze bg-bronze-soft/60 scale-[1.01] shadow-sm"
                  : done
                    ? "border-transparent opacity-40"
                    : "border-transparent opacity-30"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                  active ? "bg-bronze text-white" : "bg-sand text-ink-faint"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-medium", active ? "text-ink" : "text-ink-soft")}>{s.label}</p>
                <p className="truncate text-xs text-ink-faint">{s.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
