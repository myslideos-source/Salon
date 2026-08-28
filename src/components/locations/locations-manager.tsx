"use client";

import { useActionState, useState, useTransition } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import {
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
  setDefaultLocationAction,
  type ActionState,
} from "@/lib/actions/locations";

export type Location = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  timezone: string | null;
  active: boolean;
  is_default: boolean;
};

export function LocationsManager({ salonId, locations, canManage }: { salonId: string; locations: Location[]; canManage: boolean }) {
  const [modalLocation, setModalLocation] = useState<Location | "new" | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-lg text-ink">Standorte</h2>
        {canManage && (
          <Button size="sm" variant="outline" onClick={() => setModalLocation("new")}>
            <Plus className="h-4 w-4" /> Standort
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {locations.map((l) => (
          <Card key={l.id} className="flex items-start gap-3 p-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bronze-soft text-bronze-dark">
              <MapPin className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-medium text-ink">{l.name}</p>
                {l.is_default && <Badge tone="bronze">Standard</Badge>}
              </div>
              {l.address && <p className="mt-0.5 truncate text-xs text-ink-soft">{l.address}</p>}
              <Badge tone={l.active ? "success" : "neutral"} dot className="mt-1.5">
                {l.active ? "Aktiv" : "Inaktiv"}
              </Badge>
            </div>
            {canManage && (
              <div className="flex shrink-0 items-center gap-1">
                {!l.is_default && (
                  <button
                    onClick={() => startTransition(() => setDefaultLocationAction(salonId, l.id))}
                    className="rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink"
                    aria-label="Als Standard festlegen"
                    title="Als Standard festlegen"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setModalLocation(l)}
                  className="rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink"
                  aria-label="Bearbeiten"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
          </Card>
        ))}
        {locations.length === 0 && <Card className="p-8 text-center text-sm text-ink-soft sm:col-span-2">Noch kein Standort angelegt.</Card>}
      </div>

      <Modal open={modalLocation !== null} onClose={() => setModalLocation(null)} title={modalLocation === "new" ? "Standort anlegen" : "Standort bearbeiten"} width="sm">
        {modalLocation && (
          <LocationForm salonId={salonId} location={modalLocation === "new" ? null : modalLocation} onDone={() => setModalLocation(null)} />
        )}
      </Modal>
    </div>
  );
}

function LocationForm({ salonId, location, onDone }: { salonId: string; location: Location | null; onDone: () => void }) {
  const action = location ? updateLocationAction.bind(null, salonId, location.id) : createLocationAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result?.ok) onDone();
    return result;
  }, null);
  const [, startTransition] = useTransition();

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="l_name">Name</Label>
        <Input id="l_name" name="name" required defaultValue={location?.name} placeholder="Filiale Mitte" />
      </div>
      <div>
        <Label htmlFor="l_address">Adresse</Label>
        <Textarea id="l_address" name="address" rows={2} defaultValue={location?.address ?? ""} placeholder="Musterstraße 1, 10115 Berlin" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="l_phone">Telefon</Label>
          <Input id="l_phone" name="phone" defaultValue={location?.phone ?? ""} placeholder="+49 30 1234567" />
        </div>
        <div>
          <Label htmlFor="l_timezone">Zeitzone</Label>
          <Input id="l_timezone" name="timezone" defaultValue={location?.timezone ?? "Europe/Berlin"} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="active" defaultChecked={location?.active ?? true} className="rounded border-border-strong" />
        Aktiv
      </label>
      <FieldError>{state?.error}</FieldError>
      <div className="flex items-center justify-between gap-3 pt-2">
        {location && !location.is_default && (
          <button
            type="button"
            onClick={() => {
              if (!confirm(`${location.name} wirklich löschen?`)) return;
              startTransition(async () => {
                await deleteLocationAction(salonId, location.id);
                onDone();
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"
          >
            <Trash2 className="h-4 w-4" /> Löschen
          </button>
        )}
        <Button type="submit" variant="bronze" className="ml-auto" disabled={pending}>
          {pending ? "Wird gespeichert…" : location ? "Speichern" : "Anlegen"}
        </Button>
      </div>
    </form>
  );
}
