"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { updateRecordingConsentAction } from "@/lib/actions/calls";

/**
 * Rechtliche Aktivierung der Audioaufzeichnung (Konzeptabschnitt "Telefonie
 * und Integrationen"): "Aktiviere Audioaufzeichnung nicht automatisch."
 * Kommt niemals vorausgewählt an (initialEnabled ist der echte,
 * default-false-Spaltenwert) — das Unternehmen muss aktiv bestätigen, dass
 * es die rechtlichen Voraussetzungen (z. B. Hinweis in der Ansage,
 * Einwilligung) selbst sicherstellt, bevor überhaupt eine Aufnahme-URL
 * gespeichert wird (siehe finalizeCall/attachRecording in call-ingest.ts,
 * die recording_url ohne dieses Flag gar nicht erst übernehmen).
 */
export function RecordingConsentCard({
  salonId,
  initialEnabled,
  revalidatePath,
}: {
  salonId: string;
  initialEnabled: boolean;
  revalidatePath: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !enabled;
    setError(null);
    setEnabled(next);
    startTransition(async () => {
      try {
        await updateRecordingConsentAction(salonId, next, revalidatePath);
      } catch (e) {
        setEnabled(!next);
        setError(e instanceof Error ? e.message : "Fehler beim Speichern.");
      }
    });
  }

  return (
    <Card>
      <CardHeader
        title="Audioaufzeichnung"
        subtitle="Rechtlich abzusichern durch dein Unternehmen (z. B. Hinweis in der Begrüßung, Einwilligung der Anrufenden)."
      />
      <div className="flex items-start justify-between gap-3 p-5 pt-4">
        <div className="flex items-start gap-2.5">
          {enabled ? (
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          ) : (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
          )}
          <div>
            <p className="text-sm text-ink">{enabled ? "Aufzeichnung aktiviert" : "Aufzeichnung deaktiviert"}</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {enabled
                ? "Gespräche können mit Audioaufnahme gespeichert werden, sofern der Telefonieanbieter das unterstützt."
                : "Standardmäßig aus. Es wird keine Audioaufnahme gespeichert, auch wenn der Anbieter eine anbietet."}
            </p>
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={pending}
          role="switch"
          aria-checked={enabled}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${enabled ? "bg-success" : "bg-border-strong"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
    </Card>
  );
}
