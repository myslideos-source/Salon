import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
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
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bronze-soft text-bronze-dark">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-soft">{label}</p>
          <p className="font-display text-2xl text-ink">{value}</p>
        </div>
      </div>
      {deltaLabel && (
        <p className={cn("mt-2 flex items-center gap-1 text-xs text-success")}>
          <ArrowUpRight className="h-3 w-3" /> {deltaLabel}
        </p>
      )}
    </Card>
  );
}
