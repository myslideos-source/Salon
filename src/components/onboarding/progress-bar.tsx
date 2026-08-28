"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";

export function OnboardingProgressBar({
  activeStep,
  furthestStep,
  onSelectStep,
}: {
  activeStep: number;
  furthestStep: number;
  onSelectStep: (step: number) => void;
}) {
  return (
    <ol className="flex gap-1.5 overflow-x-auto pb-1">
      {ONBOARDING_STEPS.map((s) => {
        const done = s.step < furthestStep;
        const isActive = s.step === activeStep;
        const reachable = s.interactive && s.step <= furthestStep;

        return (
          <li key={s.step} className="flex-1 min-w-[64px]">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onSelectStep(s.step)}
              title={s.interactive ? s.title : `${s.title} — folgt später`}
              className={cn(
                "flex w-full flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center transition-colors",
                reachable ? "cursor-pointer hover:bg-sand" : "cursor-default opacity-40"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  isActive
                    ? "bg-bronze text-white"
                    : done
                      ? "bg-success-soft text-success"
                      : "bg-sand text-ink-faint"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : s.step}
              </span>
              <span className={cn("hidden text-[11px] leading-tight sm:block", isActive ? "text-ink font-medium" : "text-ink-faint")}>
                {s.title}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
