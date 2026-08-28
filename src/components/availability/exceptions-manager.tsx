"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { Input, Select, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  addBusinessHourExceptionAction,
  deleteBusinessHourExceptionAction,
  type ActionState,
} from "@/lib/actions/availability-settings";

export type Exception = {
  id: string;
  date: string;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  location_id: string | null;
};

export function ExceptionsManager({
  salonId,
  exceptions,
  locations,
  canManage,
}: {
  salonId: string;
  exceptions: Exception[];
  locations: { id: string; name: string }[];
  canManage: boolean;
}) {
  const fmt = (d: string) => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${d}T00:00:00`));
  const sorted = [...exceptions].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-3">
      {sorted.length === 0 && <Card className="p-6 text-center text-sm text-ink-soft">Keine Feiertage oder Ausnahmen hinterlegt.</Card>}
      {sorted.map((e) => (
        <Card key={e.id} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-ink">{fmt(e.date)}</p>
              <Badge tone={e.is_closed ? "danger" : "warning"}>{e.is_closed ? "Geschlossen" : "Abweichende Zeiten"}</Badge>
              {e.location_id && locations.find((l) => l.id === e.location_id) && (
                <Badge tone="neutral">{locations.find((l) => l.id === e.location_id)!.name}</Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-ink-soft">
              {!e.is_closed && e.start_time && e.end_time && `${e.start_time.slice(0, 5)}–${e.end_time.slice(0, 5)}`}
              {e.note && <span className="text-ink-faint"> · {e.note}</span>}
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => deleteBusinessHourExceptionAction(salonId, e.id)}
              className="shrink-0 rounded-lg p-2 text-ink-soft hover:bg-danger-soft hover:text-danger"
              aria-label="Entfernen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </Card>
      ))}

      {canManage && <ExceptionForm salonId={salonId} locations={locations} />}
    </div>
  );
}

function ExceptionForm({ salonId, locations }: { salonId: string; locations: { id: string; name: string }[] }) {
  const action = addBusinessHourExceptionAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const [isClosed, setIsClosed] = useState(true);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-dashed border-border-strong p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-ink-faint">Datum</label>
          <Input type="date" name="date" required className="w-40" />
        </div>
        {locations.length > 0 && (
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Standort</label>
            <Select name="location_id" className="w-40" defaultValue="">
              <option value="">Alle Standorte</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <label className="flex items-center gap-1.5 pb-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="is_closed"
            defaultChecked
            onChange={(e) => setIsClosed(e.target.checked)}
            className="rounded border-border-strong"
          />
          Geschlossen (Feiertag)
        </label>
      </div>
      {!isClosed && (
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Von</label>
            <Input type="time" name="start_time" defaultValue="09:00" className="w-28" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Bis</label>
            <Input type="time" name="end_time" defaultValue="14:00" className="w-28" />
          </div>
        </div>
      )}
      <Input name="note" placeholder="Notiz (optional), z. B. „Heiligabend, verkürzt“" />
      <FieldError>{state?.error}</FieldError>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Wird gespeichert…" : "Ausnahme hinzufügen"}
      </Button>
    </form>
  );
}
