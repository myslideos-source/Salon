"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { OnboardingProgressBar } from "@/components/onboarding/progress-bar";
import { CompanyStep } from "@/components/onboarding/company-step";
import { IndustryStep } from "@/components/onboarding/industry-step";
import { DetailsStep } from "@/components/onboarding/details-step";
import { LAST_INTERACTIVE_STEP } from "@/lib/onboarding/steps";
import type { OnboardingDraft } from "@/lib/validation/onboarding";
import type { Tables } from "@/lib/supabase/database.types";

export type OnboardingSalon = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  timezone: string;
  industryTemplateId: string | null;
  onboardingStep: number;
  draft: OnboardingDraft;
};

export function OnboardingWizard({
  templates,
  salon,
}: {
  templates: Tables<"industry_templates">[];
  salon: OnboardingSalon | null;
}) {
  const router = useRouter();
  const furthestReached = Math.max(salon?.onboardingStep ?? 1, 1);
  const [activeStep, setActiveStep] = useState(() => Math.min(furthestReached, LAST_INTERACTIVE_STEP));
  const [furthestStep, setFurthestStep] = useState(furthestReached);

  function advance(next: number) {
    setFurthestStep((f) => Math.max(f, next));
    setActiveStep(Math.min(next, LAST_INTERACTIVE_STEP));
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex justify-center">
          <Logo size="xl" />
        </div>
        <Card className="p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-display text-xl text-ink">Willkommen bei HalloMia</h1>
            <p className="mt-1 text-sm text-ink-soft">Richte dein Unternehmen in wenigen Schritten ein.</p>
          </div>

          <div className="mb-6">
            <OnboardingProgressBar activeStep={activeStep} furthestStep={furthestStep} onSelectStep={setActiveStep} />
          </div>

          {activeStep === 1 && (
            <CompanyStep
              salonId={salon?.id ?? null}
              initialName={salon?.name ?? ""}
              initialSlug={salon?.slug ?? ""}
              onSaved={() => advance(2)}
            />
          )}
          {activeStep === 2 && salon && (
            <IndustryStep
              salonId={salon.id}
              templates={templates}
              initialTemplateId={salon.industryTemplateId}
              initialDraft={salon.draft}
              onSaved={() => advance(3)}
              onBack={() => setActiveStep(1)}
            />
          )}
          {activeStep === 3 && salon && (
            <DetailsStep
              salonId={salon.id}
              initialPhone={salon.phone}
              initialAddress={salon.address}
              initialTimezone={salon.timezone}
              onBack={() => setActiveStep(2)}
            />
          )}
        </Card>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Standort, Öffnungszeiten, Team und die übrigen Einrichtungsschritte folgen in Kürze.
        </p>
      </div>
    </div>
  );
}
