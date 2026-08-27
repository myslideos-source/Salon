"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createLeadAction, type ActionState } from "@/lib/actions/leads";

export function NewLeadModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createLeadAction, null);

  return (
    <>
      <Button variant="gradient" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Neuer Lead
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Neuer Lead">
        <form
          action={async (fd) => {
            await formAction(fd);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">Salonname</Label>
            <Input id="name" name="name" required placeholder="Hair Lounge Milano" />
          </div>
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" placeholder="Musterstraße 1, 12345 Musterstadt" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" placeholder="+49 30 1234567" />
            </div>
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" placeholder="info@salon.de" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" placeholder="salon.de" />
            </div>
            <div>
              <Label htmlFor="distance_km">Entfernung (km)</Label>
              <Input id="distance_km" name="distance_km" type="number" min="0" step="1" placeholder="12" />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Erster Eindruck, wann angerufen, wer Ansprechpartner ist…" />
          </div>
          <FieldError>{state?.error}</FieldError>
          <Button type="submit" variant="gradient" className="w-full" disabled={pending}>
            {pending ? "Wird gespeichert…" : "Lead anlegen"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
