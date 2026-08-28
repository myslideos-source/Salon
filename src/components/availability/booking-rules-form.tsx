"use client";

import { useActionState } from "react";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateBookingRulesAction, type ActionState } from "@/lib/actions/availability-settings";

export type BookingRules = {
  slot_granularity_minutes: number;
  earliest_booking_lead_minutes: number;
  max_advance_booking_days: number;
  max_parallel_appointments: number | null;
  max_appointments_per_day: number | null;
};

export function BookingRulesForm({ rules, canManage }: { rules: BookingRules; canManage: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateBookingRulesAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="slot_granularity_minutes">Buchungsintervall</Label>
          <Select id="slot_granularity_minutes" name="slot_granularity_minutes" defaultValue={rules.slot_granularity_minutes} disabled={!canManage}>
            <option value={5}>5 Minuten</option>
            <option value={10}>10 Minuten</option>
            <option value={15}>15 Minuten</option>
            <option value={30}>30 Minuten</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="earliest_booking_lead_minutes">Mindestvorlaufzeit (Minuten)</Label>
          <Input
            id="earliest_booking_lead_minutes"
            name="earliest_booking_lead_minutes"
            type="number"
            min={0}
            defaultValue={rules.earliest_booking_lead_minutes}
            disabled={!canManage}
          />
        </div>
        <div>
          <Label htmlFor="max_advance_booking_days">Maximaler Buchungszeitraum (Tage)</Label>
          <Input
            id="max_advance_booking_days"
            name="max_advance_booking_days"
            type="number"
            min={1}
            defaultValue={rules.max_advance_booking_days}
            disabled={!canManage}
          />
        </div>
        <div>
          <Label htmlFor="max_appointments_per_day">Maximale Termine pro Tag und Mitarbeiter</Label>
          <Input
            id="max_appointments_per_day"
            name="max_appointments_per_day"
            type="number"
            min={1}
            defaultValue={rules.max_appointments_per_day ?? ""}
            placeholder="Unbegrenzt"
            disabled={!canManage}
          />
        </div>
        <div>
          <Label htmlFor="max_parallel_appointments">Parallele Termine im Unternehmen</Label>
          <Input
            id="max_parallel_appointments"
            name="max_parallel_appointments"
            type="number"
            min={1}
            defaultValue={rules.max_parallel_appointments ?? ""}
            placeholder="Unbegrenzt"
            disabled={!canManage}
          />
          <p className="mt-1 text-xs text-ink-faint">
            Wie viele Termine zur gleichen Zeit insgesamt stattfinden dürfen — unabhängig vom Mitarbeiter. Leer lassen für unbegrenzt.
          </p>
        </div>
      </div>
      <FieldError>{state?.error}</FieldError>
      {canManage && (
        <div className="flex items-center gap-3">
          <Button type="submit" variant="bronze" disabled={pending}>
            {pending ? "Wird gespeichert…" : "Speichern"}
          </Button>
          {state?.ok && <span className="text-sm text-success">Gespeichert.</span>}
        </div>
      )}
    </form>
  );
}
