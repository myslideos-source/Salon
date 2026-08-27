"use client";

import { useActionState } from "react";
import { useState } from "react";
import { Input, Label, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createServiceAction, type ActionState } from "@/lib/actions/admin";

const PALETTE = ["#8A7159", "#4F7D5C", "#B8873F", "#4F6F8F", "#B1533F", "#7C8B6E"];

export function ServiceForm({ salonId, showPrice = true }: { salonId: string; showPrice?: boolean }) {
  const action = createServiceAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const [priceEuro, setPriceEuro] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Damen Schnitt" />
      </div>
      <div>
        <Label htmlFor="category">Kategorie</Label>
        <Input id="category" name="category" placeholder="Schneiden" />
      </div>
      <div className={showPrice ? "grid grid-cols-2 gap-3" : ""}>
        <div>
          <Label htmlFor="duration_minutes">Dauer (Min.)</Label>
          <Input id="duration_minutes" name="duration_minutes" type="number" min={5} step={5} required defaultValue={60} />
        </div>
        {showPrice ? (
          <div>
            <Label htmlFor="price_euro">Preis (€)</Label>
            <Input
              id="price_euro"
              type="number"
              min={0}
              step="0.5"
              required
              value={priceEuro}
              onChange={(e) => setPriceEuro(e.target.value)}
              placeholder="59"
            />
            <input type="hidden" name="price_cents" value={Math.round(Number(priceEuro || 0) * 100)} />
          </div>
        ) : (
          <input type="hidden" name="price_cents" value={0} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="buffer_before_minutes">Puffer davor (Min.)</Label>
          <Input id="buffer_before_minutes" name="buffer_before_minutes" type="number" min={0} defaultValue={0} />
        </div>
        <div>
          <Label htmlFor="buffer_after_minutes">Puffer danach (Min.)</Label>
          <Input id="buffer_after_minutes" name="buffer_after_minutes" type="number" min={0} defaultValue={0} />
        </div>
      </div>
      <div>
        <Label>Kalenderfarbe</Label>
        <div className="flex gap-2">
          {PALETTE.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={c === PALETTE[0]} className="peer sr-only" />
              <span className="block h-7 w-7 rounded-full ring-offset-2 peer-checked:ring-2 ring-ink" style={{ backgroundColor: c }} />
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
        {pending ? "Wird gespeichert…" : "Leistung anlegen"}
      </Button>
    </form>
  );
}
