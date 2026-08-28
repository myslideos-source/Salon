import { Quote } from "lucide-react";

// HalloMia is still onboarding its first customers across new industries,
// so there are no real testimonials to show yet. Every example here is
// explicitly labeled as a demo scenario rather than presented as a real
// customer quote - see docs/HALLOMIA_UNIVERSAL_KONZEPT.md "Social Proof".
const EXAMPLES = [
  {
    quote: "Ich verpasse keinen Anruf mehr, auch wenn ich gerade auf einer Baustelle bin.",
    role: "Inhaber:in, Handwerksbetrieb",
  },
  {
    quote: "Termine werden jetzt auch außerhalb der Sprechzeiten zuverlässig vereinbart.",
    role: "Praxisinhaber:in",
  },
  {
    quote: "Kund:innen bekommen sofort einen Termin, ich muss nicht mehr zwischendurch ans Telefon.",
    role: "Studioinhaber:in",
  },
] as const;

export function SocialProof() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">So könnte es bei dir aussehen</h2>
        <p className="mt-3 text-ink-soft">
          HalloMia richtet sich gerade an Unternehmen aus vielen Branchen. Statt erfundener Kundenstimmen zeigen wir
          hier klar gekennzeichnete Beispiele.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {EXAMPLES.map((example) => (
          <div
            key={example.quote}
            className="flex h-full flex-col rounded-2xl border border-border bg-white/[0.03] p-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <Quote className="h-5 w-5 text-bronze" strokeWidth={1.8} />
              <span className="rounded-full border border-border-strong bg-sand px-2.5 py-0.5 text-[11px] font-medium text-ink-faint">
                Beispiel
              </span>
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">„{example.quote}“</p>
            <p className="mt-4 text-xs font-medium text-ink-faint">{example.role} · Demo-Szenario</p>
          </div>
        ))}
      </div>
    </section>
  );
}
