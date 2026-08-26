import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { AdminSalonTabs } from "@/components/admin/salon-tabs";
import { AiToggle } from "@/components/layout/ai-toggle";
import { Badge } from "@/components/ui/badge";

export default async function AdminSalonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ salonId: string }>;
}) {
  await requirePlatformAdmin();
  const { salonId } = await params;
  const supabase = await createClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, status, ai_active")
    .eq("id", salonId)
    .single();

  if (!salon) notFound();

  return (
    <div>
      <div className="border-b border-border bg-cream/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin/salons" className="text-xs text-ink-faint hover:text-ink-soft">
              ← Alle Salons
            </Link>
            <h1 className="mt-1 font-display text-2xl text-ink">{salon.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={salon.status === "active" ? "success" : "neutral"} dot>
              {salon.status === "active" ? "Aktiv" : salon.status === "trial" ? "Testphase" : "Pausiert"}
            </Badge>
            <AiToggle salonId={salon.id} initialActive={salon.ai_active} />
          </div>
        </div>
        <AdminSalonTabs salonId={salonId} />
      </div>
      <div className="p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
