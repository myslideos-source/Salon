import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { OpeningHoursForm } from "@/components/admin/opening-hours-form";

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export default async function AdminOpeningHoursPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = await createClient();
  const { data: hours } = await supabase
    .from("business_hours")
    .select("*")
    .eq("salon_id", salonId)
    .order("weekday");

  const byWeekday = new Map((hours ?? []).map((h) => [h.weekday, h]));
  const rows = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    label: WEEKDAYS[weekday],
    ...byWeekday.get(weekday),
  }));

  return (
    <Card className="max-w-2xl">
      <CardHeader title="Öffnungszeiten" subtitle="Salonweite Öffnungszeiten – gelten als äußerer Rahmen für alle Buchungen." />
      <div className="p-5 pt-4">
        <OpeningHoursForm salonId={salonId} rows={rows} />
      </div>
    </Card>
  );
}
