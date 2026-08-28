import { z } from "zod";

// Self-Service-Validierung für "Kundenverwaltung erweitern" (Konzeptabschnitt
// "Kundenverwaltung": Status, Tags, individuelle Felder, Adresse,
// Einwilligungen). Ergänzt das schlankere Grundschema in
// `src/lib/validation/salon.ts` (weiterhin von der Admin-Seite genutzt).

export const CUSTOMER_STATUSES = ["new", "returning", "vip", "inactive", "blocked"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  new: "Neu",
  returning: "Stammkunde",
  vip: "VIP",
  inactive: "Inaktiv",
  blocked: "Gesperrt",
};
export const CUSTOMER_STATUS_TONE: Record<CustomerStatus, "bronze" | "success" | "info" | "neutral" | "danger"> = {
  new: "bronze",
  returning: "info",
  vip: "success",
  inactive: "neutral",
  blocked: "danger",
};

// Explizite "true"/"false"-Strings statt z.coerce.boolean() (siehe
// validation/services.ts) — ein unangeklicktes Checkbox-Feld fehlt in
// FormData komplett, wodurch z.coerce.boolean() es fälschlich auf einen
// Default zurücksetzen würde.
const explicitBoolean = z.enum(["true", "false"]).transform((v) => v === "true");

export const customerSelfSchema = z.object({
  first_name: z.string().optional().or(z.literal("")),
  last_name: z.string().optional().or(z.literal("")),
  phone: z.string().min(3, "Telefonnummer ist erforderlich"),
  email: z.string().email().optional().or(z.literal("")),
  preferred_employee_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(CUSTOMER_STATUSES),
  address: z.string().max(300).optional().or(z.literal("")),
  company: z.string().max(200).optional().or(z.literal("")),
  consent_recording: explicitBoolean,
  consent_marketing: explicitBoolean,
});
export type CustomerSelfInput = z.infer<typeof customerSelfSchema>;

export const tagsSchema = z.array(z.string().min(1).max(40)).max(20);

export function parseTags(raw: unknown): string[] {
  const parsed = tagsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}
