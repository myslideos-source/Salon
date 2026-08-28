"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiToggle } from "@/components/layout/ai-toggle";
import { completeOnboardingAction } from "@/lib/actions/onboarding";

/** Schritt 12 "Mia aktivieren" — der letzte Schritt des Assistenten. */
export function ActivateStep({
  salonId,
  phoneConnected,
  initialActive,
  onBack,
}: {
  salonId: string;
  phoneConnected: boolean;
  initialActive: boolean;
  onBack: () => void;
}) {
  const router = useRouter();
  const [finishing, startFinishing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-cream-soft/60 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bronze-soft text-bronze-dark">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">KI-Telefonassistent</p>
          <p className="text-xs text-ink-soft">
            {phoneConnected
              ? "Nimmt Anrufe auf deiner verbundenen Telefonnummer entgegen, wenn aktiv."
              : "Ohne verbundene Telefonnummer bleibt Mia im Demo-Modus (Testchat unter „Meine Mia“) — die Aktivierung hier steuert nur die Bereitschaft, sobald eine Nummer verbunden ist."}
          </p>
        </div>
        <AiToggle salonId={salonId} initialActive={initialActive} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onBack} disabled={finishing}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <Button
          type="button"
          variant="bronze"
          disabled={finishing}
          onClick={() =>
            startFinishing(async () => {
              try {
                await completeOnboardingAction(salonId);
                router.push("/app/dashboard");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Fehler beim Abschließen.");
              }
            })
          }
        >
          {finishing ? "Wird abgeschlossen…" : "Einrichtung abschließen"} <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
