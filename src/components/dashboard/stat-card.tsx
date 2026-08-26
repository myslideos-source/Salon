import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  deltaLabel,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  deltaLabel?: string;
}) {
  const isDown = deltaLabel?.startsWith("-");
  const isUp = deltaLabel?.startsWith("+");
  const DeltaIcon = isDown ? ArrowDownRight : isUp ? ArrowUpRight : Sparkles;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bronze-soft text-bronze-dark">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-soft">{label}</p>
          <p className="font-display text-3xl tracking-tight text-ink">{value}</p>
        </div>
      </div>
      {deltaLabel && (
        <p className={cn("mt-2 flex items-center gap-1 text-xs", isDown ? "text-danger" : "text-success")}>
          <DeltaIcon className="h-3 w-3" /> {deltaLabel}
        </p>
      )}
    </Card>
  );
}
