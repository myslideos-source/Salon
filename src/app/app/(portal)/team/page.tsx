import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { AbsenceList } from "@/components/admin/absence-list";
import { AbsenceForm } from "@/components/admin/absence-form";
import { EmployeesManager } from "@/components/team/employees-manager";
import { EmployeeWorkingHoursBoard } from "@/components/team/employee-working-hours-board";
import { ResourcesManager } from "@/components/team/resources-manager";
import { ResourceWorkingHoursBoard } from "@/components/team/resource-working-hours-board";
import { DEFAULT_COMPANY_LABEL, TERMINOLOGY } from "@/lib/terminology";

export default async function SalonTeamPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const [
    { data: employees },
    { data: employeeWorkingHours },
    { data: absences },
    { data: resources },
    { data: resourceWorkingHours },
    { data: locations },
    canManage,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name, color, active, location_id")
      .eq("salon_id", salonId)
      .order("sort_order"),
    supabase.from("employee_working_hours").select("id, employee_id, weekday, start_time, end_time").eq("salon_id", salonId),
    supabase
      .from("employee_absences")
      .select("*, employees(first_name, last_name)")
      .eq("salon_id", salonId)
      .gte("end_at", new Date().toISOString())
      .order("start_at"),
    supabase
      .from("resources")
      .select("id, name, type, description, color, active, location_id")
      .eq("salon_id", salonId)
      .order("sort_order"),
    supabase.from("resource_working_hours").select("id, resource_id, weekday, start_time, end_time").eq("salon_id", salonId),
    supabase.from("locations").select("id, name").eq("salon_id", salonId).eq("active", true).order("sort_order"),
    checkPermission(salonId, "manage_team"),
  ]);

  return (
    <div>
      <Topbar
        title={TERMINOLOGY.teamAndResources}
        subtitle="Mitarbeiter, Ressourcen und die Zeiten, zu denen sie verfügbar sind."
        avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL}
      />
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <EmployeesManager salonId={salonId} employees={employees ?? []} locations={locations ?? []} canManage={canManage} />

        <div>
          <h2 className="mb-3 px-1 font-display text-lg text-ink">Arbeitszeiten (Mitarbeiter)</h2>
          <Card className="p-5">
            <EmployeeWorkingHoursBoard
              salonId={salonId}
              employees={employees ?? []}
              workingHours={employeeWorkingHours ?? []}
              canManage={canManage}
            />
          </Card>
        </div>

        <ResourcesManager salonId={salonId} resources={resources ?? []} locations={locations ?? []} canManage={canManage} />

        <div>
          <h2 className="mb-3 px-1 font-display text-lg text-ink">Verfügbarkeitszeiten (Ressourcen)</h2>
          <Card className="p-5">
            <ResourceWorkingHoursBoard
              salonId={salonId}
              resources={resources ?? []}
              workingHours={resourceWorkingHours ?? []}
              canManage={canManage}
            />
          </Card>
        </div>

        <div>
          <h2 className="mb-3 px-1 font-display text-lg text-ink">Abwesenheiten</h2>
          <p className="mb-3 px-1 text-sm text-ink-soft">
            Urlaub, Krankheit und Pausen — ein abwesender Mitarbeiter gilt in dieser Zeit nicht als verfügbar.
          </p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
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
