import { z } from "zod";

// Schritt 1 — Unternehmen anlegen.
export const onboardingCompanySchema = z.object({
  name: z.string().min(2, "Name ist erforderlich").max(120),
  slug: z
    .string()
    .min(2, "Kurzname ist erforderlich")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Nur Kleinbuchstaben, Zahlen und Bindestriche"),
});
export type OnboardingCompanyInput = z.infer<typeof onboardingCompanySchema>;

// Ein einzelner, editierbarer/löschbarer Vorschlag (Terminart, Buchungsfrage
// oder benötigtes Feld) innerhalb des Onboarding-Entwurfs.
export const draftItemSchema = z.object({
  id: z.string().min(1).max(60),
  text: z.string().min(1, "Darf nicht leer sein").max(200),
});
export type DraftItem = z.infer<typeof draftItemSchema>;

// Schritt 2 — Branche auswählen. Der Entwurf enthält ausschließlich
// Vorschläge; nichts davon ist bereits eine echte Terminart/Frage/Feld —
// diese entstehen erst in einem späteren, hier bewusst nicht umgesetzten
// Onboarding-Schritt ("Terminarten und Leistungen anlegen").
export const onboardingDraftSchema = z.object({
  industryKey: z.string().max(60).nullable(),
  suggestedServices: z.array(draftItemSchema).max(30),
  suggestedQuestions: z.array(draftItemSchema).max(30),
  suggestedRequiredFields: z.array(draftItemSchema).max(30),
});
export type OnboardingDraft = z.infer<typeof onboardingDraftSchema>;

export const onboardingIndustrySchema = z.object({
  industry_template_id: z.string().uuid("Bitte eine Branche auswählen"),
  draft: z.string().min(1),
});

// Schritt 3 — Unternehmensdaten eintragen (Kontakt, Adresse, Zeitzone; der
// Name selbst gehört zu Schritt 1 "Unternehmen").
export const onboardingDetailsSchema = z.object({
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  timezone: z.string().min(1, "Zeitzone ist erforderlich").max(60),
});
export type OnboardingDetailsInput = z.infer<typeof onboardingDetailsSchema>;
