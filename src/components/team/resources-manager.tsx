"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import {
  createResourceAction,
  updateResourceAction,
  deleteResourceAction,
  type ActionState,
} from "@/lib/actions/team-resources";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABEL } from "@/lib/validation/team-resources";

const PALETTE = ["#8A7159", "#7C8B6E", "#8C6D9E", "#4F6F8F", "#B8873F", "#5C554C"];

export type Resource = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  color: string;
  active: boolean;
  location_id: string | null;
};

export function ResourcesManager({
  salonId,
  resources,
  locations,
  canManage,
}: {
  salonId: string;
  resources: Resource[];
  locations: { id: string; name: string }[];
  canManage: boolean;
}) {
  const [modalResource, setModalResource] = useState<Resource | "new" | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-lg text-ink">Ressourcen</h2>
        {canManage && (
          <Button size="sm" variant="outline" onClick={() => setModalResource("new")}>
            <Plus className="h-4 w-4" /> Ressource
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {resources.map((r) => (
          <Card key={r.id} className="flex items-center gap-3 p-4">
            <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{r.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Badge tone="neutral">{RESOURCE_TYPE_LABEL[r.type as keyof typeof RESOURCE_TYPE_LABEL] ?? r.type}</Badge>
                <Badge tone={r.active ? "success" : "neutral"} dot>
                  {r.active ? "Aktiv" : "Gesperrt"}
                </Badge>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => setModalResource(r)}
                className="shrink-0 rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink"
                aria-label="Bearbeiten"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </Card>
        ))}
        {resources.length === 0 && (
          <Card className="p-8 text-center text-sm text-ink-soft sm:col-span-2 xl:col-span-3">
            Noch keine Räume, Fahrzeuge, Geräte oder andere Ressourcen angelegt.
          </Card>
        )}
      </div>

      <Modal
        open={modalResource !== null}
        onClose={() => setModalResource(null)}
        title={modalResource === "new" ? "Ressource anlegen" : "Ressource bearbeiten"}
        width="sm"
      >
        {modalResource && (
          <ResourceForm
            salonId={salonId}
            resource={modalResource === "new" ? null : modalResource}
            locations={locations}
            onDone={() => setModalResource(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function ResourceForm({
  salonId,
  resource,
  locations,
  onDone,
}: {
  salonId: string;
  resource: Resource | null;
  locations: { id: string; name: string }[];
  onDone: () => void;
}) {
  const action = resource ? updateResourceAction.bind(null, salonId, resource.id) : createResourceAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result?.ok) onDone();
    return result;
  }, null);
  const [, startTransition] = useTransition();

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="r_name">Name</Label>
        <Input id="r_name" name="name" required defaultValue={resource?.name} placeholder="Behandlungsraum 1" />
      </div>
      <div>
        <Label htmlFor="r_type">Typ</Label>
        <Select id="r_type" name="type" defaultValue={resource?.type ?? "room"}>
          {RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {RESOURCE_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </div>
      {locations.length > 0 && (
        <div>
          <Label htmlFor="r_location">Standort</Label>
          <Select id="r_location" name="location_id" defaultValue={resource?.location_id ?? ""}>
            <option value="">Ohne festen Standort</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="r_description">Beschreibung</Label>
        <Textarea id="r_description" name="description" rows={2} defaultValue={resource?.description ?? ""} />
      </div>
      <div>
        <Label>Kalenderfarbe</Label>
        <div className="flex gap-2">
          {PALETTE.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={(resource?.color ?? PALETTE[0]) === c} className="peer sr-only" />
              <span className="block h-7 w-7 rounded-full ring-offset-2 peer-checked:ring-2 ring-ink" style={{ backgroundColor: c }} />
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="active" defaultChecked={resource?.active ?? true} className="rounded border-border-strong" />
        Aktiv (nur aktive Ressourcen gelten als verfügbar)
      </label>
      <FieldError>{state?.error}</FieldError>
      <div className="flex items-center justify-between gap-3 pt-2">
        {resource && (
          <button
            type="button"
            onClick={() => {
              if (!confirm(`${resource.name} wirklich löschen?`)) return;
              startTransition(async () => {
                await deleteResourceAction(salonId, resource.id);
                onDone();
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"
          >
            <Trash2 className="h-4 w-4" /> Löschen
          </button>
        )}
        <Button type="submit" variant="bronze" className="ml-auto" disabled={pending}>
          {pending ? "Wird gespeichert…" : resource ? "Speichern" : "Anlegen"}
        </Button>
      </div>
    </form>
  );
}
