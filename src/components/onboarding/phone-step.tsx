"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, PhoneCall, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { advanceOnboardingStepAction } from "@/lib/actions/onboarding";

const PROVIDER_LABEL: Record<string, string> = { retell: "Retell AI", elevenlabs: "ElevenLabs", twilio: "Twilio" };

/**
 * Schritt 11 "Telefonnummer verbinden". Die eigentliche Verbindung einer
 * echten Telefonnummer (Nummer kaufen/portieren, beim Anbieter
 * hinterlegen) ist kein Self-Service-Formularfeld, sondern ein
 * Einrichtungsschritt gemeinsam mit dem HalloMia-Team bzw. über die
 * technische Anbieter-Konfiguration (siehe admin Salon-Seite "KI") —
 * genau wie die übrigen technischen/abrechnungsrelevanten Felder in
 * voice_settings (phone_number, provider_*) bleibt das bewusst
 * Admin-only (siehe RLS 0002). Dieser Schritt zeigt deshalb den echten,
 * aktuellen Verbindungsstatus statt eines vorgetäuschten
 * Selbstverbindungs-Formulars ("zeige einen ehrlichen Einrichtungsstatus
 * statt vorgetäuschter Funktion").
 */
export function PhoneStep({
  salonId,
  phoneNumber,
  provider,
  onSaved,
  onBack,
}: {
  salonId: string;
  phoneNumber: string | null;
  provider: string | null;
  onSaved: () => void;
  onBack: () => void;
}) {
  const [finishing, startFinishing] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const connected = Boolean(phoneNumber);

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        Damit Mia echte Anrufe entgegennehmen kann, braucht dein Unternehmen eine eigene Telefonnummer bei einem
        Sprach-KI-Anbieter (Retell AI, ElevenLabs oder Twilio). Das richten wir gemeinsam mit dir ein.
      </p>

      {connected ? (
        <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-soft p-4 text-sm text-success">
          <PhoneCall className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Telefonnummer verbunden</p>
            <p className="mt-0.5 text-success/80">
              {phoneNumber} {provider && PROVIDER_LABEL[provider] ? `· über ${PROVIDER_LABEL[provider]}` : ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-ink">
          <PhoneOff className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="font-medium">Noch keine Telefonnummer verbunden</p>
            <p className="mt-0.5 text-ink-soft">
              Ohne verbundene Nummer läuft Mia im Demo-Modus — du kannst sie trotzdem jederzeit im Testchat unter
              „Meine Mia&rdquo; ausprobieren. Melde dich bei uns, um eine echte Telefonnummer einzurichten:{" "}
              <a href="mailto:support@saloncall.ai" className="font-medium text-bronze-dark hover:underline">
                support@saloncall.ai
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onBack} disabled={finishing}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <Button
          type="button"
          variant="bronze"
          disabled={finishing}
          onClick={() =>
            startFinishing(async () => {
              try {
                await advanceOnboardingStepAction(salonId, 12);
                onSaved();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Fehler beim Speichern.");
              }
            })
          }
        >
          {finishing ? "Wird gespeichert…" : "Weiter"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
