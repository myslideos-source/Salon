"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Input, Select, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  addResourceWorkingHourAction,
  deleteResourceWorkingHourAction,
  type ActionState,
} from "@/lib/actions/team-resources";

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

type Resource = { id: string; name: string; color: string };
type WorkingHour = { id: string; resource_id: string; weekday: number; start_time: string; end_time: string };

export function ResourceWorkingHoursBoard({
  salonId,
  resources,
  workingHours,
  canManage,
}: {
  salonId: string;
  resources: Resource[];
  workingHours: WorkingHour[];
  canManage: boolean;
}) {
  const action = addResourceWorkingHourAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  if (resources.length === 0) {
    return <p className="text-sm text-ink-soft">Zuerst Ressourcen anlegen.</p>;
  }

  return (
    <div className="space-y-6">
      {resources.map((res) => {
        const blocks = workingHours.filter((w) => w.resource_id === res.id);
        return (
          <div key={res.id}>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: res.color }} />
              <p className="text-sm font-medium text-ink">{res.name}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {WEEKDAYS.map((label, weekday) => {
                const dayBlocks = blocks.filter((b) => b.weekday === weekday);
                return (
                  <div key={weekday} className="rounded-lg border border-border px-3 py-2">
                    <p className="mb-1 text-xs font-medium text-ink-faint">{label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dayBlocks.length === 0 && <span className="text-xs text-ink-faint">nicht verfügbar</span>}
                      {dayBlocks.map((b) => (
                        <span key={b.id} className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-1 text-xs text-ink-soft">
                          {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                          {canManage && (
                            <button onClick={() => deleteResourceWorkingHourAction(salonId, b.id)} aria-label="Entfernen">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
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

      {canManage && (
        <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border-strong p-4">
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Ressource</label>
            <Select name="resource_id" defaultValue={resources[0]?.id} className="w-40">
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
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
      )}
    </div>
  );
}
