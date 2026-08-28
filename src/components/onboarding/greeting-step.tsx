"use client";

import { useActionState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveGreetingStepAction } from "@/lib/actions/onboarding";
import type { OnboardingActionState } from "@/lib/actions/onboarding";

export function GreetingStep({
  salonId,
  initialAssistantName,
  initialGreeting,
  initialPersonality,
  initialFormality,
  initialDescription,
  onSaved,
  onBack,
}: {
  salonId: string;
  initialAssistantName: string;
  initialGreeting: string;
  initialPersonality: string;
  initialFormality: string;
  initialDescription: string;
  onSaved: () => void;
  onBack: () => void;
}) {
  const boundAction = saveGreetingStepAction.bind(null, salonId);
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(async (prev, formData) => {
    const result = await boundAction(prev, formData);
    if (result?.ok) onSaved();
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-ink-soft">
        So stellt sich Mia am Telefon vor. Weitere Regeln und Sprachen kannst du später jederzeit unter „Meine Mia&quot; anpassen.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="assistant_name">Name der Assistentin</Label>
          <Input id="assistant_name" name="assistant_name" defaultValue={initialAssistantName} required maxLength={60} />
        </div>
        <div>
          <Label htmlFor="formality">Ansprache</Label>
          <Select id="formality" name="formality" defaultValue={initialFormality}>
            <option value="sie">Sie (förmlich)</option>
            <option value="du">Du (locker)</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="greeting">Begrüßung</Label>
        <Textarea id="greeting" name="greeting" rows={3} defaultValue={initialGreeting} required />
      </div>
      <div>
        <Label htmlFor="personality">Tonalität</Label>
        <Select id="personality" name="personality" defaultValue={initialPersonality}>
          <option value="freundlich">Freundlich und locker</option>
          <option value="professionell">Professionell</option>
          <option value="locker">Herzlich</option>
          <option value="elegant">Seriös</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Unternehmensbeschreibung (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initialDescription}
          placeholder="Kurze Beschreibung deines Unternehmens, die Mia als Grundlage nennen darf."
          maxLength={1000}
        />
      </div>
      <FieldError>{state?.error}</FieldError>
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <Button type="submit" variant="bronze" disabled={pending}>
          {pending ? "Wird gespeichert…" : "Weiter"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
