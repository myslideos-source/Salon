"use client";

import { useActionState } from "react";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { LoginState } from "@/lib/auth/actions";

export function LoginForm({
  action,
  submitLabel,
}: {
  action: (prev: LoginState, formData: FormData) => Promise<LoginState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="du@salon.de" />
      </div>
      <div>
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <Button type="submit" variant="bronze" size="lg" className="w-full" disabled={pending}>
        {pending ? "Anmelden…" : submitLabel}
      </Button>
    </form>
  );
}
