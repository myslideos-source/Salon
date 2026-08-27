import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AbsenceList } from "@/components/admin/absence-list";
import { AbsenceForm } from "@/components/admin/absence-form";
import { initials } from "@/lib/utils";
import { DEFAULT_COMPANY_LABEL, TERMINOLOGY } from "@/lib/terminology";

export default async function SalonTeamPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const [{ data: employees }, { data: absences }] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, color, active").eq("salon_id", salonId).order("sort_order"),
    supabase
      .from("employee_absences")
      .select("*, employees(first_name, last_name)")
      .eq("salon_id", salonId)
      .gte("end_at", new Date().toISOString())
      .order("start_at"),
  ]);

  return (
    <div>
      <Topbar
        title={TERMINOLOGY.teamAndResources}
        subtitle="Dein Team und die Zeiten, zu denen es verfügbar ist."
        avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL}
      />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h2 className="mb-3 px-1 font-display text-lg text-ink">{TERMINOLOGY.employeePlural}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(employees ?? []).map((e) => (
              <Card key={e.id} className="flex items-center gap-3 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: e.color }}
                >
                  {initials(e.first_name, e.last_name || "")}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    {e.first_name} {e.last_name}
                  </p>
                  <Badge tone={e.active ? "success" : "neutral"} dot>
                    {e.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
              </Card>
            ))}
            {(employees ?? []).length === 0 && (
              <Card className="p-8 text-center text-sm text-ink-soft sm:col-span-2 xl:col-span-3">
                Noch keine Mitarbeiter angelegt.
              </Card>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 px-1 font-display text-lg text-ink">Abwesenheiten</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              <AbsenceList salonId={salonId} redirectPath="/app/team" absences={(absences ?? []) as never[]} />
            </div>
            <Card className="h-fit">
              <CardHeader title="Abwesenheit eintragen" />
              <div className="p-5 pt-4">
                <AbsenceForm salonId={salonId} employees={employees ?? []} redirectPath="/app/team" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
