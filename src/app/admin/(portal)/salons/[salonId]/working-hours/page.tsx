import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { WorkingHoursBoard } from "@/components/admin/working-hours-board";
import { AbsenceList } from "@/components/admin/absence-list";
import { AbsenceForm } from "@/components/admin/absence-form";

export default async function AdminWorkingHoursPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = await createClient();
  const [{ data: employees }, { data: workingHours }, { data: absences }] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, color").eq("salon_id", salonId).eq("active", true).order("sort_order"),
    supabase.from("employee_working_hours").select("*").eq("salon_id", salonId),
    supabase
      .from("employee_absences")
      .select("*, employees(first_name, last_name)")
      .eq("salon_id", salonId)
      .gte("end_at", new Date().toISOString())
      .order("start_at"),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Arbeitszeiten" subtitle="Pro Mitarbeiter und Wochentag – mehrere Zeitblöcke möglich." />
        <div className="p-5 pt-4">
          <WorkingHoursBoard salonId={salonId} employees={employees ?? []} workingHours={workingHours ?? []} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-display text-lg text-ink px-1">Abwesenheiten</h2>
          <AbsenceList
            salonId={salonId}
            redirectPath={`/admin/salons/${salonId}/working-hours`}
            absences={(absences ?? []) as never[]}
          />
        </div>
        <Card className="h-fit">
          <CardHeader title="Abwesenheit eintragen" />
          <div className="p-5 pt-4">
            <AbsenceForm salonId={salonId} employees={employees ?? []} />
          </div>
        </Card>
      </div>
    </div>
  );
}
