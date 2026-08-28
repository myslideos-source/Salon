"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationsManager, type Location } from "@/components/locations/locations-manager";
import { advanceOnboardingStepAction } from "@/lib/actions/onboarding";

export function LocationStep({
  salonId,
  locations,
  onSaved,
  onBack,
}: {
  salonId: string;
  locations: Location[];
  onSaved: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        Dein Standard-Standort wurde bereits angelegt. Passe ihn an oder ergänze weitere Filialen — jeder Mitarbeiter und jede
        Ressource kann später einem Standort zugeordnet werden.
      </p>
      <LocationsManager salonId={salonId} locations={locations} canManage />
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <Button
          type="button"
          variant="bronze"
          onClick={async () => {
            await advanceOnboardingStepAction(salonId, 5);
            onSaved();
          }}
        >
          Weiter <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
