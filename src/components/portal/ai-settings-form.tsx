"use client";

import { useActionState, useState, useTransition } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  updateSalonVoiceSettingsAction,
  syncActiveVoiceAgentAction,
  type AiSettingsActionState,
} from "@/lib/actions/salon-voice-settings";
import type { Tables } from "@/lib/supabase/database.types";

const RULES: { key: keyof Pick<Tables<"voice_settings">, "mention_prices" | "offer_alternatives" | "respect_employee_preference" | "offer_callback" | "detect_new_customers" | "send_confirmation_sms" | "emergency_redirect">; label: string }[] = [
  { key: "mention_prices", label: "Preise nennen" },
  { key: "offer_alternatives", label: "Alternativtermine anbieten" },
  { key: "respect_employee_preference", label: "Mitarbeiterwunsch beachten" },
  { key: "offer_callback", label: "Rückruf anbieten" },
  { key: "detect_new_customers", label: "Neukunden erkennen" },
  { key: "send_confirmation_sms", label: "Terminbestätigung per SMS" },
  { key: "emergency_redirect", label: "Bei Notfällen auf Notruf/Notdienst hinweisen" },
];

export function AiSettingsForm({ settings }: { settings: Tables<"voice_settings"> | null }) {
  const [state, formAction, pending] = useActionState<AiSettingsActionState, FormData>(updateSalonVoiceSettingsAction, null);
  const [showCancellationHours, setShowCancellationHours] = useState(settings?.mention_cancellation_policy ?? false);

  const [retryPending, startRetry] = useTransition();
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retried, setRetried] = useState(false);

  const hasAgent = Boolean(settings?.provider === "elevenlabs" ? settings?.elevenlabs_agent_id : settings?.provider_agent_id);

  function retrySync() {
    setRetryError(null);
    setRetried(false);
    startRetry(async () => {
      const result = await syncActiveVoiceAgentAction();
      if (result.ok) {
        setRetried(true);
      } else {
        setRetryError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <div>
          <Label htmlFor="greeting">Begrüßung</Label>
          <Textarea id="greeting" name="greeting" rows={3} defaultValue={settings?.greeting ?? ""} required />
        </div>

        <div>
          <Label htmlFor="personality">Persönlichkeit</Label>
          <Select id="personality" name="personality" defaultValue={settings?.personality ?? "freundlich"}>
            <option value="freundlich">Freundlich</option>
            <option value="professionell">Professionell</option>
            <option value="locker">Locker</option>
            <option value="elegant">Elegant</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="custom_prompt">Zusätzliche Informationen für deine KI</Label>
          <Textarea
            id="custom_prompt"
            name="custom_prompt"
            rows={6}
            defaultValue={settings?.custom_prompt ?? ""}
            placeholder="z. B. besondere Angebote, Hausregeln, Parkhinweise, was dein Betrieb sonst noch wissen sollte..."
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            Wird zusätzlich zu den festen Grundregeln genutzt (Terminbuchung, Kundenerkennung usw. funktionieren
            weiterhin unverändert) - hiermit gibst du deiner KI nur branchenspezifisches Wissen über dein Geschäft mit.
          </p>
        </div>

        <div>
          <Label>Regeln</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RULES.map((r) => (
              <label key={r.key} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  name={r.key}
                  defaultChecked={settings?.[r.key] ?? (r.key === "emergency_redirect" ? false : true)}
                  className="rounded border-border-strong"
                />
                {r.label}
              </label>
            ))}
            <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="mention_cancellation_policy"
                defaultChecked={settings?.mention_cancellation_policy ?? false}
                onChange={(e) => setShowCancellationHours(e.target.checked)}
                className="rounded border-border-strong"
              />
              Stornofrist nennen
            </label>
          </div>
          {showCancellationHours ? (
            <div className="mt-2 max-w-[220px]">
              <Label htmlFor="cancellation_notice_hours">Stornofrist (Stunden vorher)</Label>
              <input
                id="cancellation_notice_hours"
                name="cancellation_notice_hours"
                type="number"
                min={1}
                max={168}
                defaultValue={settings?.cancellation_notice_hours ?? 24}
                className="w-full rounded-lg border border-border-strong bg-sand px-3 h-10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze"
              />
            </div>
          ) : (
            <input type="hidden" name="cancellation_notice_hours" value={settings?.cancellation_notice_hours ?? 24} />
          )}
        </div>

        <div>
          <Label htmlFor="required_documents">Mitzubringendes (optional)</Label>
          <input
            id="required_documents"
            name="required_documents"
            defaultValue={settings?.required_documents ?? ""}
            placeholder="z. B. Überweisung, Ausweis, Impfpass"
            className="w-full rounded-lg border border-border-strong bg-sand px-3 h-10 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze"
          />
          <p className="mt-1.5 text-xs text-ink-faint">Wird bei jeder Buchung freundlich erwähnt, wenn ausgefüllt.</p>
        </div>

        <FieldError>{state?.error}</FieldError>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="gradient" disabled={pending}>
            <UploadCloud className="h-4 w-4" />
            {pending ? "Wird gespeichert und übertragen…" : "Speichern & übertragen"}
          </Button>
          {state?.ok && !state.syncWarning && (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Gespeichert und live übertragen.
            </span>
          )}
        </div>
        <p className="text-xs text-ink-faint">
          Ein Klick speichert deine Änderungen und schickt sie sofort an deinen Telefonassistenten - {hasAgent ? "keine weiteren Schritte nötig" : "beim ersten Mal wird dabei auch der Assistent angelegt"}.
        </p>
      </form>

      {state?.ok && state.syncWarning && (
        <div className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 space-y-2">
          <p className="text-sm text-ink">Gespeichert. {state.syncWarning}</p>
          <Button variant="gradient" size="sm" onClick={retrySync} disabled={retryPending}>
            {retryPending ? "Wird erneut versucht…" : "Erneut versuchen"}
          </Button>
          {retryError && <p className="text-sm text-danger">{retryError}</p>}
          {retried && (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Übertragen.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
