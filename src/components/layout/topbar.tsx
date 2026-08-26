import { Bell } from "lucide-react";
import { initials } from "@/lib/utils";

export function Topbar({
  title,
  subtitle,
  avatarLabel,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  avatarLabel: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-cream/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="truncate font-display text-xl text-ink sm:text-2xl">{title}</h1>
        </div>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {right}
        <button className="relative rounded-full p-2 text-ink-soft hover:bg-sand hover:text-ink transition-colors">
          <Bell className="h-5 w-5" strokeWidth={1.8} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-bronze" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bronze-soft text-xs font-semibold text-bronze-dark">
          {initials(avatarLabel.split(" ")[0] ?? "S", avatarLabel.split(" ")[1] ?? "C")}
        </div>
      </div>
    </header>
  );
}
