import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Users, Scissors, Clock, Phone } from "lucide-react";

export default async function AdminSalonOverviewPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [{ count: employeeCount }, { count: serviceCount }, { count: callsToday }, { count: appointmentsToday }] =
    await Promise.all([
      supabase.from("employees").select("id", { count: "exact", head: true }).eq("salon_id", salonId).eq("active", true),
      supabase.from("services").select("id", { count: "exact", head: true }).eq("salon_id", salonId).eq("active", true),
      supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .eq("salon_id", salonId)
        .gte("started_at", todayStart.toISOString()),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("salon_id", salonId)
        .gte("start_at", todayStart.toISOString())
        .lte("start_at", todayEnd.toISOString()),
    ]);

  const stats = [
    { label: "Mitarbeiter aktiv", value: employeeCount ?? 0, icon: Users, href: `/admin/salons/${salonId}/employees` },
    { label: "Leistungen aktiv", value: serviceCount ?? 0, icon: Scissors, href: `/admin/salons/${salonId}/services` },
    { label: "Termine heute", value: appointmentsToday ?? 0, icon: Clock, href: `/admin/salons/${salonId}/calendar` },
    { label: "Anrufe heute", value: callsToday ?? 0, icon: Phone, href: `/admin/salons/${salonId}/calls` },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <Link key={s.label} href={s.href}>
          <Card className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bronze-soft text-bronze-dark">
                <s.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink">{s.value}</p>
                <p className="text-xs text-ink-soft">{s.label}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
