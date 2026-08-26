"use client";

import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { removeAbsenceAction } from "@/lib/actions/absences";

const TYPE_LABEL: Record<string, string> = {
  vacation: "Urlaub",
  sick: "Krankheit",
  break: "Pause",
  training: "Fortbildung",
  private: "Privat",
  other: "Sonstiges",
};

type Absence = {
  id: string;
  type: string;
  start_at: string;
  end_at: string;
  note: string | null;
  employees: { first_name: string; last_name: string } | null;
};

export function AbsenceList({
  salonId,
  absences,
  redirectPath,
}: {
  salonId: string;
  absences: Absence[];
  redirectPath: string;
}) {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso)
    );

  if (absences.length === 0) {
    return <Card className="p-8 text-center text-sm text-ink-soft">Keine anstehenden Abwesenheiten.</Card>;
  }

  return (
    <div className="space-y-2">
      {absences.map((a) => (
        <Card key={a.id} className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-ink">
                {a.employees?.first_name} {a.employees?.last_name}
              </p>
              <Badge tone="warning">{TYPE_LABEL[a.type] ?? a.type}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-ink-soft">
              {fmt(a.start_at)} – {fmt(a.end_at)}
              {a.note && <span className="text-ink-faint"> · {a.note}</span>}
            </p>
          </div>
          <button
            onClick={() => removeAbsenceAction(salonId, a.id, redirectPath)}
            className="rounded-lg p-2 text-ink-soft hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </Card>
      ))}
    </div>
  );
}
