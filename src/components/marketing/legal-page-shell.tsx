import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function LegalPageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/70 bg-cream/85">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo size="lg" />
          <Link href="/" className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Zur Startseite
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
          <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">{children}</div>
        </div>
      </main>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 text-sm text-ink-faint sm:px-6">
          <p>© {new Date().getFullYear()} HalloMia.</p>
          <nav className="flex items-center gap-5">
            <Link href="/impressum" className="hover:text-ink">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-ink">Datenschutz</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
