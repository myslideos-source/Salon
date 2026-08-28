"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeesManager, type Employee } from "@/components/team/employees-manager";
import { ResourcesManager, type Resource } from "@/components/team/resources-manager";
import { advanceOnboardingStepAction } from "@/lib/actions/onboarding";

export function TeamStep({
  salonId,
  employees,
  resources,
  locations,
  onBack,
}: {
  salonId: string;
  employees: Employee[];
  resources: Resource[];
  locations: { id: string; name: string }[];
  onBack: () => void;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">
        Wer nimmt Termine wahr, und welche Räume, Fahrzeuge oder Geräte werden dafür gebraucht? Beides lässt sich jederzeit unter
        „Team und Ressourcen&quot; erweitern.
      </p>
      <EmployeesManager salonId={salonId} employees={employees} locations={locations} canManage />
      <ResourcesManager salonId={salonId} resources={resources} locations={locations} canManage />
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <Button
          type="button"
          variant="bronze"
          onClick={async () => {
            await advanceOnboardingStepAction(salonId, 7);
            router.push("/app/dashboard?onboarding=in_progress");
          }}
        >
          Fertig für jetzt <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
