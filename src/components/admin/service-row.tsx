"use client";

import { useActionState, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, FieldError } from "@/components/ui/field";
import { formatDuration, formatPrice } from "@/lib/utils";
import { updateServiceAction, deleteServiceAction, type ActionState } from "@/lib/actions/admin";
import type { Tables } from "@/lib/supabase/database.types";

export function ServiceRow({ salonId, service, showPrice = true }: { salonId: string; service: Tables<"services">; showPrice?: boolean }) {
  const [editing, setEditing] = useState(false);
  const action = updateServiceAction.bind(null, salonId, service.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  if (editing) {
    return (
      <Card className="p-4">
        <form
          action={async (fd) => {
            await formAction(fd);
            setEditing(false);
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Name</label>
            <Input name="name" defaultValue={service.name} className="w-40" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Min.</label>
            <Input name="duration_minutes" type="number" defaultValue={service.duration_minutes} className="w-20" required />
          </div>
          {showPrice ? (
            <div>
              <label className="mb-1 block text-xs text-ink-faint">Preis (ct)</label>
              <Input name="price_cents" type="number" defaultValue={service.price_cents} className="w-24" required />
            </div>
          ) : (
            <input type="hidden" name="price_cents" value={service.price_cents} />
          )}
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Puffer vor</label>
            <Input name="buffer_before_minutes" type="number" defaultValue={service.buffer_before_minutes} className="w-20" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Puffer nach</label>
            <Input name="buffer_after_minutes" type="number" defaultValue={service.buffer_after_minutes} className="w-20" />
          </div>
          <input type="hidden" name="category" value={service.category ?? ""} />
          <input type="hidden" name="color" value={service.color} />
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            <input type="checkbox" name="active" defaultChecked={service.active} className="rounded border-border-strong" />
            Aktiv
          </label>
          <Button type="submit" size="sm" variant="bronze" disabled={pending}>
            Speichern
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Abbrechen
          </Button>
          <FieldError>{state?.error}</FieldError>
        </form>
      </Card>
    );
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: service.color }} />
        <div>
          <p className="font-medium text-ink">
            {service.name} {service.category && <span className="text-xs text-ink-faint">· {service.category}</span>}
          </p>
          <p className="text-xs text-ink-soft">
            {formatDuration(service.duration_minutes)}
            {showPrice && ` · ${formatPrice(service.price_cents)}`}
            {(service.buffer_before_minutes > 0 || service.buffer_after_minutes > 0) &&
              ` · Puffer ${service.buffer_before_minutes}/${service.buffer_after_minutes} Min.`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Badge tone={service.active ? "success" : "neutral"} dot>
          {service.active ? "Aktiv" : "Inaktiv"}
        </Badge>
        <button onClick={() => setEditing(true)} className="rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink">
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            if (confirm(`${service.name} wirklich entfernen?`)) deleteServiceAction(salonId, service.id);
          }}
          className="rounded-lg p-2 text-ink-soft hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
