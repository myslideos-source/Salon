import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { LeadsBoard } from "@/components/admin/leads-board";
import { ADMIN_AVATAR_URL } from "@/lib/utils";

export default async function AdminLeadsPage() {
  const session = await requirePlatformAdmin();
  const supabase = await createClient();
  const { data: leads } = await supabase.from("sales_leads").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <Topbar title="Akquise" subtitle="Friseursalons im Umkreis — Kontakt, Status und Notizen." avatarLabel={session.email ?? "Admin"} avatarImageUrl={ADMIN_AVATAR_URL} />
      <LeadsBoard leads={leads ?? []} />
    </div>
  );
}
