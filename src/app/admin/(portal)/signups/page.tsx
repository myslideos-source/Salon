import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { SignupRequestRow } from "@/components/admin/signup-request-row";
import { ADMIN_AVATAR_URL } from "@/lib/utils";

export default async function AdminSignupsPage() {
  const session = await requirePlatformAdmin();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("signup_requests")
    .select("id, salon_name, contact_name, email, phone, plan, message, status, created_at")
    .order("created_at", { ascending: false });

  const openCount = (requests ?? []).filter((r) => r.status === "new").length;

  return (
    <div>
      <Topbar title="Anfragen" subtitle={`Angemeldet als ${session.email}`} avatarLabel="Admin" avatarImageUrl={ADMIN_AVATAR_URL} />
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader title="Paket-Anfragen" subtitle={`${openCount} neu`} />
          <div className="divide-y divide-border">
            {(requests ?? []).map((r) => (
              <SignupRequestRow key={r.id} request={r} />
            ))}
            {(requests ?? []).length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-ink-faint">Noch keine Anfragen.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
