import { LoginForm } from "@/components/auth/login-form";
import { salonLoginAction } from "@/lib/auth/actions";

export default function SalonLoginPage() {
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
          <LoginForm action={salonLoginAction} submitLabel="Anmelden" />
        </div>
        <p className="mt-6 text-center text-xs text-ink-faint">
          Zugangsdaten erhältst du von deinem SalonCall-Ansprechpartner.
        </p>
      </div>
    </div>
  );
}
