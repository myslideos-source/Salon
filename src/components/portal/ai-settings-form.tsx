"use client";

import { useActionState, useState, useTransition } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateSalonVoiceSettingsAction, syncActiveVoiceAgentAction } from "@/lib/actions/salon-voice-settings";
import type { ActionState } from "@/lib/actions/admin";
import type { Tables } from "@/lib/supabase/database.types";

const RULES: { key: keyof Pick<Tables<"voice_settings">, "mention_prices" | "offer_alternatives" | "respect_employee_preference" | "offer_callback" | "detect_new_customers" | "send_confirmation_sms">; label: string }[] = [
  { key: "mention_prices", label: "Preise nennen" },
  { key: "offer_alternatives", label: "Alternativtermine anbieten" },
  { key: "respect_employee_preference", label: "Mitarbeiterwunsch beachten" },
  { key: "offer_callback", label: "Rückruf anbieten" },
  { key: "detect_new_customers", label: "Neukunden erkennen" },
  { key: "send_confirmation_sms", label: "Terminbestätigung per SMS" },
];

export function AiSettingsForm({ settings }: { settings: Tables<"voice_settings"> | null }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateSalonVoiceSettingsAction, null);

  const [syncPending, startSync] = useTransition();
  const [agentId, setAgentId] = useState(
    settings?.provider === "elevenlabs" ? settings?.elevenlabs_agent_id ?? null : settings?.provider_agent_id ?? null
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  function sync() {
    setSyncError(null);
    setSynced(false);
    startSync(async () => {
      const result = await syncActiveVoiceAgentAction();
      if (result.ok) {
        setAgentId(result.agentId);
        setSynced(true);
      } else {
        setSyncError(result.error);
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
                <input type="checkbox" name={r.key} defaultChecked={settings?.[r.key] ?? true} className="rounded border-border-strong" />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <FieldError>{state?.error}</FieldError>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="gradient" disabled={pending}>
            {pending ? "Wird gespeichert…" : "Speichern"}
          </Button>
          {state?.ok && <span className="text-sm text-success">Gespeichert.</span>}
        </div>
      </form>

      <div className="rounded-xl border border-border bg-cream-soft/60 p-4 space-y-3">
        <p className="text-sm font-medium text-ink">An deine KI übertragen</p>
        <p className="text-xs text-ink-faint">
          Speichere zuerst deine Änderungen oben, dann überträgt dieser Schritt sie an deinen Telefonassistenten.
        </p>
        {agentId && (
          <p className="flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Bereits übertragen
          </p>
        )}
        {syncError && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{syncError}</p>}
        <Button variant="gradient" onClick={sync} disabled={syncPending}>
          <UploadCloud className="h-4 w-4" />
          {syncPending ? "Wird übertragen…" : "Übertragen"}
        </Button>
        {synced && <p className="text-sm text-success">Übertragen.</p>}
      </div>
    </div>
  );
}
