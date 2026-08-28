"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Input, Label, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  createCompanyOnboardingAction,
  updateCompanyBasicsAction,
  type OnboardingActionState,
} from "@/lib/actions/onboarding";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CompanyStep({
  salonId,
  initialName,
  initialSlug,
  onSaved,
}: {
  salonId: string | null;
  initialName: string;
  initialSlug: string;
  onSaved: () => void;
}) {
  const action = salonId ? updateCompanyBasicsAction.bind(null, salonId) : createCompanyOnboardingAction;
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(action, null);
  const [name, setName] = useState(initialName);
  const [slugOverride, setSlugOverride] = useState<string | null>(initialSlug || null);
  const slug = slugOverride ?? slugify(name);
  const savedOnceFor = useRef<OnboardingActionState>(null);

  useEffect(() => {
    if (state?.ok && state !== savedOnceFor.current) {
      savedOnceFor.current = state;
      onSaved();
    }
  }, [state, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-ink-soft">
        Wie heißt dein Unternehmen? Der Kurzname ist deine interne HalloMia-Kennung und kann später weiterhin geändert werden.
      </p>
      <div>
        <Label htmlFor="name">Name des Unternehmens</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Hair Lounge Milano"
        />
      </div>
      <div>
        <Label htmlFor="slug">Kurzname</Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => setSlugOverride(e.target.value)}
          placeholder="hair-lounge-milano"
        />
      </div>
      <FieldError>{state?.error}</FieldError>
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" variant="bronze" disabled={pending}>
          {pending ? "Wird gespeichert…" : salonId ? "Speichern & weiter" : "Unternehmen anlegen"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
