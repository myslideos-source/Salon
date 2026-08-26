"use client";

import { useActionState } from "react";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateVoiceSettingsAction } from "@/lib/actions/voice-settings";
import type { ActionState } from "@/lib/actions/admin";
import type { Tables } from "@/lib/supabase/database.types";

const RULES: { key: keyof Pick<Tables<"voice_settings">, "mention_prices" | "offer_alternatives" | "respect_employee_preference" | "offer_callback" | "detect_new_customers">; label: string }[] = [
  { key: "mention_prices", label: "Preise nennen" },
  { key: "offer_alternatives", label: "Alternativtermine anbieten" },
  { key: "respect_employee_preference", label: "Mitarbeiterwunsch beachten" },
  { key: "offer_callback", label: "Rückruf anbieten" },
  { key: "detect_new_customers", label: "Neukunden erkennen" },
];

export function VoiceSettingsForm({ salonId, settings }: { salonId: string; settings: Tables<"voice_settings"> | null }) {
  const action = updateVoiceSettingsAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="voice_id">Stimme</Label>
          <Select id="voice_id" name="voice_id" defaultValue={settings?.voice_id ?? "11labs-Carola"}>
            <option value="11labs-Carola">Carola (deutsch, weiblich)</option>
            <option value="11labs-Claudia">Claudia (deutsch, weiblich)</option>
            <option value="11labs-Gaby">Gaby (deutsch, weiblich)</option>
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
        <Label htmlFor="greeting">Begrüßung</Label>
        <Textarea id="greeting" name="greeting" rows={3} defaultValue={settings?.greeting ?? ""} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="phone_number">Telefonnummer (SalonCall)</Label>
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
