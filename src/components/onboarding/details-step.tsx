"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveCompanyDetailsAction, type OnboardingActionState } from "@/lib/actions/onboarding";

export function DetailsStep({
  salonId,
  initialPhone,
  initialAddress,
  initialTimezone,
  onBack,
}: {
  salonId: string;
  initialPhone: string;
  initialAddress: string;
  initialTimezone: string;
  onBack: () => void;
}) {
  const boundAction = saveCompanyDetailsAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(boundAction, null);

  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [timezone, setTimezone] = useState(initialTimezone || "Europe/Berlin");
  const [, startAutosave] = useTransition();
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const skipAutosave = useRef(true);

  // Autospeicherung der Unternehmensdaten nach kurzer Inaktivität — der
  // endgültige Abschluss von Schritt 3 (mit Weiterleitung ins Dashboard)
  // läuft separat über den regulären Formular-Submit unten.
  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const fd = new FormData();
      fd.set("phone", phone);
      fd.set("address", address);
      fd.set("timezone", timezone);
      fd.set("advance", "false");
      startAutosave(async () => {
        const result = await saveCompanyDetailsAction(salonId, null, fd);
        if (result?.error) setAutosaveError(result.error);
        else {
          setAutosaveError(null);
          setSavedAt(Date.now());
        }
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [phone, address, timezone, salonId]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="advance" value="true" />
      <p className="text-sm text-ink-soft">
        Diese Angaben nutzt Mia am Telefon und zeigt sie im Kalender — du kannst sie jederzeit unter „Einstellungen&quot; ändern.
      </p>
      <div>
        <Label htmlFor="phone">Telefonnummer</Label>
        <Input id="phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 30 1234567" />
      </div>
      <div>
        <Label htmlFor="address">Adresse</Label>
        <Textarea id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Musterstraße 1, 10115 Berlin" />
      </div>
      <div>
        <Label htmlFor="timezone">Zeitzone</Label>
        <Input id="timezone" name="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
      </div>
      <FieldError>{state?.error ?? autosaveError}</FieldError>
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <div className="flex items-center gap-3">
          {!autosaveError && savedAt && <span className="text-xs text-ink-faint">Automatisch gespeichert</span>}
          <Button type="submit" variant="bronze" disabled={pending}>
            {pending ? "Wird gespeichert…" : "Fertig für jetzt"} <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
