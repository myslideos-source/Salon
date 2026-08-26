"use client";

import { useActionState } from "react";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateSalonAction, setSalonStatusAction, type ActionState } from "@/lib/actions/admin";
import type { Tables } from "@/lib/supabase/database.types";

export function SalonSettingsForm({ salon }: { salon: Tables<"salons"> }) {
  const action = updateSalonAction.bind(null, salon.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Salonname</Label>
          <Input id="name" name="name" defaultValue={salon.name} required />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={salon.slug} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" defaultValue={salon.phone ?? ""} />
          </div>
          <div>
            <Label htmlFor="timezone">Zeitzone</Label>
            <Input id="timezone" name="timezone" defaultValue={salon.timezone} />
          </div>
        </div>
        <div>
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" name="address" defaultValue={salon.address ?? ""} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="slot_granularity_minutes">Slot-Raster</Label>
            <Select id="slot_granularity_minutes" name="slot_granularity_minutes" defaultValue={String(salon.slot_granularity_minutes)}>
              <option value="5">5 Min.</option>
              <option value="10">10 Min.</option>
              <option value="15">15 Min.</option>
              <option value="30">30 Min.</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="earliest_booking_lead_minutes">Vorlauf (Min.)</Label>
            <Input id="earliest_booking_lead_minutes" name="earliest_booking_lead_minutes" type="number" min={0} defaultValue={salon.earliest_booking_lead_minutes} />
          </div>
          <div>
            <Label htmlFor="max_advance_booking_days">Vorausbuchung (Tage)</Label>
            <Input id="max_advance_booking_days" name="max_advance_booking_days" type="number" min={1} defaultValue={salon.max_advance_booking_days} />
          </div>
        </div>
        <FieldError>{state?.error}</FieldError>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="bronze" disabled={pending}>
            {pending ? "Wird gespeichert…" : "Speichern"}
          </Button>
          {state?.ok && <span className="text-sm text-success">Gespeichert.</span>}
        </div>
      </form>

      <div className="border-t border-border pt-5">
        <p className="text-sm font-medium text-ink-soft mb-2">Salon-Status</p>
        <div className="flex gap-2">
          {(["active", "trial", "paused"] as const).map((status) => (
            <Button
              key={status}
              type="button"
              variant={salon.status === status ? "bronze" : "outline"}
              size="sm"
              onClick={() => setSalonStatusAction(salon.id, status)}
            >
              {status === "active" ? "Aktiv" : status === "trial" ? "Testphase" : "Pausiert"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
