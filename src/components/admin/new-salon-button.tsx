"use client";

import { useState, useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { createSalonAction, type ActionState } from "@/lib/actions/admin";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function NewSalonButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createSalonAction, null);

  const slug = slugOverride ?? slugify(name);

  return (
    <>
      <Button variant="bronze" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Neuer Salon
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Neuer Salon" subtitle="Legt einen neuen Salon inkl. Standardwerten an.">
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Salonname</Label>
            <Input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Hair Lounge Milano" />
          </div>
          <div>
            <Label htmlFor="slug">Slug (URL-Kennung)</Label>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => setSlugOverride(e.target.value)}
              placeholder="hair-lounge-milano"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" placeholder="+49 30 1234567" />
            </div>
            <div>
              <Label htmlFor="timezone">Zeitzone</Label>
              <Input id="timezone" name="timezone" defaultValue="Europe/Berlin" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" placeholder="Musterstraße 1, 10115 Berlin" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="slot_granularity_minutes">Slot-Raster</Label>
              <Select id="slot_granularity_minutes" name="slot_granularity_minutes" defaultValue="15">
                <option value="5">5 Min.</option>
                <option value="10">10 Min.</option>
                <option value="15">15 Min.</option>
                <option value="30">30 Min.</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="earliest_booking_lead_minutes">Vorlauf (Min.)</Label>
              <Input id="earliest_booking_lead_minutes" name="earliest_booking_lead_minutes" type="number" min={0} defaultValue={60} />
            </div>
            <div>
              <Label htmlFor="max_advance_booking_days">Vorausbuchung (Tage)</Label>
              <Input id="max_advance_booking_days" name="max_advance_booking_days" type="number" min={1} defaultValue={60} />
            </div>
          </div>
          <FieldError>{state?.error}</FieldError>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" variant="bronze" disabled={pending}>
              {pending ? "Wird angelegt…" : "Salon anlegen"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
