import { z } from "zod";

// Individuelle Felder — generisches Framework (Konzeptabschnitt
// "Kundenverwaltung": "individuelle Felder"; Datenmodell bereits in
// 0024_custom_field_definitions.sql angelegt, bislang ohne UI). Jedes
// Unternehmen kann pro Entität (Kunde, Anfrage, …) eigene Zusatzfelder
// definieren, ohne dass dafür eine Migration nötig wäre — die Werte selbst
// landen in der jeweiligen `custom_fields`-jsonb-Spalte.

export const CUSTOM_FIELD_ENTITY_TYPES = ["customer", "request", "appointment", "employee"] as const;
export type CustomFieldEntityType = (typeof CUSTOM_FIELD_ENTITY_TYPES)[number];

export const CUSTOM_FIELD_TYPES = ["text", "number", "date", "boolean", "select", "textarea"] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];
export const CUSTOM_FIELD_TYPE_LABEL: Record<CustomFieldType, string> = {
  text: "Text",
  number: "Zahl",
  date: "Datum",
  boolean: "Ja / Nein",
  select: "Auswahl",
  textarea: "Mehrzeiliger Text",
};

const explicitBoolean = z.enum(["true", "false"]).transform((v) => v === "true");

export const customFieldDefinitionSchema = z.object({
  label: z.string().min(1, "Bezeichnung ist erforderlich").max(120),
  field_type: z.enum(CUSTOM_FIELD_TYPES),
  options: z.array(z.string().min(1).max(100)).max(30).default([]),
  required: explicitBoolean,
  active: explicitBoolean,
});
export type CustomFieldDefinitionInput = z.infer<typeof customFieldDefinitionSchema>;

export type CustomFieldDefinition = {
  id: string;
  entity_type: string;
  key: string;
  label: string;
  field_type: string;
  options: unknown;
  required: boolean;
  sort_order: number;
  active: boolean;
};

/** Erzeugt aus einer Bezeichnung einen stabilen, sprechenden Schlüssel für
 * die `custom_fields`-jsonb-Spalte (z. B. "Kennzeichen" → "kennzeichen"). */
export function slugifyFieldKey(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `feld_${Date.now()}`;
}

/** Validiert die eingereichten Werte gegen die aktiven Felddefinitionen und
 * liefert ein sauberes jsonb-Objekt für `custom_fields`. Unbekannte Schlüssel
 * werden verworfen; fehlende Pflichtfelder liefern eine Fehlermeldung. */
export function parseCustomFieldValues(
  definitions: CustomFieldDefinition[],
  raw: unknown
): { values: Record<string, string | number | boolean | null>; error?: string } {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const values: Record<string, string | number | boolean | null> = {};
  for (const def of definitions) {
    if (!def.active) continue;
    const v = input[def.key];
    if (v === undefined || v === null || v === "") {
      if (def.required) return { values, error: `„${def.label}" ist erforderlich.` };
      continue;
    }
    if (def.field_type === "boolean") values[def.key] = Boolean(v);
    else if (def.field_type === "number") {
      const n = Number(v);
      if (Number.isNaN(n)) return { values, error: `„${def.label}" muss eine Zahl sein.` };
      values[def.key] = n;
    } else {
      values[def.key] = String(v);
    }
  }
  return { values };
}
