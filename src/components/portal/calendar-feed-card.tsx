"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Copy, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateCalendarFeedUrlAction, regenerateCalendarFeedUrlAction } from "@/lib/actions/calendar-feed";

export function CalendarFeedCard() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [urls, setUrls] = useState<{ url: string; webcalUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function open_() {
    setOpen(true);
    if (loaded) return;
    startTransition(async () => {
      const result = await getOrCreateCalendarFeedUrlAction();
      if (result.ok) {
        setUrls({ url: result.url, webcalUrl: result.webcalUrl });
      } else {
        setError(result.error);
      }
      setLoaded(true);
    });
  }

  function regenerate() {
    if (!confirm("Neuen Link erzeugen? Der alte Link funktioniert danach nicht mehr - du musst das Kalender-Abo dann auf deinem Handy neu einrichten.")) return;
    setError(null);
    startTransition(async () => {
      const result = await regenerateCalendarFeedUrlAction();
      if (result.ok) {
        setUrls({ url: result.url, webcalUrl: result.webcalUrl });
        setCopied(false);
      } else {
        setError(result.error);
      }
    });
  }

  function copy() {
    if (!urls) return;
    navigator.clipboard.writeText(urls.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-border bg-cream-soft/60 mx-4 mt-3 sm:mx-6 lg:mx-8">
      <button
        onClick={() => (open ? setOpen(false) : open_())}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-ink"
      >
        <span className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-bronze" /> Termine im Handy-Kalender abonnieren
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-ink-faint" /> : <ChevronDown className="h-4 w-4 text-ink-faint" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          <p className="text-xs text-ink-soft">
            Einmal einrichten, dann tauchen alle Termine (auch von der KI gebuchte) automatisch in deiner bestehenden
            Kalender-App auf - iPhone: Einstellungen → Kalender → Account hinzufügen → Andere → Kalenderabo hinzufügen.
            Android/Google Kalender: Weitere Kalender → Per URL.
          </p>

          {pending && !loaded && <p className="text-xs text-ink-faint">Wird geladen…</p>}
          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>}

          {urls && (
            <>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-sand px-3 py-2 text-xs text-ink-soft">{urls.url}</code>
                <button onClick={copy} className="rounded-lg p-2 text-ink-soft hover:bg-sand" title="Kopieren">
                  {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a href={urls.webcalUrl}>
                  <Button variant="gradient" size="sm">
                    Auf dem Handy öffnen
                  </Button>
                </a>
                <Button variant="ghost" size="sm" onClick={regenerate} disabled={pending}>
                  <RefreshCw className="h-3.5 w-3.5" /> Neuen Link erzeugen
                </Button>
              </div>
              <p className="text-xs text-ink-faint">
                Nur lesend (Termine tauchen im Handy-Kalender auf, Änderungen dort werden nicht zu uns übertragen).
                Aktualisiert sich automatisch, meist innerhalb einer Stunde.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
