import { Lock } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { adminLoginAction } from "@/lib/auth/actions";
import { Logo } from "@/components/brand/logo";

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "Dieses Konto hat keinen Zugriff auf den Admin-Bereich.",
  no_salon: "Für dieses Konto ist kein Salon hinterlegt.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size="xl" />
        </div>
        <div className="rounded-2xl border border-border bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="text-center">
            <h1 className="font-display text-2xl text-ink">Willkommen zurück</h1>
            <p className="mt-2 text-sm text-ink-soft">Betreiber-Login für den HalloMia-Admin-Bereich.</p>
          </div>
          {error && (
            <p className="mt-5 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {ERROR_MESSAGES[error] ?? "Anmeldung fehlgeschlagen. Bitte erneut versuchen."}
            </p>
          )}
          <div className="mt-6">
            <LoginForm action={adminLoginAction} submitLabel="Anmelden" />
          </div>
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-faint">
          <Lock className="h-3.5 w-3.5" /> Nur für Betreiber-Konten von HalloMia
        </p>
      </div>
    </div>
  );
}
