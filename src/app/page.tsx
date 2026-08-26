import Link from "next/link";
import Image from "next/image";
import { Phone, Calendar, Users, Sparkles } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { DemoAnimation } from "@/components/marketing/demo-animation";
import { VoiceDemoPlayer } from "@/components/marketing/voice-demo-player";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { Pricing } from "@/components/marketing/pricing";
import { Logo } from "@/components/brand/logo";
import { CookieNotice } from "@/components/marketing/cookie-notice";

const FEATURES = [
  {
    icon: Phone,
    title: "KI-Telefonassistent",
    description: "Nimmt Anrufe entgegen, beantwortet Fragen zu Preisen und Öffnungszeiten und bucht Termine direkt.",
  },
  {
    icon: Calendar,
    title: "Eigener Salon-Kalender",
    description: "Alle Termine landen in deinem HalloMia-Kalender — Mitarbeiter, Arbeitszeiten und Pausen inklusive.",
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
    <div className="theme-landing flex min-h-screen flex-col bg-cream text-ink">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-cream/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Logo size="lg" />
          <nav className="hidden items-center gap-8 text-sm text-ink-soft sm:flex">
            <a href="#funktionen" className="hover:text-ink">Funktionen</a>
            <a href="#so-funktionierts" className="hover:text-ink">So funktioniert&apos;s</a>
            <a href="#preise" className="hover:text-ink">Preise</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/app/login" className="hidden text-sm text-ink-soft hover:text-ink sm:block">
              Salon-Login
            </Link>
            <LinkButton href="#preise" variant="bronze" size="sm">
              Jetzt starten
            </LinkButton>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-cream">
        {/* Baked into the mockup image - kept for accessibility/SEO since the
            visible headline below is a picture, not real text. */}
        <h1 className="sr-only">
          Deine Anrufe. Unsere Mia. Die KI-Telefonassistenz für Friseursalons — nimmt Anrufe entgegen, bucht Termine
          und beantwortet Fragen rund um die Uhr.
        </h1>
        <div className="relative">
          <Image
            src="/marketing/hero-desktop.png"
            alt="HalloMia: Deine Anrufe, unsere Mia. Nimmt Anrufe freundlich entgegen, bucht Termine automatisch, beantwortet Fragen rund um die Uhr."
            width={1983}
            height={618}
            priority
            className="hidden w-full md:block"
            sizes="100vw"
          />
          <Image
            src="/marketing/hero-mobile.png"
            alt="HalloMia: Deine Anrufe, unsere Mia. Nimmt Anrufe freundlich entgegen, bucht Termine automatisch, beantwortet Fragen rund um die Uhr."
            width={864}
            height={1626}
            priority
            className="block w-full md:hidden"
            sizes="100vw"
          />
          {/* Real, clickable hit-area over the "Jetzt starten" button baked
              into the mobile image (the desktop crop has its own real button
              in the header nav above, so no overlay needed there). */}
          <a
            href="#preise"
            aria-label="Jetzt starten"
            className="absolute inset-x-[18%] md:hidden"
            style={{ top: "79%", bottom: "11%" }}
          />
        </div>
      </section>

      <section id="so-funktionierts" className="bg-cream-soft/30">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-16 sm:px-6 lg:px-8">
          <VoiceDemoPlayer />
          <DemoAnimation />
        </div>
      </section>

      <ProductShowcase />

      <section id="funktionen" className="border-y border-border/70 bg-cream-soft/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">Kalender + Telefon + Termin + Kunde</h2>
            <p className="mt-3 text-ink-soft">
              Keine überladene Salon-Software. HalloMia konzentriert sich auf das, was im Alltag wirklich zählt.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-white/[0.03] p-6 backdrop-blur-sm">
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
            Ich richte deinen HalloMia-Assistenten persönlich ein. Melde dich, und wir starten gemeinsam.
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
          <Logo size="sm" textClassName="text-ink-soft" />
          <p>© {new Date().getFullYear()} HalloMia. Alle Rechte vorbehalten.</p>
          <nav className="flex items-center gap-5">
            <Link href="/impressum" className="hover:text-ink">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-ink">Datenschutz</Link>
          </nav>
        </div>
      </footer>
      <CookieNotice />
    </div>
  );
}
