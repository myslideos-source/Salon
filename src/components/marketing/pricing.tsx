"use client";

import { useActionState, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { createSignupRequestAction, type SignupActionState } from "@/lib/actions/signup";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "79",
    description: "Für kleine Salons, die loslegen wollen.",
    features: ["1 Mitarbeiter im Kalender", "KI-Telefonassistent", "Terminverwaltung", "Kundenverwaltung"],
    highlighted: false,
  },
  {
    id: "salon",
    name: "Salon",
    price: "99",
    description: "Der Standard für die meisten Salons.",
    features: ["Bis zu 5 Mitarbeiter", "KI-Telefonassistent", "Anrufhistorie & Rückrufe", "Prioritäts-Support"],
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "199",
    description: "Für große Teams und mehrere Standorte.",
    features: ["Unbegrenzt Mitarbeiter", "KI-Telefonassistent", "Erweiterte Auswertungen", "Persönlicher Ansprechpartner"],
    highlighted: false,
  },
] as const;

function SignupForm({ plan, onSent }: { plan: string; onSent: () => void }) {
  const [state, formAction, pending] = useActionState<SignupActionState, FormData>(createSignupRequestAction, null);

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(onSent, 1800);
      return () => clearTimeout(t);
    }
  }, [state?.ok, onSent]);

  if (state?.ok) {
    return (
      <div className="py-6 text-center">
        <p className="font-display text-lg text-ink">Danke für deine Anfrage!</p>
        <p className="mt-2 text-sm text-ink-soft">
          Ich melde mich persönlich bei dir, um die Zahlung zu klären und deinen HalloMia-Assistenten einzurichten.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="plan" value={plan} />
      <div>
        <Label htmlFor="salon_name">Salonname</Label>
        <Input id="salon_name" name="salon_name" required placeholder="Hair Lounge Milano" />
      </div>
      <div>
        <Label htmlFor="contact_name">Dein Name</Label>
        <Input id="contact_name" name="contact_name" required placeholder="Vor- und Nachname" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" name="email" type="email" required placeholder="du@salon.de" />
        </div>
        <div>
          <Label htmlFor="phone">Telefon (optional)</Label>
          <Input id="phone" name="phone" placeholder="+49 30 1234567" />
        </div>
      </div>
      <div>
        <Label htmlFor="message">Nachricht (optional)</Label>
        <Textarea id="message" name="message" placeholder="Fragen, Wünsche oder deine bisherige Telefonnummer?" />
      </div>
      <div className="rounded-lg border border-border bg-cream-soft/60 px-3 py-2.5 text-xs text-ink-soft">
        <strong className="text-ink">Deine bisherige Telefonnummer bleibt erhalten:</strong> Wir richten meist eine
        Rufumleitung von deiner bestehenden Nummer auf HalloMia ein — schnell, ohne Anbieterwechsel. Eine vollständige
        Portierung der Nummer ist später jederzeit möglich, falls gewünscht.
      </div>
      <FieldError>{state?.error}</FieldError>
      <p className="text-xs text-ink-faint">
        Nach dem Absenden melde ich mich mit den Zahlungsdetails. Dein Zugang wird manuell freigeschaltet, sobald die
        Zahlung eingegangen ist.
      </p>
      <Button type="submit" variant="bronze" className="w-full" disabled={pending}>
        {pending ? "Wird gesendet…" : "Unverbindlich anfragen"}
      </Button>
    </form>
  );
}

export function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<(typeof PLANS)[number] | null>(null);

  return (
    <section id="preise" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">Einfache, faire Preise</h2>
        <p className="mt-3 text-ink-soft">Ich richte deinen HalloMia-Assistenten persönlich ein — du musst dich um nichts Technisches kümmern.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col rounded-2xl border p-6",
              plan.highlighted ? "border-bronze bg-bronze-soft/40 shadow-md" : "border-border bg-white/70"
            )}
          >
            {plan.highlighted && (
              <span className="brand-gradient-bg mb-3 inline-block w-fit rounded-full px-2.5 py-1 text-[11px] font-medium text-white">
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
            <Button
              variant={plan.highlighted ? "bronze" : "outline"}
              className="mt-6 w-full"
              onClick={() => setSelectedPlan(plan)}
            >
              {plan.name} auswählen
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-ink-faint">
        Einmalige Einrichtung: <span className="font-medium text-ink-soft">249 €</span> — ich übernehme die komplette technische Ersteinrichtung.
      </p>

      <Modal
        open={selectedPlan !== null}
        onClose={() => setSelectedPlan(null)}
        title={selectedPlan ? `${selectedPlan.name}-Paket anfragen` : ""}
        subtitle={selectedPlan ? `${selectedPlan.price} € / Monat` : undefined}
      >
        {selectedPlan && <SignupForm plan={selectedPlan.id} onSent={() => setSelectedPlan(null)} />}
      </Modal>
    </section>
  );
}
