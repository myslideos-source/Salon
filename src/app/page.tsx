import Link from "next/link";
import { Phone, Calendar, Users, Sparkles, ArrowRight } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { DemoAnimation } from "@/components/marketing/demo-animation";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { Pricing } from "@/components/marketing/pricing";

const FEATURES = [
  {
    icon: Phone,
    title: "KI-Telefonassistent",
    description: "Nimmt Anrufe entgegen, beantwortet Fragen zu Preisen und Öffnungszeiten und bucht Termine direkt.",
  },
  {
    icon: Calendar,
    title: "Eigener Salon-Kalender",
    description: "Alle Termine landen in deinem SalonCall-Kalender — Mitarbeiter, Arbeitszeiten und Pausen inklusive.",
  },
  {
    icon: Sparkles,
    title: "Echte Verfügbarkeit",
    description: "Die KI bietet nur Zeiten an, die tatsächlich frei sind. Keine Doppelbuchungen, kein Rätselraten.",
  },
  {
    icon: Users,
    title: "Kundenverwaltung",
    description: "Automatische Kundenerkennung per Telefonnummer, Terminhistorie und Notizen an einem Ort.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-cream/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <span className="font-display text-lg text-ink">
            SalonCall <span className="text-bronze">AI</span>
          </span>
          <nav className="hidden items-center gap-8 text-sm text-ink-soft sm:flex">
            <a href="#funktionen" className="hover:text-ink">Funktionen</a>
            <a href="#so-funktionierts" className="hover:text-ink">So funktioniert&apos;s</a>
            <a href="#preise" className="hover:text-ink">Preise</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/app/login" className="hidden text-sm text-ink-soft hover:text-ink sm:block">
              Salon-Login
            </Link>
            <LinkButton href="#so-funktionierts" variant="bronze" size="sm">
              Demo testen
            </LinkButton>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-bronze-soft/50 blur-3xl" />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bronze-soft px-3 py-1 text-xs font-medium text-bronze-dark">
              <Sparkles className="h-3 w-3" /> Für Friseursalons gemacht
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
              Dein Salon geht ans Telefon.
              <br />
              <span className="text-bronze-dark">Auch wenn du gerade keine Hand frei hast.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
              SalonCall AI nimmt Anrufe entgegen, beantwortet Fragen und trägt Termine automatisch in deinen
              Salon-Kalender ein — in Echtzeit geprüft, ohne Doppelbuchungen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="#so-funktionierts" variant="bronze" size="lg">
                Demo testen <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="#funktionen" variant="outline" size="lg">
                So funktioniert&apos;s
              </LinkButton>
            </div>
          </div>
          <div id="so-funktionierts">
            <DemoAnimation />
          </div>
        </div>
      </section>

      <ProductShowcase />

      <section id="funktionen" className="border-y border-border/70 bg-cream-soft/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">Kalender + Telefon + Termin + Kunde</h2>
            <p className="mt-3 text-ink-soft">
              Keine überladene Salon-Software. SalonCall AI konzentriert sich auf das, was im Alltag wirklich zählt.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-white/70 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bronze-soft text-bronze-dark">
                  <f.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 font-display text-lg text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Pricing />

      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-ink px-8 py-14 text-center text-cream sm:px-16">
          <h2 className="font-display text-3xl sm:text-4xl">Bereit, dass dein Salon ans Telefon geht?</h2>
          <p className="mx-auto mt-3 max-w-md text-cream/70">
            Ich richte deinen SalonCall-Assistenten persönlich ein. Melde dich, und wir starten gemeinsam.
          </p>
          <div className="mt-8 flex justify-center">
            <Button variant="bronze" size="lg" className="pointer-events-none opacity-90">
              Demo anfragen
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-ink-faint sm:flex-row sm:px-6 lg:px-8">
          <span className="font-display text-ink-soft">
            SalonCall <span className="text-bronze">AI</span>
          </span>
          <p>© {new Date().getFullYear()} SalonCall AI. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}
