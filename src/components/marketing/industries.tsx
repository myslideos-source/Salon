"use client";

import { useState } from "react";
import {
  Scissors,
  Stethoscope,
  Hammer,
  Scale,
  Car,
  HeartPulse,
  Home,
  GraduationCap,
  Camera,
  Dumbbell,
  Utensils,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const INITIAL_INDUSTRIES = [
  {
    icon: Scissors,
    title: "Friseure & Kosmetikstudios",
    description: "Terminarten, Behandlungen und Mitarbeiter im Blick.",
  },
  {
    icon: Stethoscope,
    title: "Arzt- & Zahnarztpraxen",
    description: "Sprechzeiten und Terminarten flexibel verwalten.",
  },
  {
    icon: Hammer,
    title: "Handwerksbetriebe",
    description: "Aufträge, Vor-Ort-Termine und Rückrufe organisieren.",
  },
  {
    icon: Scale,
    title: "Kanzleien & Beratung",
    description: "Erstgespräche und Beratungstermine zuverlässig buchen.",
  },
  {
    icon: Car,
    title: "Werkstätten",
    description: "Fahrzeug, Kennzeichen und Abholtermin direkt erfassen.",
  },
  {
    icon: HeartPulse,
    title: "Physiotherapie & Wellness",
    description: "Behandlungstermine ohne Doppelbuchung.",
  },
] as const;

const MORE_INDUSTRIES = [
  {
    icon: Home,
    title: "Immobilienmakler",
    description: "Besichtigungstermine automatisch koordinieren.",
  },
  {
    icon: GraduationCap,
    title: "Fahrschulen",
    description: "Fahrstunden und Prüfungstermine planen.",
  },
  {
    icon: Camera,
    title: "Fotografen",
    description: "Fototermine und Beratungsgespräche buchen.",
  },
  {
    icon: Dumbbell,
    title: "Fitness- & Personal-Trainer",
    description: "Trainingstermine flexibel verwalten.",
  },
  {
    icon: Utensils,
    title: "Restaurants",
    description: "Tischreservierungen rund um die Uhr entgegennehmen.",
  },
  {
    icon: Sparkles,
    title: "Und viele weitere Dienstleister",
    description: "Für jedes Unternehmen mit Terminen anpassbar.",
  },
] as const;

export function Industries() {
  const [expanded, setExpanded] = useState(false);
  const industries = expanded ? [...INITIAL_INDUSTRIES, ...MORE_INDUSTRIES] : INITIAL_INDUSTRIES;

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((industry) => (
          <div
            key={industry.title}
            className="rounded-2xl border border-border bg-white/[0.03] p-6 backdrop-blur-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-bronze-soft text-bronze-dark">
              <industry.icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <h3 className="mt-4 font-display text-base text-ink">{industry.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{industry.description}</p>
          </div>
        ))}
      </div>

      {!expanded && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-strong bg-white/5 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-sand"
          >
            Weitere Branchen anzeigen
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
