"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { OnboardingProgressBar } from "@/components/onboarding/progress-bar";
import { CompanyStep } from "@/components/onboarding/company-step";
import { IndustryStep } from "@/components/onboarding/industry-step";
import { DetailsStep } from "@/components/onboarding/details-step";
import { LocationStep } from "@/components/onboarding/location-step";
import { HoursStep } from "@/components/onboarding/hours-step";
import { TeamStep } from "@/components/onboarding/team-step";
import { ServicesStep } from "@/components/onboarding/services-step";
import { CalendarTestStep } from "@/components/onboarding/calendar-test-step";
import { LAST_INTERACTIVE_STEP } from "@/lib/onboarding/steps";
import type { OnboardingDraft } from "@/lib/validation/onboarding";
import type { Tables } from "@/lib/supabase/database.types";
import type { Location } from "@/components/locations/locations-manager";
import type { Employee } from "@/components/team/employees-manager";
import type { Resource } from "@/components/team/resources-manager";
import type { Service } from "@/components/services/services-manager";

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
  locations: Location[];
  businessHours: { weekday: number; is_closed: boolean; start_time: string | null; end_time: string | null }[];
  employees: Employee[];
  resources: Resource[];
  services: Service[];
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
              onSaved={() => advance(4)}
              onBack={() => setActiveStep(2)}
            />
          )}
          {activeStep === 4 && salon && (
            <LocationStep salonId={salon.id} locations={salon.locations} onSaved={() => advance(5)} onBack={() => setActiveStep(3)} />
          )}
          {activeStep === 5 && salon && (
            <HoursStep
              salonId={salon.id}
              businessHours={salon.businessHours}
              onSaved={() => advance(6)}
              onBack={() => setActiveStep(4)}
            />
          )}
          {activeStep === 6 && salon && (
            <TeamStep
              salonId={salon.id}
              employees={salon.employees}
              resources={salon.resources}
              locations={salon.locations}
              onSaved={() => advance(7)}
              onBack={() => setActiveStep(5)}
            />
          )}
          {activeStep === 7 && salon && (
            <ServicesStep
              salonId={salon.id}
              services={salon.services}
              employees={salon.employees.map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}`.trim() }))}
              resources={salon.resources.map((r) => ({ id: r.id, name: r.name }))}
              locations={salon.locations}
              draft={salon.draft}
              onBack={() => setActiveStep(6)}
              onSaved={() => advance(10)}
            />
          )}
          {activeStep === 10 && salon && (
            <CalendarTestStep
              salonId={salon.id}
              timezone={salon.timezone}
              employees={salon.employees}
              services={salon.services}
              onBack={() => setActiveStep(7)}
            />
          )}
        </Card>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Die Konfiguration von Mia und die Telefonanbindung folgen in Kürze.
        </p>
      </div>
    </div>
  );
}
