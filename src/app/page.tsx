import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Calendar,
  Users,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  MapPin,
  UserCheck,
  RotateCw,
  UsersRound,
  CalendarCheck,
  PhoneCall,
  Heart,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { DemoAnimation } from "@/components/marketing/demo-animation";
import { VoiceDemoPlayer } from "@/components/marketing/voice-demo-player";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { Pricing } from "@/components/marketing/pricing";
import { Logo } from "@/components/brand/logo";
import { CookieNotice } from "@/components/marketing/cookie-notice";
import { Reveal } from "@/components/marketing/reveal";

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
    icon: RotateCw,
    title: "Rund um die Uhr erreichbar",
    description: "Kein Anruf geht mehr verloren.",
  },
  {
    icon: UsersRound,
    title: "Mehr Zeit für dein Team",
    description: "Weniger Telefonstress, mehr Fokus auf Kund:innen.",
  },
  {
    icon: CalendarCheck,
    title: "Automatische Terminbuchung",
    description: "Direkt beim Anruf — einfach & zuverlässig.",
  },
  {
    icon: PhoneCall,
    title: "Professionell & freundlich",
    description: "Jeder Anruf wird professionell beantwortet.",
  },
];

const HOW_IT_WORKS = [
  {
    icon: Phone,
    title: "Anruf",
    description: "Kund:innen rufen deinen Salon an.",
  },
  {
    icon: Heart,
    title: "HalloMia übernimmt",
    description: "Begrüßt, versteht das Anliegen und hilft sofort.",
  },
  {
    icon: CalendarCheck,
    title: "Termin buchen",
    description: "Passenden Termin finden und direkt im Kalender eintragen.",
  },
  {
    icon: Sparkles,
    title: "Du hast mehr Zeit",
    description: "Weniger Telefonstress, mehr Zeit für das, was wirklich zählt.",
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
              Kunden Login
            </Link>
            <LinkButton href="/admin/login" variant="bronze" size="sm">
              Admin Bereich
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

      <section className="bg-cream-soft/30 px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 rounded-2xl border border-bronze/30 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Heart className="h-8 w-8 shrink-0 text-gold" strokeWidth={1.5} />
              <p className="text-sm leading-relaxed text-ink-soft sm:text-base">
                HalloMia arbeitet automatisch rund um die Uhr für dich — damit du{" "}
                <span className="text-gold">mehr Zeit für deine Kund:innen</span> und andere wichtige Dinge hast.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
              <div>
                <p className="brand-gradient-text font-display text-3xl leading-none">24/7</p>
                <p className="mt-1 text-xs text-ink-faint">für dich im Einsatz</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-xs text-success">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                Immer erreichbar
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-soft">
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
        </Reveal>
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
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delayMs={i * 80}>
              <div className="h-full rounded-2xl border border-border bg-white/[0.03] p-6 text-center backdrop-blur-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-bronze/30 bg-bronze-soft text-bronze-dark">
                  <b.icon className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 font-display text-base text-ink">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{b.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-cream-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">So einfach funktioniert HalloMia</h2>
            <p className="mt-3 text-ink-soft">Vom Anruf bis zum gebuchten Termin — ohne dass du etwas tun musst.</p>
          </div>
          <div className="relative mt-14 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <Reveal key={step.title} delayMs={i * 120} className="relative text-center">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="pointer-events-none absolute top-8 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-5rem)] border-t-2 border-dashed border-bronze/30 lg:block" />
                )}
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-bronze/30 bg-bronze-soft text-bronze-dark">
                  <step.icon className="h-6 w-6" strokeWidth={1.6} />
                  <span className="brand-gradient-bg absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.description}</p>
              </Reveal>
            ))}
          </div>
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
        <Reveal>
          <div className="rounded-3xl border border-border bg-ink px-8 py-14 text-center text-cream sm:px-16">
            <p className="flex items-center justify-center gap-2 font-display text-2xl sm:text-3xl">
              Klingt gut? <span className="brand-gradient-text">Ist es auch!</span>
              <Sparkles className="h-5 w-5 text-gold" />
            </p>
            <p className="mx-auto mt-3 max-w-md text-cream/70">
              Teste HalloMia jetzt risikofrei und überzeuge dich selbst — ich richte deinen Assistenten persönlich
              ein.
            </p>
            <div className="mt-8 flex justify-center">
              <LinkButton href="#preise" variant="bronze" size="lg">
                Demo anfragen
              </LinkButton>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="border-t border-border/70 bg-cream-soft/40 px-4 py-4 text-center text-sm text-ink-soft sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2">
          <Heart className="h-4 w-4 text-gold" strokeWidth={1.5} />
          HalloMia — deine KI-Telefonassistenz für glückliche Kund:innen und entspannte Salons.
        </span>
      </div>

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
