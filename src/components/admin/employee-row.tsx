"use client";

import { useActionState, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, FieldError } from "@/components/ui/field";
import { initials } from "@/lib/utils";
import { updateEmployeeAction, deleteEmployeeAction, type ActionState } from "@/lib/actions/admin";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  color: string;
  active: boolean;
};

export function EmployeeRow({ salonId, employee }: { salonId: string; employee: Employee }) {
  const [editing, setEditing] = useState(false);
  const action = updateEmployeeAction.bind(null, salonId, employee.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  if (editing) {
    return (
      <Card className="p-4">
        <form
          action={async (fd) => {
            await formAction(fd);
            setEditing(false);
          }}
          className="flex flex-wrap items-center gap-3"
        >
          <Input name="first_name" defaultValue={employee.first_name} className="w-32" required />
          <Input name="last_name" defaultValue={employee.last_name} className="w-32" />
          <input type="hidden" name="color" value={employee.color} />
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            <input type="checkbox" name="active" defaultChecked={employee.active} className="rounded border-border-strong" />
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
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: employee.color }}
        >
          {initials(employee.first_name, employee.last_name || "")}
        </div>
        <div>
          <p className="font-medium text-ink">
            {employee.first_name} {employee.last_name}
          </p>
          <Badge tone={employee.active ? "success" : "neutral"} dot>
            {employee.active ? "Aktiv" : "Inaktiv"}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setEditing(true)} className="rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink">
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            if (confirm(`${employee.first_name} wirklich entfernen?`)) {
              deleteEmployeeAction(salonId, employee.id);
            }
          }}
          className="rounded-lg p-2 text-ink-soft hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
