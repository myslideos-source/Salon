"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Input, Select, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  addCallbackWindowAction,
  deleteCallbackWindowAction,
  type ActionState,
} from "@/lib/actions/availability-settings";

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export type CallbackWindow = { id: string; weekday: number; start_time: string; end_time: string };

export function CallbackWindowsManager({ salonId, windows, canManage }: { salonId: string; windows: CallbackWindow[]; canManage: boolean }) {
  const action = addCallbackWindowAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {WEEKDAYS.map((label, weekday) => {
          const dayWindows = windows.filter((w) => w.weekday === weekday);
          return (
            <div key={weekday} className="rounded-lg border border-border px-3 py-2">
              <p className="mb-1 text-xs font-medium text-ink-faint">{label}</p>
              <div className="flex flex-wrap gap-1.5">
                {dayWindows.length === 0 && <span className="text-xs text-ink-faint">kein Rückruf</span>}
                {dayWindows.map((w) => (
                  <span key={w.id} className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-1 text-xs text-ink-soft">
                    {w.start_time.slice(0, 5)}–{w.end_time.slice(0, 5)}
                    {canManage && (
                      <button onClick={() => deleteCallbackWindowAction(salonId, w.id)} aria-label="Entfernen">
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

      {canManage && (
        <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border-strong p-4">
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
            <Input type="time" name="end_time" defaultValue="12:00" className="w-28" required />
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            Zeitraum hinzufügen
          </Button>
          <FieldError>{state?.error}</FieldError>
        </form>
      )}
    </div>
  );
}
