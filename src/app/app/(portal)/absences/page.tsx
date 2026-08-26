import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { AbsenceList } from "@/components/admin/absence-list";
import { AbsenceForm } from "@/components/admin/absence-form";

export default async function SalonAbsencesPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const [{ data: employees }, { data: absences }] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name").eq("salon_id", salonId).eq("active", true).order("sort_order"),
    supabase
      .from("employee_absences")
      .select("*, employees(first_name, last_name)")
      .eq("salon_id", salonId)
      .gte("end_at", new Date().toISOString())
      .order("start_at"),
  ]);

  return (
    <div>
      <Topbar title="Abwesenheiten" subtitle="Urlaub, Krankheit und Pausen deines Teams" avatarLabel={session.email ?? "Salon"} />
      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <AbsenceList salonId={salonId} redirectPath="/app/absences" absences={(absences ?? []) as never[]} />
        </div>
        <Card className="h-fit">
          <CardHeader title="Abwesenheit eintragen" />
          <div className="p-5 pt-4">
            <AbsenceForm salonId={salonId} employees={employees ?? []} redirectPath="/app/absences" />
          </div>
        </Card>
      </div>
    </div>
  );
}
