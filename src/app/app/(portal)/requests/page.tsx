import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { CallbackRow } from "@/components/calls/callback-row";
import { DEFAULT_COMPANY_LABEL, TERMINOLOGY } from "@/lib/terminology";

export default async function SalonRequestsPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const { data: callbacks } = await supabase
    .from("callback_requests")
    .select("*, customers(first_name, last_name)")
    .eq("salon_id", salonId)
    .order("requested_at", { ascending: false });

  return (
    <div>
      <Topbar
        title={TERMINOLOGY.requestPlural}
        subtitle="Rückrufwünsche und Anliegen deiner Kund:innen ohne festen Termin."
        avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL}
      />
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
        <Card>
          <div className="divide-y divide-border">
            {(callbacks ?? []).map((cb) => (
              <CallbackRow key={cb.id} salonId={salonId} callback={cb} redirectPath="/app/requests" />
            ))}
          </div>
          {(callbacks ?? []).length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-faint">Keine offenen Anfragen.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
