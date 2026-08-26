import { LoginForm } from "@/components/auth/login-form";
import { salonLoginAction } from "@/lib/auth/actions";

const ERROR_MESSAGES: Record<string, string> = {
  no_salon: "Für dieses Konto ist kein Salon hinterlegt. Bitte wende dich an deinen SalonCall-Ansprechpartner.",
};

export default async function SalonLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl text-ink">
            SalonCall <span className="text-bronze">AI</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">Salon-Login</p>
        </div>
        <div className="rounded-2xl border border-border bg-white/70 p-6 shadow-sm">
          {error && (
            <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {ERROR_MESSAGES[error] ?? "Anmeldung fehlgeschlagen. Bitte erneut versuchen."}
            </p>
          )}
          <LoginForm action={salonLoginAction} submitLabel="Anmelden" />
        </div>
        <p className="mt-6 text-center text-xs text-ink-faint">
          Zugangsdaten erhältst du von deinem SalonCall-Ansprechpartner.
        </p>
      </div>
    </div>
  );
}
