import { z } from "zod";

// Self-Service-Validierung für "Terminarten und Leistungen" (Konzeptabschnitt
// "Flexible Terminarten"). Ergänzt `src/lib/validation/salon.ts` (das
// schlankere Admin-Schema) um Beschreibung, optionalen Preis, Standort,
// Telefon-/Online-Buchbarkeit sowie die beiden frei konfigurierbaren Listen
// (notwendige Kundenangaben, individuelle Buchungsfragen). Keine
// Branchenbeispiele sind hier fest verdrahtet — alle Fragen/Felder kommen
// ausschließlich aus Nutzereingaben oder, im Onboarding, aus editierbaren
// Branchenvorlagen-Vorschlägen.

// Explizite "true"/"false"-Strings statt z.coerce.boolean(): Ein
// nativ-unchecked Checkbox-Feld fehlt in FormData komplett, wodurch
// z.coerce.boolean().default(true) es fälschlich wieder auf true setzen
// würde — "Deaktivieren" bliebe dann wirkungslos. Die Formulare senden
// diese vier Felder deshalb kontrolliert über verstecktes Input mit
// explizitem "true"/"false"-Wert.
const explicitBoolean = z.enum(["true", "false"]).transform((v) => v === "true");

export const serviceSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  category: z.string().max(80).optional().or(z.literal("")),
  duration_minutes: z.coerce.number().int().min(5, "Mindestens 5 Minuten"),
  has_price: explicitBoolean,
  price_cents: z.coerce.number().int().min(0),
  buffer_before_minutes: z.coerce.number().int().min(0),
  buffer_after_minutes: z.coerce.number().int().min(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Ungültige Farbe"),
  location_id: z.string().uuid().optional().or(z.literal("")),
  bookable_phone: explicitBoolean,
  bookable_online: explicitBoolean,
  active: explicitBoolean,
});
export type ServiceInput = z.infer<typeof serviceSchema>;

// Notwendige Kundenangaben — eine einfache, frei editierbare Liste (z. B.
// "Adresse", "Kennzeichen"). Reihenfolge = Anzeigereihenfolge.
export const requiredFieldSchema = z.object({
  id: z.string().min(1).max(60),
  text: z.string().min(1, "Darf nicht leer sein").max(120),
});
export type RequiredField = z.infer<typeof requiredFieldSchema>;
export const requiredFieldsSchema = z.array(requiredFieldSchema).max(20);

// Individuelle Buchungsfragen — jede Frage hat einen geeigneten Feldtyp,
// eine Pflichtfeldsteuerung und eine feste Reihenfolge (= Position im
// Array). Kein Feldtyp/keine Frage ist hier hartkodiert; das Unternehmen
// legt Inhalt und Typ selbst fest.
export const CUSTOM_QUESTION_TYPES = ["text", "number", "boolean", "select", "date"] as const;
export type CustomQuestionType = (typeof CUSTOM_QUESTION_TYPES)[number];
export const CUSTOM_QUESTION_TYPE_LABEL: Record<CustomQuestionType, string> = {
  text: "Freitext",
  number: "Zahl",
  boolean: "Ja / Nein",
  select: "Auswahl",
  date: "Datum",
};

export const customQuestionSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1, "Frage darf nicht leer sein").max(200),
  type: z.enum(CUSTOM_QUESTION_TYPES),
  required: z.boolean().default(false),
  options: z.array(z.string().min(1).max(100)).max(20).default([]),
});
export type CustomQuestion = z.infer<typeof customQuestionSchema>;
export const customQuestionsSchema = z.array(customQuestionSchema).max(20);

export function parseRequiredFields(raw: unknown): RequiredField[] {
  const parsed = requiredFieldsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export function parseCustomQuestions(raw: unknown): CustomQuestion[] {
  const parsed = customQuestionsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}
