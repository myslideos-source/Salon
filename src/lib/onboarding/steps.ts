import type { Tables } from "@/lib/supabase/database.types";
import type { OnboardingDraft, DraftItem } from "@/lib/validation/onboarding";

/**
 * Die vollständigen 12 Schritte des Einrichtungsassistenten aus dem
 * HalloMia-Konzept. Die ersten sechs sind umgesetzt (siehe `interactive`) —
 * Unternehmen/Branche/Unternehmensdaten sowie, seit dem Sonderauftrag
 * "Standorte, Team, Ressourcen und Verfügbarkeit", auch Standort,
 * Öffnungszeiten und Team & Ressourcen. Die übrigen folgen nach ihren
 * jeweiligen Fachbereichen (Terminarten, KI-Konfiguration, Telefonie) und
 * werden hier bereits als Fortschritts-Vorschau geführt, ohne anklickbar zu
 * sein — keine funktionslosen Buttons.
 */
export type OnboardingStepDef = {
  step: number;
  title: string;
  description: string;
  interactive: boolean;
};

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  { step: 1, title: "Unternehmen", description: "Name und Kurzname festlegen", interactive: true },
  { step: 2, title: "Branche", description: "Passende Vorschläge übernehmen", interactive: true },
  { step: 3, title: "Unternehmensdaten", description: "Kontakt, Adresse, Zeitzone", interactive: true },
  { step: 4, title: "Standort", description: "Standard-Standort prüfen, weitere Filialen ergänzen", interactive: true },
  { step: 5, title: "Öffnungszeiten", description: "Reguläre Öffnungszeiten festlegen", interactive: true },
  { step: 6, title: "Team & Ressourcen", description: "Mitarbeiter, Räume, Fahrzeuge und Geräte anlegen", interactive: true },
  { step: 7, title: "Terminarten & Leistungen", description: "Terminarten mit Dauer, Preis und Buchungsfragen anlegen", interactive: true },
  { step: 8, title: "Begrüßung & Tonalität", description: "Folgt später", interactive: false },
  { step: 9, title: "Häufige Fragen", description: "Folgt später", interactive: false },
  { step: 10, title: "Kalender testen", description: "Folgt später", interactive: false },
  { step: 11, title: "Telefonnummer verbinden", description: "Folgt später", interactive: false },
  { step: 12, title: "Mia aktivieren", description: "Folgt später", interactive: false },
];

export const LAST_INTERACTIVE_STEP = 7;

export function emptyOnboardingDraft(): OnboardingDraft {
  return { industryKey: null, suggestedServices: [], suggestedQuestions: [], suggestedRequiredFields: [] };
}

/** Baut den editierbaren Vorschlags-Entwurf aus einer Branchenvorlage.
 * Liefert reine Vorschläge — keine echten Terminarten/Fragen/Felder. */
export function draftFromTemplate(template: Tables<"industry_templates">): OnboardingDraft {
  return {
    industryKey: template.key,
    suggestedServices: toDraftItems(template.example_services, "service"),
    suggestedQuestions: toDraftItems(template.example_custom_questions, "question"),
    suggestedRequiredFields: toDraftItems(template.example_required_fields, "field"),
  };
}

function toDraftItems(value: unknown, prefix: string): DraftItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((text, index) => ({ id: `${prefix}-${index}`, text }));
}

/** Parst `salons.onboarding_draft` (Json) defensiv in eine typisierte,
 * garantiert vollständige Entwurfsstruktur. */
export function parseOnboardingDraft(raw: unknown): OnboardingDraft {
  const empty = emptyOnboardingDraft();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty;
  const obj = raw as Record<string, unknown>;
  return {
    industryKey: typeof obj.industryKey === "string" ? obj.industryKey : null,
    suggestedServices: sanitizeItems(obj.suggestedServices),
    suggestedQuestions: sanitizeItems(obj.suggestedQuestions),
    suggestedRequiredFields: sanitizeItems(obj.suggestedRequiredFields),
  };
}

function sanitizeItems(value: unknown): DraftItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is DraftItem =>
      Boolean(entry) && typeof entry === "object" && typeof (entry as DraftItem).id === "string" && typeof (entry as DraftItem).text === "string"
  );
}
