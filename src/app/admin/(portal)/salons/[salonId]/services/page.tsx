import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { ServiceForm } from "@/components/admin/service-form";
import { ServiceRow } from "@/components/admin/service-row";
import { ServiceEmployeeMatrix } from "@/components/admin/service-employee-matrix";

export default async function AdminServicesPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = await createClient();
  const [{ data: services }, { data: employees }, { data: links }] = await Promise.all([
    supabase.from("services").select("*").eq("salon_id", salonId).order("sort_order").order("name"),
    supabase.from("employees").select("id, first_name, last_name").eq("salon_id", salonId).eq("active", true).order("sort_order"),
    supabase.from("employee_services").select("employee_id, service_id").eq("salon_id", salonId),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-display text-lg text-ink px-1">Leistungen</h2>
          {(services ?? []).map((s) => (
            <ServiceRow key={s.id} salonId={salonId} service={s} />
          ))}
          {(services ?? []).length === 0 && (
            <Card className="p-8 text-center text-sm text-ink-soft">Noch keine Leistungen angelegt.</Card>
          )}
        </div>
        <Card className="h-fit">
          <CardHeader title="Leistung hinzufügen" subtitle="Dauer, Preis und Puffer je Termin." />
          <div className="p-5 pt-4">
            <ServiceForm salonId={salonId} />
          </div>
        </Card>
      </div>

      {(services ?? []).length > 0 && (employees ?? []).length > 0 && (
        <Card>
          <CardHeader title="Mitarbeiter-Fähigkeiten" subtitle="Wer darf welche Leistung anbieten? Ohne Zuordnung gilt eine Leistung für alle Mitarbeiter." />
          <div className="p-5 pt-4">
            <ServiceEmployeeMatrix
              salonId={salonId}
              services={(services ?? []).map((s) => ({ id: s.id, name: s.name }))}
              employees={employees ?? []}
              links={links ?? []}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
