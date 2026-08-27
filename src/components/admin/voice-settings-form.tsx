"use client";

import { useActionState, useState } from "react";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateVoiceSettingsAction } from "@/lib/actions/voice-settings";
import type { ActionState } from "@/lib/actions/admin";
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

const ELEVENLABS_VOICES = [
  { id: "itBlUwkHD8mtjbyJyCuC", label: "Lena (ElevenLabs, deutsch, weiblich)" },
  { id: "Zgahiwh5FVSG7MFjZwPE", label: "Anny (ElevenLabs, deutsch, weiblich)" },
];

export function VoiceSettingsForm({ salonId, settings }: { salonId: string; settings: Tables<"voice_settings"> | null }) {
  const action = updateVoiceSettingsAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const [showCancellationHours, setShowCancellationHours] = useState(settings?.mention_cancellation_policy ?? false);

  const savedElevenLabsId = settings?.elevenlabs_voice_id ?? "";
  const knownElevenLabsIds = ELEVENLABS_VOICES.map((v) => v.id);
  const [elevenLabsChoice, setElevenLabsChoice] = useState(
    savedElevenLabsId && knownElevenLabsIds.includes(savedElevenLabsId)
      ? savedElevenLabsId
      : savedElevenLabsId
        ? "custom"
        : ELEVENLABS_VOICES[0].id
  );

  return (
    <form action={formAction} className="space-y-5">
      {/* ElevenLabs ist der einzige sichtbare Anbieter - provider/voice_id (Retell)
          laufen als feste Hidden-Fields weiter, damit bestehende Spalten (NOT NULL)
          und der Retell-Resync im Hintergrund unverändert funktionieren. */}
      <input type="hidden" name="provider" value="elevenlabs" />
      <input type="hidden" name="voice_id" value={settings?.voice_id ?? "cartesia-Eva"} />

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
        <Label htmlFor="elevenlabs_voice_select">Stimme</Label>
        <Select
          id="elevenlabs_voice_select"
          value={elevenLabsChoice}
          onChange={(e) => setElevenLabsChoice(e.target.value)}
        >
          {ELEVENLABS_VOICES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
          <option value="custom">Andere (Voice-ID manuell einfügen)</option>
        </Select>
        {elevenLabsChoice === "custom" ? (
          <Input
            className="mt-2"
            name="elevenlabs_voice_id"
            defaultValue={knownElevenLabsIds.includes(savedElevenLabsId) ? "" : savedElevenLabsId}
            placeholder="Voice-ID aus der ElevenLabs-Stimmbibliothek einfügen"
          />
        ) : (
          <input type="hidden" name="elevenlabs_voice_id" value={elevenLabsChoice} />
        )}
      </div>

      <div>
        <Label htmlFor="greeting">Begrüßung</Label>
        <Textarea id="greeting" name="greeting" rows={3} defaultValue={settings?.greeting ?? ""} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="phone_number">Telefonnummer (HalloMia)</Label>
          <Input id="phone_number" name="phone_number" defaultValue={settings?.phone_number ?? ""} placeholder="+49 30 1234567" />
        </div>
        <div>
          <Label htmlFor="forwarding_number">Weiterleitung bei Rückfragen</Label>
          <Input id="forwarding_number" name="forwarding_number" defaultValue={settings?.forwarding_number ?? ""} placeholder="+49 30 7654321" />
        </div>
      </div>

      <div>
        <Label>Regeln</Label>
        <div className="grid grid-cols-2 gap-2">
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
            <Input
              id="cancellation_notice_hours"
              name="cancellation_notice_hours"
              type="number"
              min={1}
              max={168}
              defaultValue={settings?.cancellation_notice_hours ?? 24}
            />
          </div>
        ) : (
          <input type="hidden" name="cancellation_notice_hours" value={settings?.cancellation_notice_hours ?? 24} />
        )}
      </div>

      <div>
        <Label htmlFor="required_documents">Mitzubringendes (optional)</Label>
        <Input
          id="required_documents"
          name="required_documents"
          defaultValue={settings?.required_documents ?? ""}
          placeholder="z. B. Überweisung, Ausweis, Impfpass"
        />
      </div>

      <FieldError>{state?.error}</FieldError>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="bronze" disabled={pending}>
          {pending ? "Wird gespeichert…" : "Speichern"}
        </Button>
        {state?.ok && <span className="text-sm text-success">Gespeichert.</span>}
      </div>
    </form>
  );
}
