"use client";

import { useActionState } from "react";
import { Input, Select, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createAbsenceAction } from "@/lib/actions/absences";
import type { ActionState } from "@/lib/actions/admin";

const TYPES: Record<string, string> = {
  vacation: "Urlaub",
  sick: "Krankheit",
  break: "Pause",
  training: "Fortbildung",
  private: "Privat",
  other: "Sonstiges",
};

export function AbsenceForm({
  salonId,
  employees,
  redirectPath,
}: {
  salonId: string;
  employees: { id: string; first_name: string; last_name: string }[];
  redirectPath?: string;
}) {
  const action = createAbsenceAction.bind(null, salonId, redirectPath ?? "/app/absences");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  if (employees.length === 0) return <p className="text-sm text-ink-soft">Keine Mitarbeiter vorhanden.</p>;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">Mitarbeiter</label>
        <Select name="employee_id" defaultValue={employees[0]?.id} required>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.first_name} {e.last_name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">Art</label>
        <Select name="type" defaultValue="vacation">
          {Object.entries(TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">Von</label>
          <Input type="datetime-local" name="start_at" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">Bis</label>
          <Input type="datetime-local" name="end_at" required />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">Notiz</label>
        <Textarea name="note" rows={2} />
      </div>
      <FieldError>{state?.error}</FieldError>
      <Button type="submit" variant="bronze" className="w-full" disabled={pending}>
        {pending ? "Wird gespeichert…" : "Eintragen"}
      </Button>
    </form>
  );
}
