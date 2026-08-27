"use client";

import { useActionState, useState } from "react";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateVoiceSettingsAction } from "@/lib/actions/voice-settings";
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

const ELEVENLABS_VOICES = [
  { id: "itBlUwkHD8mtjbyJyCuC", label: "Lena (ElevenLabs, deutsch, weiblich)" },
  { id: "Zgahiwh5FVSG7MFjZwPE", label: "Anny (ElevenLabs, deutsch, weiblich)" },
];

export function VoiceSettingsForm({ salonId, settings }: { salonId: string; settings: Tables<"voice_settings"> | null }) {
  const action = updateVoiceSettingsAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

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
      <div>
        <Label htmlFor="provider">Aktiver Anbieter</Label>
        <Select id="provider" name="provider" defaultValue={settings?.provider ?? "retell"}>
          <option value="retell">Retell (live)</option>
          <option value="elevenlabs">ElevenLabs (Test)</option>
        </Select>
        <p className="mt-1 text-xs text-ink-faint">
          Legt nur fest, welcher Anbieter beim täglichen automatischen Resync als &bdquo;der echte&ldquo; behandelt
          wird. Beide Agenten können unabhängig davon jederzeit unten manuell synchronisiert werden.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="voice_id">Stimme (Retell)</Label>
          <Select id="voice_id" name="voice_id" defaultValue={settings?.voice_id ?? "cartesia-Eva"}>
            <option value="cartesia-Eva">Eva (Cartesia)</option>
            <option value="11labs-Carola">Carola (ElevenLabs, deutsch, weiblich)</option>
            <option value="11labs-Claudia">Claudia (ElevenLabs, deutsch, weiblich)</option>
            <option value="11labs-Gaby">Gaby (ElevenLabs, deutsch, weiblich)</option>
          </Select>
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
      </div>

      <div>
        <Label htmlFor="elevenlabs_voice_select">Stimme (ElevenLabs, Test)</Label>
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
              <input type="checkbox" name={r.key} defaultChecked={settings?.[r.key] ?? true} className="rounded border-border-strong" />
              {r.label}
            </label>
          ))}
        </div>
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
