"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpeningHoursForm } from "@/components/availability/opening-hours-form";
import { advanceOnboardingStepAction } from "@/lib/actions/onboarding";

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

type BusinessHourRow = { weekday: number; is_closed: boolean; start_time: string | null; end_time: string | null };

export function HoursStep({
  salonId,
  businessHours,
  onSaved,
  onBack,
}: {
  salonId: string;
  businessHours: BusinessHourRow[];
  onSaved: () => void;
  onBack: () => void;
}) {
  const rows = WEEKDAYS.map((label, weekday) => {
    const row = businessHours.find((b) => b.weekday === weekday);
    return { weekday, label, is_closed: row?.is_closed, start_time: row?.start_time, end_time: row?.end_time };
  });

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        Wann ist dein Unternehmen erreichbar? Mia bietet Termine nur innerhalb deiner Öffnungszeiten an.
      </p>
      <OpeningHoursForm salonId={salonId} rows={rows} canManage />
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <Button
          type="button"
          variant="bronze"
          onClick={async () => {
            await advanceOnboardingStepAction(salonId, 6);
            onSaved();
          }}
        >
          Weiter <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
