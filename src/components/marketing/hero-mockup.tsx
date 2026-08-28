import { PhoneIncoming, Sparkles, CalendarCheck, CheckCircle2 } from "lucide-react";

// Hand-built UI mockup (no screenshot) showing the core HalloMia loop:
// an incoming call, the AI-generated conversation summary, and the
// resulting appointment landing in the calendar - kept industry-neutral
// on purpose so it works for the hero regardless of which business type
// a visitor has in mind.
export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden
        className="brand-gradient-bg absolute -inset-4 -z-10 rounded-[2rem] opacity-20 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute -right-3 -bottom-3 h-full w-full rounded-3xl border border-border bg-white/[0.03] sm:-right-4 sm:-bottom-4"
      />

      <div className="relative overflow-hidden rounded-3xl border border-border bg-cream-soft shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bronze text-white">
              <PhoneIncoming className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Eingehender Anruf</p>
              <p className="text-xs text-ink-faint">+49 30 555 0142 · Bestandskundin erkannt</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-[11px] text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            02:14
          </span>
        </div>

        <div className="border-b border-border/70 px-5 py-4">
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-faint uppercase">
            <Sparkles className="h-3.5 w-3.5 text-bronze" /> Gesprächszusammenfassung
          </p>
          <ul className="mt-2.5 space-y-1.5 text-sm text-ink-soft">
            <li>
              <span className="text-ink-faint">Anliegen: </span>Terminanfrage für ein Beratungsgespräch
            </li>
            <li>
              <span className="text-ink-faint">Wunschtermin: </span>Donnerstag, nachmittags
            </li>
            <li>
              <span className="text-ink-faint">Rückfrage: </span>Keine – Anfrage vollständig
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 bg-success-soft/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
              <CalendarCheck className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Termin automatisch gebucht</p>
              <p className="text-xs text-ink-faint">Donnerstag, 14:00–14:30 Uhr</p>
            </div>
          </div>
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        </div>
      </div>
    </div>
  );
}
