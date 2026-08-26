import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-sand text-ink-soft",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  bronze: "bg-bronze-soft text-bronze-dark",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  dot,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : tone === "danger" ? "bg-danger" : tone === "info" ? "bg-info" : tone === "bronze" ? "bg-bronze" : "bg-ink-faint")} />}
      {children}
    </span>
  );
}
