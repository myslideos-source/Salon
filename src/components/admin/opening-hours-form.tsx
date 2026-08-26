"use client";

import { useState } from "react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateBusinessHoursAction } from "@/lib/actions/admin";

type Row = {
  weekday: number;
  label: string;
  is_closed?: boolean;
  start_time?: string | null;
  end_time?: string | null;
};

export function OpeningHoursForm({ salonId, rows }: { salonId: string; rows: Row[] }) {
  const [closed, setClosed] = useState<Record<number, boolean>>(
    Object.fromEntries(rows.map((r) => [r.weekday, r.is_closed ?? false]))
  );
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (fd) => {
        await updateBusinessHoursAction(salonId, fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-3"
    >
      {rows.map((row) => (
        <div key={row.weekday} className="flex items-center gap-3">
          <span className="w-24 text-sm text-ink-soft">{row.label}</span>
          <label className="flex items-center gap-1.5 text-xs text-ink-faint">
            <input
              type="checkbox"
              name={`closed_${row.weekday}`}
              defaultChecked={row.is_closed ?? false}
              onChange={(e) => setClosed((c) => ({ ...c, [row.weekday]: e.target.checked }))}
              className="rounded border-border-strong"
            />
            geschlossen
          </label>
          <Input
            type="time"
            name={`start_${row.weekday}`}
            defaultValue={row.start_time?.slice(0, 5) ?? "09:00"}
            disabled={closed[row.weekday]}
            className="w-32"
          />
          <span className="text-ink-faint">–</span>
          <Input
            type="time"
            name={`end_${row.weekday}`}
            defaultValue={row.end_time?.slice(0, 5) ?? "18:00"}
            disabled={closed[row.weekday]}
            className="w-32"
          />
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="bronze">
          Speichern
        </Button>
        {saved && <span className="text-sm text-success">Gespeichert.</span>}
      </div>
    </form>
  );
}
