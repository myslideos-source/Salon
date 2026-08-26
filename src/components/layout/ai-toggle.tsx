"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleSalonAiAction } from "@/lib/actions/salon-ai";

export function AiToggle({ salonId, initialActive }: { salonId: string; initialActive: boolean }) {
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      try {
        await toggleSalonAiAction(salonId, next);
      } catch {
        setActive(!next);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
        active
          ? "border-success/30 bg-success-soft text-success"
          : "border-border-strong bg-sand text-ink-soft"
      )}
      title={active ? "KI-Telefonassistent ist aktiv – klicken zum Pausieren" : "KI-Telefonassistent ist pausiert – klicken zum Aktivieren"}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-success" : "bg-ink-faint")} />
      <Sparkles className="h-3 w-3" strokeWidth={2} />
      {active ? "KI aktiv" : "KI pausiert"}
    </button>
  );
}
