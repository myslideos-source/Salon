"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hallomia_cookie_notice_dismissed";

// HalloMia only sets technically necessary cookies (the Supabase login
// session) - no analytics/marketing scripts anywhere in the app - so this
// is an informational notice rather than a consent-with-choices banner.
// See /datenschutz for the full breakdown.
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage, a browser-only API not available during SSR
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode etc.) - just skip the notice.
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-cream/95 px-4 py-4 shadow-[0_-2px_12px_rgba(11,20,54,0.08)] backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-ink-soft">
          Diese Website verwendet ausschließlich technisch notwendige Cookies (z. B. für den Login) - keine Tracking-
          oder Marketing-Cookies. Details in der{" "}
          <Link href="/datenschutz" className="text-bronze-dark hover:underline">
            Datenschutzerklärung
          </Link>
          .
        </p>
        <Button variant="bronze" size="sm" onClick={dismiss} className="shrink-0">
          Verstanden
        </Button>
      </div>
    </div>
  );
}
