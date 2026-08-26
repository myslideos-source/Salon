import { Loader2 } from "lucide-react";

export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-soft">
      <Loader2 className="h-6 w-6 animate-spin text-bronze" />
      <p className="text-sm">Wird geladen…</p>
    </div>
  );
}
