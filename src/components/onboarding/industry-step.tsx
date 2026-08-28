"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ComponentType } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Scissors,
  Sparkles,
  HeartPulse,
  Stethoscope,
  Gavel,
  Hammer,
  Wrench,
  Users,
  UtensilsCrossed,
  Camera,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DraftList } from "@/components/onboarding/draft-list";
import { saveIndustryStepAction } from "@/lib/actions/onboarding";
import { draftFromTemplate } from "@/lib/onboarding/steps";
import type { OnboardingDraft } from "@/lib/validation/onboarding";
import type { Tables } from "@/lib/supabase/database.types";

const ICONS: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  hairdresser: Scissors,
  beauty: Sparkles,
  physio: HeartPulse,
  medical: Stethoscope,
  legal: Gavel,
  craft: Hammer,
  consulting: Users,
  automotive: Wrench,
  restaurant: UtensilsCrossed,
  photography: Camera,
  other: Building2,
};

export function IndustryStep({
  salonId,
  templates,
  initialTemplateId,
  initialDraft,
  onSaved,
  onBack,
}: {
  salonId: string;
  templates: Tables<"industry_templates">[];
  initialTemplateId: string | null;
  initialDraft: OnboardingDraft;
  onSaved: () => void;
  onBack: () => void;
}) {
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const skipAutosave = useRef(true);

  function selectTemplate(t: Tables<"industry_templates">) {
    setTemplateId(t.id);
    setDraft(draftFromTemplate(t));
  }

  // Autospeicherung: Bearbeitungen an den Vorschlägen werden nach kurzer
  // Inaktivität automatisch gesichert, unabhängig vom "Weiter"-Klick.
  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    if (!templateId) return;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await saveIndustryStepAction(salonId, templateId, draft, false);
        if (result?.error) setError(result.error);
        else {
          setError(null);
          setSavedAt(Date.now());
        }
      });
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, templateId]);

  function handleNext() {
    if (!templateId) {
      setError("Bitte eine Branche auswählen.");
      return;
    }
    startTransition(async () => {
      const result = await saveIndustryStepAction(salonId, templateId, draft, true);
      if (result?.error) setError(result.error);
      else {
        setError(null);
        onSaved();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm text-ink-soft">
          Wähle die passende Branche. HalloMia schlägt dir dazu Terminarten, Buchungsfragen und benötigte Angaben vor.
        </p>
        <p className="mb-3 text-xs text-ink-faint">
          Ein Wechsel der Branche ersetzt nur die Vorschläge unten — nichts davon ist bereits fest angelegt, alles bleibt danach editierbar oder löschbar.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {templates.map((t) => {
            const Icon = ICONS[t.key] ?? Building2;
            const active = templateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTemplate(t)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left transition-colors",
                  active ? "border-bronze bg-bronze-soft" : "border-border bg-white/[0.03] hover:bg-sand"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-bronze-dark" : "text-ink-faint")} strokeWidth={1.8} />
                <span className={cn("text-sm font-medium", active ? "text-ink" : "text-ink-soft")}>{t.name}</span>
                {t.description && <span className="text-xs text-ink-faint">{t.description}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {templateId && (
        <div className="space-y-5 rounded-xl border border-border bg-white/[0.02] p-4">
          <DraftList
            label="Terminarten & Leistungen"
            hint="Vorschläge aus der Branchenvorlage — bearbeite, entferne oder ergänze sie."
            placeholder="Eigene Terminart hinzufügen"
            items={draft.suggestedServices}
            onChange={(items) => setDraft((d) => ({ ...d, suggestedServices: items }))}
          />
          <DraftList
            label="Buchungsfragen"
            hint="Was soll Mia bei der Terminbuchung zusätzlich abfragen?"
            placeholder="Eigene Frage hinzufügen"
            items={draft.suggestedQuestions}
            onChange={(items) => setDraft((d) => ({ ...d, suggestedQuestions: items }))}
          />
          <DraftList
            label="Benötigte Angaben"
            hint="Welche Kundenangaben werden für einen Termin gebraucht?"
            placeholder="Eigenes Feld hinzufügen"
            items={draft.suggestedRequiredFields}
            onChange={(items) => setDraft((d) => ({ ...d, suggestedRequiredFields: items }))}
          />
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <div className="flex items-center gap-3">
          {!error && savedAt && !pending && <span className="text-xs text-ink-faint">Automatisch gespeichert</span>}
          <Button type="button" variant="bronze" onClick={handleNext} disabled={pending}>
            {pending ? "Wird gespeichert…" : "Weiter"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
