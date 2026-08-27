"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Trash2, Pencil, Camera, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, FieldError } from "@/components/ui/field";
import { initials } from "@/lib/utils";
import { updateEmployeeAction, deleteEmployeeAction, type ActionState } from "@/lib/actions/admin";
import { uploadEmployeeAvatarAction, removeEmployeeAvatarAction } from "@/lib/actions/employee-avatar";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  color: string;
  active: boolean;
  avatar_url?: string | null;
};

function EmployeeAvatar({
  salonId,
  employee,
  editable,
}: {
  salonId: string;
  employee: Employee;
  editable?: boolean;
}) {
  const [avatarUrl, setAvatarUrl] = useState(employee.avatar_url ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("file", file);
      const result = await uploadEmployeeAvatarAction(salonId, employee.id, fd);
      if (result.ok) setAvatarUrl(result.url);
      else setError(result.error);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      await removeEmployeeAvatarAction(salonId, employee.id);
      setAvatarUrl(null);
    });
  }

  return (
    <div className="relative shrink-0">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded Supabase Storage URL, not a local/known asset
        <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: employee.color }}
        >
          {initials(employee.first_name, employee.last_name || "")}
        </div>
      )}
      {editable && (
        <>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          <button
            type="button"
            onClick={pickFile}
            disabled={pending}
            title="Foto hochladen"
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white shadow-sm hover:bg-ink/80 disabled:opacity-50"
          >
            <Camera className="h-3 w-3" />
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              title="Foto entfernen"
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white shadow-sm hover:bg-danger/80 disabled:opacity-50"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
          {error && <p className="absolute top-11 left-0 w-32 text-[10px] text-danger">{error}</p>}
        </>
      )}
    </div>
  );
}

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
          <EmployeeAvatar salonId={salonId} employee={employee} editable />
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
        <EmployeeAvatar salonId={salonId} employee={employee} />
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
