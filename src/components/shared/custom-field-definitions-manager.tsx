"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import {
  createCustomFieldDefinitionAction,
  updateCustomFieldDefinitionAction,
  deleteCustomFieldDefinitionAction,
  type ActionState,
} from "@/lib/actions/custom-fields";
import {
  CUSTOM_FIELD_TYPES,
  CUSTOM_FIELD_TYPE_LABEL,
  type CustomFieldDefinition,
  type CustomFieldEntityType,
  type CustomFieldType,
} from "@/lib/validation/custom-fields";

/** Kompakte Verwaltung individueller Felder — wiederverwendet für Kunden
 * und Anfragen (gleiche Datenstruktur, unterschiedlicher entityType). */
export function CustomFieldDefinitionsManager({
  salonId,
  entityType,
  fields,
  canManage,
  title = "Individuelle Felder",
}: {
  salonId: string;
  entityType: CustomFieldEntityType;
  fields: CustomFieldDefinition[];
  canManage: boolean;
  title?: string;
}) {
  const [modalField, setModalField] = useState<CustomFieldDefinition | "new" | null>(null);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-ink-soft">{title}</p>
        {canManage && (
          <button type="button" onClick={() => setModalField("new")} className="text-xs font-medium text-bronze-dark hover:underline">
            + Feld hinzufügen
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {fields.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-strong bg-sand px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">
                {f.label} {f.required && <span className="text-danger">*</span>}
              </p>
              <p className="text-xs text-ink-faint">{CUSTOM_FIELD_TYPE_LABEL[f.field_type as CustomFieldType] ?? f.field_type}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {!f.active && <Badge tone="neutral">Inaktiv</Badge>}
              {canManage && (
                <button type="button" onClick={() => setModalField(f)} className="rounded-lg p-1.5 text-ink-soft hover:bg-white/60 hover:text-ink" aria-label="Bearbeiten">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {fields.length === 0 && <p className="text-xs italic text-ink-faint">Noch keine individuellen Felder angelegt.</p>}
      </div>

      <Modal open={modalField !== null} onClose={() => setModalField(null)} title={modalField === "new" ? "Feld anlegen" : "Feld bearbeiten"}>
        {modalField && (
          <CustomFieldForm
            salonId={salonId}
            entityType={entityType}
            field={modalField === "new" ? null : modalField}
            onDone={() => setModalField(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function CustomFieldForm({
  salonId,
  entityType,
  field,
  onDone,
}: {
  salonId: string;
  entityType: CustomFieldEntityType;
  field: CustomFieldDefinition | null;
  onDone: () => void;
}) {
  const action = field
    ? updateCustomFieldDefinitionAction.bind(null, salonId, field.id)
    : createCustomFieldDefinitionAction.bind(null, salonId, entityType);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result?.ok) onDone();
    return result;
  }, null);
  const [, startTransition] = useTransition();

  const [fieldType, setFieldType] = useState<CustomFieldType>((field?.field_type as CustomFieldType) ?? "text");
  const [required, setRequired] = useState(field?.required ?? false);
  const [active, setActive] = useState(field?.active ?? true);
  const [options, setOptions] = useState<string[]>(Array.isArray(field?.options) ? (field.options as string[]) : []);
  const [optionDraft, setOptionDraft] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="required" value={String(required)} />
      <input type="hidden" name="active" value={String(active)} />
      <input type="hidden" name="options" value={JSON.stringify(options)} />

      <div>
        <Label htmlFor="cf_label">Bezeichnung</Label>
        <Input id="cf_label" name="label" required defaultValue={field?.label} placeholder="z. B. Kennzeichen" />
      </div>
      <div>
        <Label htmlFor="cf_type">Feldtyp</Label>
        <Select id="cf_type" name="field_type" value={fieldType} onChange={(e) => setFieldType(e.target.value as CustomFieldType)}>
          {CUSTOM_FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {CUSTOM_FIELD_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </div>

      {fieldType === "select" && (
        <div>
          <Label>Optionen</Label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {options.map((o) => (
              <span key={o} className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs text-ink-soft">
                {o}
                <button type="button" onClick={() => setOptions(options.filter((x) => x !== o))} aria-label={`${o} entfernen`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={optionDraft}
              onChange={(e) => setOptionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = optionDraft.trim();
                  if (v && !options.includes(v)) setOptions([...options, v]);
                  setOptionDraft("");
                }
              }}
              placeholder="Option hinzufügen und Enter drücken"
              className="h-9 text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="rounded border-border-strong" />
          Pflichtfeld
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-border-strong" />
          Aktiv
        </label>
      </div>

      <FieldError>{state?.error}</FieldError>
      <div className="flex items-center justify-between gap-3 pt-2">
        {field && (
          <button
            type="button"
            onClick={() => {
              if (!confirm(`„${field.label}" wirklich löschen?`)) return;
              startTransition(async () => {
                await deleteCustomFieldDefinitionAction(salonId, field.id);
                onDone();
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"
          >
            <Trash2 className="h-4 w-4" /> Löschen
          </button>
        )}
        <Button type="submit" variant="bronze" className="ml-auto" disabled={pending}>
          {pending ? "Wird gespeichert…" : field ? "Speichern" : "Anlegen"}
        </Button>
      </div>
    </form>
  );
}
