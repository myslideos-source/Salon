/**
 * Zentrale, austauschbare Begriffsebene für HalloMia.
 *
 * Diese Labels sind die branchenneutralen Standardbegriffe des Produkts.
 * Branchenspezifische Begriffe (z. B. „Behandlung" statt „Termin", „Gast"
 * statt „Kunde") dürfen künftig ausschließlich aus Branchenvorlagen oder den
 * Einstellungen eines Unternehmens stammen — nicht fest im Code stehen.
 */
export const TERMINOLOGY = {
  company: "Unternehmen",
  customer: "Kunde",
  customerPlural: "Kunden",
  appointmentType: "Terminart",
  service: "Leistung",
  servicePlural: "Leistungen",
  employee: "Mitarbeiter",
  employeePlural: "Mitarbeiter",
  resource: "Ressource",
  resourcePlural: "Ressourcen",
  teamAndResources: "Team und Ressourcen",
  location: "Standort",
  request: "Anfrage",
  requestPlural: "Anfragen",
} as const;

/** Fallback-Anzeigename, solange kein Unternehmensname bekannt ist (z. B. Avatar-Initialen). */
export const DEFAULT_COMPANY_LABEL = TERMINOLOGY.company;
