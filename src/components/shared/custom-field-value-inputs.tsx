"use client";

import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { CustomFieldDefinition, CustomFieldType } from "@/lib/validation/custom-fields";

export type CustomFieldValues = Record<string, string | number | boolean | null>;

/** Rendert Eingabefelder für die aktiven individuellen Felder einer Entität
 * (Kunde, Anfrage, …) und hält die Werte im übergebenen State — der
 * aufrufende Formular-Container serialisiert `values` selbst in ein
 * verstecktes `custom_fields`-Feld. */
export function CustomFieldValueInputs({
  fields,
  values,
  onChange,
}: {
  fields: CustomFieldDefinition[];
  values: CustomFieldValues;
  onChange: (next: CustomFieldValues) => void;
}) {
  const active = fields.filter((f) => f.active);
  if (active.length === 0) return null;

  function set(key: string, value: string | number | boolean | null) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink-soft">Individuelle Felder</p>
      {active.map((f) => {
        const type = f.field_type as CustomFieldType;
        const value = values[f.key];
        if (type === "boolean") {
          return (
            <label key={f.id} className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => set(f.key, e.target.checked)}
                className="rounded border-border-strong"
              />
              {f.label} {f.required && <span className="text-danger">*</span>}
            </label>
          );
        }
        if (type === "select") {
          const options = Array.isArray(f.options) ? (f.options as string[]) : [];
          return (
            <div key={f.id}>
              <Label>
                {f.label} {f.required && <span className="text-danger">*</span>}
              </Label>
              <Select value={typeof value === "string" ? value : ""} onChange={(e) => set(f.key, e.target.value)}>
                <option value="">Bitte wählen</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </div>
          );
        }
        if (type === "textarea") {
          return (
            <div key={f.id}>
              <Label>
                {f.label} {f.required && <span className="text-danger">*</span>}
              </Label>
              <Textarea rows={2} value={typeof value === "string" ? value : ""} onChange={(e) => set(f.key, e.target.value)} />
            </div>
          );
        }
        return (
          <div key={f.id}>
            <Label>
              {f.label} {f.required && <span className="text-danger">*</span>}
            </Label>
            <Input
              type={type === "number" ? "number" : type === "date" ? "date" : "text"}
              value={value === null || value === undefined ? "" : String(value)}
              onChange={(e) => set(f.key, type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
