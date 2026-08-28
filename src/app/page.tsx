import Link from "next/link";
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
  CalendarCheck,
  CalendarClock,
  FileText,
  Building2,
  Store,
  ListChecks,
  BellOff,
  Heart,
  HardHat,
  Users2,
  Moon,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { DemoAnimation } from "@/components/marketing/demo-animation";
import { VoiceDemoPlayer } from "@/components/marketing/voice-demo-player";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { Industries } from "@/components/marketing/industries";
import { SocialProof } from "@/components/marketing/social-proof";
import { Pricing } from "@/components/marketing/pricing";
import { Logo } from "@/components/brand/logo";
import { CookieNotice } from "@/components/marketing/cookie-notice";
import { Reveal } from "@/components/marketing/reveal";

const PROBLEM_MOMENTS = [
  { icon: Users2, label: "beim Kundentermin" },
  { icon: HardHat, label: "auf der Baustelle" },
  { icon: Sparkles, label: "in der Behandlung" },
  { icon: Moon, label: "nach Feierabend" },
];

const HOW_IT_WORKS = [
  { icon: Phone, title: "Kunde ruft an", description: "Kunde ruft an." },
  { icon: Sparkles, title: "Mia versteht", description: "Mia versteht das Anliegen." },
  { icon: Calendar, title: "Mia prüft", description: "Mia beantwortet Fragen oder prüft den Kalender." },
  { icon: CalendarCheck, title: "Mia bucht", description: "Mia bucht einen Termin oder erstellt einen Rückruf." },
  { icon: FileText, title: "Du bekommst Bescheid", description: "Das Unternehmen erhält eine Zusammenfassung." },
];

