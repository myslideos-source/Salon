import Link from "next/link";
import Image from "next/image";
import { Phone, Calendar, Users, Sparkles, PhoneMissed, Clock3, Moon, HeartHandshake, ChevronDown, ShieldCheck, MapPin, UserCheck } from "lucide-react";
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

const BENEFITS = [
  {
    icon: PhoneMissed,
    title: "Nie wieder verpasste Anrufe",
    description: "Auch beim Schneiden, in der Mittagspause oder nach Feierabend nimmt HalloMia ab — kein Kunde landet mehr auf der Mailbox.",
  },
  {
    icon: Clock3,
    title: "Mehr Zeit für deine Kund:innen",
    description: "Weniger Unterbrechungen während der Arbeit am Kunden, weil das Telefon nicht mehr ständig dazwischenfunkt.",
  },
  {
    icon: Moon,
    title: "Rund um die Uhr erreichbar",
    description: "Auch abends und am Wochenende können Kund:innen anrufen und einen Termin buchen — ganz ohne dass jemand ran muss.",
  },
  {
    icon: HeartHandshake,
    title: "Weniger Stress im Salon-Alltag",
    description: "Keine Zettelwirtschaft, keine Doppelbuchungen, keine hektischen Rückrufe zwischen zwei Kundenterminen.",
  },
];

const FAQS = [
  {
    question: "Muss ich meine bisherige Telefonnummer wechseln?",
    answer:
      "Nein. In der Regel richten wir eine Rufumleitung von deiner bestehenden Nummer auf HalloMia ein — ohne Anbieterwechsel. Eine vollständige Portierung ist später jederzeit möglich.",
  },
  {
    question: "Was passiert, wenn die KI eine Frage nicht beantworten kann?",
    answer:
      "Dann sagt sie das offen und bietet einen Rückruf an, statt etwas zu erfinden. Du siehst offene Rückrufwünsche direkt im Dashboard.",
  },
  {
    question: "Bucht die KI wirklich echte, freie Termine?",
    answer:
      "Ja. HalloMia prüft in Echtzeit den tatsächlichen Kalender deines Salons — inklusive Arbeitszeiten, Pausen und Abwesenheiten. Keine Doppelbuchungen.",
  },
  {
    question: "Wie schnell ist HalloMia eingerichtet?",
    answer:
      "Nach deiner Anfrage richte ich deinen Assistenten persönlich ein — Stimme, Begrüßung und Kalenderanbindung inklusive. Details dazu bei der einmaligen Einrichtungsgebühr.",
  },
  {
    question: "Sind die Daten meiner Kund:innen sicher?",
    answer:
      "Ja. Termin- und Kundendaten werden in der EU (Frankfurt) gespeichert. Details zu allen eingesetzten Diensten findest du in der Datenschutzerklärung.",
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
            <a href="#vorteile" className="hover:text-ink">Vorteile</a>
            <a href="#preise" className="hover:text-ink">Preise</a>
            <a href="#so-funktionierts" className="hover:text-ink">So funktioniert&apos;s</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
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

      <section className="border-y border-border/70 bg-cream-soft/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4 text-left">
            <span className="brand-gradient-text font-display text-4xl leading-none sm:text-5xl">24/7</span>
            <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
              HalloMia arbeitet automatisch rund um die Uhr für dich — mehr Zeit für andere Dinge oder deine Kund:innen.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-ink-soft">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-bronze" /> Made in Germany
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-bronze" /> DSGVO-konform · Server in der EU
            </span>
            <span className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-bronze" /> Persönliche Einrichtung
            </span>
          </div>
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

      <section id="vorteile" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">Warum Salons HalloMia lieben</h2>
          <p className="mt-3 text-ink-soft">Nicht nur ein Feature mehr — spürbar mehr Ruhe im Salon-Alltag.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-4 rounded-2xl border border-border bg-white/[0.03] p-6 backdrop-blur-sm">
              <div className="brand-gradient-bg flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white">
                <b.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="font-display text-lg text-ink">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Pricing />

      <section id="faq" className="border-t border-border/70 bg-cream-soft/50">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">Häufige Fragen</h2>
            <p className="mt-3 text-ink-soft">Was Salon-Inhaber:innen uns am häufigsten fragen.</p>
          </div>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.question}
                className="group rounded-2xl border border-border bg-white/[0.03] px-5 py-4 backdrop-blur-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base text-ink marker:content-none">
                  {f.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
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
