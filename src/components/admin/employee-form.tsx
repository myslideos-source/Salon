"use client";

import { useActionState } from "react";
import { Input, Label, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createEmployeeAction, type ActionState } from "@/lib/actions/admin";

const PALETTE = ["#B08968", "#7C8B6E", "#8C6D9E", "#4F6F8F", "#B8873F", "#5C554C"];

export function EmployeeForm({ salonId }: { salonId: string }) {
  const action = createEmployeeAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="first_name">Vorname</Label>
          <Input id="first_name" name="first_name" required placeholder="Anna" />
        </div>
        <div>
          <Label htmlFor="last_name">Nachname</Label>
          <Input id="last_name" name="last_name" placeholder="Keller" />
        </div>
      </div>
      <div>
        <Label>Kalenderfarbe</Label>
        <div className="flex gap-2">
          {PALETTE.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={c === PALETTE[0]} className="peer sr-only" />
              <span
                className="block h-7 w-7 rounded-full ring-offset-2 peer-checked:ring-2 ring-ink"
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="active" defaultChecked className="rounded border-border-strong" />
        Aktiv
      </label>
      <FieldError>{state?.error}</FieldError>
      <Button type="submit" variant="bronze" className="w-full" disabled={pending}>
        {pending ? "Wird gespeichert…" : "Mitarbeiter anlegen"}
      </Button>
    </form>
  );
}
