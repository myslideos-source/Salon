"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqManager } from "@/components/portal/faq-manager";
import { advanceOnboardingStepAction } from "@/lib/actions/onboarding";
import type { Tables } from "@/lib/supabase/database.types";

export function FaqStep({
  salonId,
  faqs,
  onSaved,
  onBack,
}: {
  salonId: string;
  faqs: Tables<"faq">[];
  onSaved: () => void;
  onBack: () => void;
}) {
  const [finishing, startFinishing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        Häufige Fragen, die Mia direkt am Telefon beantworten kann - z. B. zu Anfahrt, Zahlungsmöglichkeiten oder Besonderheiten
        deines Unternehmens. Optional, kann jederzeit unter „Meine Mia&quot; ergänzt werden.
      </p>
      <FaqManager salonId={salonId} faqs={faqs} />
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
                await advanceOnboardingStepAction(salonId, 10);
                onSaved();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Fehler beim Speichern.");
              }
            })
          }
        >
          {finishing ? "Wird gespeichert…" : "Weiter"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