const FEATURES = [
  {
    icon: Phone,
    title: "KI-Telefonassistent",
    description: "Nimmt Anrufe entgegen, beantwortet Fragen zu Preisen und Öffnungszeiten und bucht Termine direkt.",
  },
  {
    icon: Calendar,
    title: "Eigener HalloMia-Kalender",
    description: "Alle Termine landen direkt in deinem eigenen Kalender — Mitarbeiter, Arbeitszeiten und Pausen inklusive.",
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
  { icon: RotateCw, title: "Rund um die Uhr erreichbar" },
  { icon: BellOff, title: "Weniger Unterbrechungen" },
  { icon: CalendarCheck, title: "Mehr gebuchte Termine" },
  { icon: CalendarClock, title: "Eigener intelligenter Kalender" },
  { icon: FileText, title: "Automatische Gesprächszusammenfassungen" },
  { icon: Building2, title: "Für jede Branche anpassbar" },
  { icon: Store, title: "Auch für kleine Unternehmen geeignet" },
  { icon: ListChecks, title: "In wenigen Schritten eingerichtet" },
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
      "Ja. HalloMia prüft in Echtzeit den tatsächlichen Kalender deines Unternehmens — inklusive Arbeitszeiten, Pausen und Abwesenheiten. Keine Doppelbuchungen.",
  },
  {
    question: "Wie schnell ist HalloMia eingerichtet?",
    answer:
      "Nach deiner Anfrage richte ich deinen Assistenten persönlich ein — Stimme, Begrüßung und Kalenderanbindung inklusive. Details dazu bei der einmaligen Einrichtungsgebühr.",
  },
  {
    question: "Ist HalloMia für meine Branche geeignet?",
    answer:
      "HalloMia passt sich deinem Unternehmen an, nicht umgekehrt. Beim Einrichten wählst du deine Branche, HalloMia schlägt passende Terminarten und Begriffe vor — alles bleibt danach frei anpassbar.",
  },
  {
    question: "Sind die Daten meiner Kund:innen sicher?",
    answer:
      "Ja. Termin- und Kundendaten werden in der EU (Frankfurt) gespeichert. Details zu allen eingesetzten Diensten findest du in der Datenschutzerklärung.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-cream/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Logo size="lg" />
          <nav className="hidden items-center gap-8 text-sm text-ink-soft sm:flex">
            <a href="#funktionen" className="hover:text-ink">Funktionen</a>
            <a href="#vorteile" className="hover:text-ink">Vorteile</a>
            <a href="#branchen" className="hover:text-ink">Branchen</a>
            <a href="#preise" className="hover:text-ink">Preise</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <LinkButton href="/app/login" variant="bronze" size="sm">
              Kunden Login
            </LinkButton>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-cream px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div
          aria-hidden
          className="brand-gradient-bg pointer-events-none absolute -top-32 right-0 -z-10 h-96 w-96 rounded-full opacity-[0.12] blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-10">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-bronze/30 bg-bronze-soft px-3 py-1 text-xs font-medium text-bronze-dark">
              <Sparkles className="h-3.5 w-3.5" />
              Deine KI-Assistentin für Anrufe, Termine und Kundenanfragen
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight text-ink sm:text-5xl">
              Deine KI-Assistentin. Immer erreichbar.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
              HalloMia nimmt Anrufe entgegen, beantwortet Kundenfragen und trägt Termine direkt in deinen Kalender
              ein – auch wenn du gerade keine Zeit hast.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="#preise" variant="bronze" size="lg">
                Kostenlos testen
              </LinkButton>
              <LinkButton href="#so-funktionierts" variant="outline" size="lg">
                So funktioniert&apos;s
              </LinkButton>
            </div>
          </div>
          <Reveal delayMs={120}>
            <HeroMockup />
          </Reveal>
        </div>
      </section>

      <section className="bg-cream-soft/30 px-4 py-8 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 rounded-2xl border border-bronze/30 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Heart className="h-8 w-8 shrink-0 text-gold" strokeWidth={1.5} />
              <p className="text-sm leading-relaxed text-ink-soft sm:text-base">
                HalloMia ist rund um die Uhr für dein Unternehmen im Einsatz — egal aus welcher Branche.
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

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">Kein Anruf geht mehr verloren.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
          Anrufe kommen selten dann, wenn gerade Zeit ist — beim Kundentermin, auf der Baustelle, in der Behandlung,
          im Meeting oder längst nach Feierabend. HalloMia nimmt genau diese Anrufe entgegen: freundlich,
          zuverlässig und rund um die Uhr.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {PROBLEM_MOMENTS.map((m) => (
            <span key={m.label} className="flex items-center gap-2 text-sm text-ink-soft">
              <m.icon className="h-4 w-4 text-bronze" /> {m.label}
            </span>
          ))}
        </div>
      </section>

      <section id="so-funktionierts" className="border-y border-border/70 bg-cream-soft/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">So einfach funktioniert HalloMia</h2>
            <p className="mt-3 text-ink-soft">Vom Anruf bis zur Zusammenfassung — ohne dass du etwas tun musst.</p>
          </div>
          <div className="relative mt-14 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
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

          <div className="mx-auto mt-16 max-w-3xl space-y-4">
            <p className="text-center text-sm font-medium text-ink-faint uppercase tracking-wide">Live-Beispiel</p>
            <VoiceDemoPlayer />
            <DemoAnimation />
          </div>
        </div>
      </section>

      <section id="funktionen" className="bg-cream-soft/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">Kalender + Telefon + Termin + Kunde</h2>
            <p className="mt-3 text-ink-soft">
              Keine überladene Software mit hundert Funktionen. HalloMia konzentriert sich auf das, was im Alltag
              wirklich zählt.
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
          <h2 className="font-display text-3xl text-ink sm:text-4xl">Warum Unternehmen HalloMia lieben</h2>
          <p className="mt-3 text-ink-soft">Nicht nur ein Feature mehr — spürbar mehr Ruhe im Alltag.</p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delayMs={i * 60}>
              <div className="h-full rounded-2xl border border-border bg-white/[0.03] p-5 text-center backdrop-blur-sm sm:p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-bronze/30 bg-bronze-soft text-bronze-dark">
                  <b.icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h3 className="mt-3 font-display text-sm leading-snug text-ink sm:text-base">{b.title}</h3>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="branchen" className="border-y border-border/70 bg-cream-soft/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">Für jede Branche mit Terminen</h2>
            <p className="mt-3 text-ink-soft">
              HalloMia passt sich deinem Unternehmen an — nicht umgekehrt. Eine kleine Auswahl der Branchen, für die
              HalloMia bereits arbeitet.
            </p>
          </div>
          <div className="mt-12">
            <Industries />
          </div>
        </div>
      </section>

      <SocialProof />

      <Pricing />

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="font-display text-2xl text-ink sm:text-3xl">
            Mia arbeitet im Hintergrund für dich – damit du mehr Zeit für deine Kunden und dein eigentliches
            Geschäft hast.
          </p>
        </Reveal>
      </section>

      <section id="faq" className="border-t border-border/70 bg-cream-soft/50">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">Häufige Fragen</h2>
            <p className="mt-3 text-ink-soft">Was Unternehmer:innen uns am häufigsten fragen.</p>
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
              Lass Mia deinen nächsten Anruf übernehmen.
              <Sparkles className="h-5 w-5 text-gold" />
            </p>
            <p className="mx-auto mt-3 max-w-md text-cream/70">
              Teste HalloMia jetzt risikofrei und überzeuge dich selbst — ich richte deinen Assistenten persönlich
              ein.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="#preise" variant="bronze" size="lg">
                HalloMia testen
              </LinkButton>
              <LinkButton href="#so-funktionierts" variant="outline" size="lg" className="border-cream/30 text-cream hover:bg-cream/10">
                Demo ansehen
              </LinkButton>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="border-t border-border/70 bg-cream-soft/40 px-4 py-4 text-center text-sm text-ink-soft sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2">
          <Heart className="h-4 w-4 text-gold" strokeWidth={1.5} />
          HalloMia — deine KI-Assistentin für Anrufe, Termine und Kundenanfragen, für jede Branche.
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
