import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    price: "79",
    description: "Für kleine Salons, die loslegen wollen.",
    features: ["1 Mitarbeiter im Kalender", "KI-Telefonassistent", "Terminverwaltung", "Kundenverwaltung"],
    highlighted: false,
  },
  {
    name: "Salon",
    price: "129",
    description: "Der Standard für die meisten Salons.",
    features: ["Bis zu 5 Mitarbeiter", "KI-Telefonassistent", "Anrufhistorie & Rückrufe", "Prioritäts-Support"],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "199",
    description: "Für große Teams und mehrere Standorte.",
    features: ["Unbegrenzt Mitarbeiter", "KI-Telefonassistent", "Erweiterte Auswertungen", "Persönlicher Ansprechpartner"],
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="preise" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">Einfache, faire Preise</h2>
        <p className="mt-3 text-ink-soft">Ich richte deinen SalonCall-Assistenten persönlich ein — du musst dich um nichts Technisches kümmern.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "rounded-2xl border p-6",
              plan.highlighted ? "border-bronze bg-bronze-soft/40 shadow-md" : "border-border bg-white/70"
            )}
          >
            {plan.highlighted && (
              <span className="mb-3 inline-block rounded-full bg-bronze px-2.5 py-1 text-[11px] font-medium text-white">
                Beliebteste Wahl
              </span>
            )}
            <h3 className="font-display text-xl text-ink">{plan.name}</h3>
            <p className="mt-1 text-sm text-ink-soft">{plan.description}</p>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-3xl text-ink">{plan.price} €</span>
              <span className="text-sm text-ink-faint">/Monat</span>
            </p>
            <ul className="mt-5 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-ink-soft">
                  <Check className="h-4 w-4 shrink-0 text-bronze" /> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-ink-faint">
        Einmalige Einrichtung: <span className="font-medium text-ink-soft">299 €</span> — ich übernehme die komplette technische Ersteinrichtung.
      </p>
    </section>
  );
}
