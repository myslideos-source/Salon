"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Input, Select, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { addWorkingHourAction, deleteWorkingHourAction, type ActionState } from "@/lib/actions/admin";

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

type Employee = { id: string; first_name: string; last_name: string; color: string };
type WorkingHour = { id: string; employee_id: string; weekday: number; start_time: string; end_time: string };

export function WorkingHoursBoard({
  salonId,
  employees,
  workingHours,
}: {
  salonId: string;
  employees: Employee[];
  workingHours: WorkingHour[];
}) {
  const action = addWorkingHourAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  if (employees.length === 0) {
    return <p className="text-sm text-ink-soft">Zuerst Mitarbeiter anlegen.</p>;
  }

  return (
    <div className="space-y-6">
      {employees.map((emp) => {
        const blocks = workingHours.filter((w) => w.employee_id === emp.id);
        return (
          <div key={emp.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: emp.color }} />
              <p className="text-sm font-medium text-ink">
                {emp.first_name} {emp.last_name}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WEEKDAYS.map((label, weekday) => {
                const dayBlocks = blocks.filter((b) => b.weekday === weekday);
                return (
                  <div key={weekday} className="rounded-lg border border-border px-3 py-2">
                    <p className="text-xs font-medium text-ink-faint mb-1">{label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dayBlocks.length === 0 && <span className="text-xs text-ink-faint">frei</span>}
                      {dayBlocks.map((b) => (
                        <span
                          key={b.id}
                          className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-1 text-xs text-ink-soft"
                        >
                          {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                          <button onClick={() => deleteWorkingHourAction(salonId, b.id)}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-border-strong border-dashed p-4">
        <div>
          <label className="mb-1 block text-xs text-ink-faint">Mitarbeiter</label>
          <Select name="employee_id" defaultValue={employees[0]?.id} className="w-40">
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.first_name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-faint">Wochentag</label>
          <Select name="weekday" defaultValue="1" className="w-32">
            {WEEKDAYS.map((label, i) => (
              <option key={i} value={i}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-faint">Von</label>
          <Input type="time" name="start_time" defaultValue="09:00" className="w-28" required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-faint">Bis</label>
          <Input type="time" name="end_time" defaultValue="18:00" className="w-28" required />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          Zeitblock hinzufügen
        </Button>
        <FieldError>{state?.error}</FieldError>
      </form>
    </div>
  );
}
