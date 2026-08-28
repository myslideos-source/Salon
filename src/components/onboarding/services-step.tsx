"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServicesManager, type Service } from "@/components/services/services-manager";
import { createServiceSelfAction } from "@/lib/actions/services";
import { advanceOnboardingStepAction } from "@/lib/actions/onboarding";
import type { OnboardingDraft } from "@/lib/validation/onboarding";

const PALETTE = ["#8A7159", "#4F7D5C", "#B8873F", "#4F6F8F", "#B1533F", "#7C8B6E", "#8C6D9E", "#5C554C"];

/**
 * Onboarding-Schritt 7 "Terminarten & Leistungen". Nutzt dieselbe
 * ServicesManager-Komponente wie `/app/services` (keine Duplikate) und
 * bietet zusätzlich eine Schnellübernahme der in Schritt 2 gesammelten
 * Branchenvorschläge: ein Klick legt daraus eine echte Terminart an,
 * vorbefüllt mit den zu diesem Zeitpunkt im Entwurf stehenden Buchungs-
 * fragen/Kundenangaben — alles bleibt danach frei bearbeitbar oder
 * löschbar, genau wie die Vorschläge selbst.
 */
export function ServicesStep({
  salonId,
  services,
  employees,
  resources,
  locations,
  draft,
  onBack,
  onSaved,
}: {
  salonId: string;
  services: Service[];
  employees: { id: string; name: string }[];
  resources: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  draft: OnboardingDraft;
  onBack: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createdNames, setCreatedNames] = useState<string[]>([]);

  const existingNames = new Set([...services.map((s) => s.name.toLowerCase()), ...createdNames.map((n) => n.toLowerCase())]);
  const pendingSuggestions = draft.suggestedServices.filter((item) => !existingNames.has(item.text.toLowerCase()));

  function quickCreate(name: string) {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", "");
    formData.set("category", "");
    formData.set("duration_minutes", "60");
    formData.set("has_price", "false");
    formData.set("price_cents", "0");
    formData.set("buffer_before_minutes", "0");
    formData.set("buffer_after_minutes", "0");
    formData.set("color", PALETTE[services.length % PALETTE.length]);
    formData.set("location_id", "");
    formData.set("bookable_phone", "true");
    formData.set("bookable_online", "true");
    formData.set("active", "true");
    formData.set("required_customer_fields", JSON.stringify(draft.suggestedRequiredFields));
    formData.set(
      "custom_questions",
      JSON.stringify(draft.suggestedQuestions.map((q) => ({ id: q.id, label: q.text, type: "text", required: false, options: [] })))
    );

    startTransition(async () => {
      const result = await createServiceSelfAction(salonId, null, formData);
      if (!result?.error) {
        setCreatedNames((names) => [...names, name]);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">
        Lege fest, welche Terminarten und Leistungen Mia anbieten darf — mit Dauer, Preis, Vor-/Nachbereitungszeit, Kalenderfarbe,
        zuständigen Mitarbeitern und Ressourcen sowie eigenen Buchungsfragen.
      </p>

      {pendingSuggestions.length > 0 && (
        <div className="rounded-xl border border-border bg-white/[0.02] p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-soft">
            <Sparkles className="h-4 w-4 text-bronze-dark" /> Vorschläge aus deiner Branche
          </p>
          <div className="flex flex-wrap gap-2">
            {pendingSuggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={pending}
                onClick={() => quickCreate(item.text)}
                className="rounded-lg border border-bronze/40 bg-bronze-soft px-3 py-1.5 text-sm text-bronze-dark transition-colors hover:bg-bronze hover:text-white disabled:opacity-50"
              >
                + {item.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <ServicesManager salonId={salonId} services={services} employees={employees} resources={resources} locations={locations} canManage />

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <Button
          type="button"
          variant="bronze"
          onClick={async () => {
            await advanceOnboardingStepAction(salonId, 10);
            onSaved();
          }}
        >
          Weiter zum Kalendertest <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
