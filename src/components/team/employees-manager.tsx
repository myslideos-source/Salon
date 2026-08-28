"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { initials } from "@/lib/utils";
import {
  createEmployeeSelfAction,
  updateEmployeeSelfAction,
  deleteEmployeeSelfAction,
  type ActionState,
} from "@/lib/actions/team-resources";

const PALETTE = ["#B08968", "#7C8B6E", "#8C6D9E", "#4F6F8F", "#B8873F", "#5C554C"];

export type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  color: string;
  active: boolean;
  location_id: string | null;
};

export function EmployeesManager({
  salonId,
  employees,
  locations,
  canManage,
}: {
  salonId: string;
  employees: Employee[];
  locations: { id: string; name: string }[];
  canManage: boolean;
}) {
  const [modalEmployee, setModalEmployee] = useState<Employee | "new" | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-lg text-ink">Mitarbeiter</h2>
        {canManage && (
          <Button size="sm" variant="outline" onClick={() => setModalEmployee("new")}>
            <Plus className="h-4 w-4" /> Mitarbeiter
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {employees.map((e) => (
          <Card key={e.id} className="flex items-center gap-3 p-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: e.color }}
            >
              {initials(e.first_name, e.last_name || "")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">
                {e.first_name} {e.last_name}
              </p>
              <Badge tone={e.active ? "success" : "neutral"} dot>
                {e.active ? "Aktiv" : "Inaktiv"}
              </Badge>
            </div>
            {canManage && (
              <button
                onClick={() => setModalEmployee(e)}
                className="shrink-0 rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink"
                aria-label="Bearbeiten"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </Card>
        ))}
        {employees.length === 0 && (
          <Card className="p-8 text-center text-sm text-ink-soft sm:col-span-2 xl:col-span-3">
            Noch keine Mitarbeiter angelegt.
          </Card>
        )}
      </div>

      <Modal
        open={modalEmployee !== null}
        onClose={() => setModalEmployee(null)}
        title={modalEmployee === "new" ? "Mitarbeiter anlegen" : "Mitarbeiter bearbeiten"}
        width="sm"
      >
        {modalEmployee && (
          <EmployeeForm
            salonId={salonId}
            employee={modalEmployee === "new" ? null : modalEmployee}
            locations={locations}
            onDone={() => setModalEmployee(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function EmployeeForm({
  salonId,
  employee,
  locations,
  onDone,
}: {
  salonId: string;
  employee: Employee | null;
  locations: { id: string; name: string }[];
  onDone: () => void;
}) {
  const action = employee ? updateEmployeeSelfAction.bind(null, salonId, employee.id) : createEmployeeSelfAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result?.ok) onDone();
    return result;
  }, null);
  const [, startTransition] = useTransition();

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="first_name">Vorname</Label>
          <Input id="first_name" name="first_name" required defaultValue={employee?.first_name} placeholder="Anna" />
        </div>
        <div>
          <Label htmlFor="last_name">Nachname</Label>
          <Input id="last_name" name="last_name" defaultValue={employee?.last_name} placeholder="Keller" />
        </div>
      </div>
      {locations.length > 0 && (
        <div>
          <Label htmlFor="location_id">Standort</Label>
          <Select id="location_id" name="location_id" defaultValue={employee?.location_id ?? ""}>
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
        <Label>Kalenderfarbe</Label>
        <div className="flex gap-2">
          {PALETTE.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={(employee?.color ?? PALETTE[0]) === c} className="peer sr-only" />
              <span className="block h-7 w-7 rounded-full ring-offset-2 peer-checked:ring-2 ring-ink" style={{ backgroundColor: c }} />
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="active" defaultChecked={employee?.active ?? true} className="rounded border-border-strong" />
        Aktiv
      </label>
      <FieldError>{state?.error}</FieldError>
      <div className="flex items-center justify-between gap-3 pt-2">
        {employee && (
          <button
            type="button"
            onClick={() => {
              if (!confirm(`${employee.first_name} ${employee.last_name} wirklich löschen?`)) return;
              startTransition(async () => {
                await deleteEmployeeSelfAction(salonId, employee.id);
                onDone();
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"
          >
            <Trash2 className="h-4 w-4" /> Löschen
          </button>
        )}
        <Button type="submit" variant="bronze" className="ml-auto" disabled={pending}>
          {pending ? "Wird gespeichert…" : employee ? "Speichern" : "Anlegen"}
        </Button>
      </div>
    </form>
  );
}
