import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { EmployeeForm } from "@/components/admin/employee-form";
import { EmployeeRow } from "@/components/admin/employee-row";

export default async function AdminEmployeesPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, color, active, sort_order, avatar_url")
    .eq("salon_id", salonId)
    .order("sort_order")
    .order("first_name");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="font-display text-lg text-ink px-1">Mitarbeiter</h2>
        {(employees ?? []).map((e) => (
          <EmployeeRow key={e.id} salonId={salonId} employee={e} />
        ))}
        {(employees ?? []).length === 0 && (
          <Card className="p-8 text-center text-sm text-ink-soft">Noch keine Mitarbeiter angelegt.</Card>
        )}
      </div>
      <Card className="h-fit">
        <CardHeader title="Mitarbeiter hinzufügen" subtitle="Erscheint sofort im Kalender." />
        <div className="p-5 pt-4">
          <EmployeeForm salonId={salonId} />
        </div>
      </Card>
    </div>
  );
}
