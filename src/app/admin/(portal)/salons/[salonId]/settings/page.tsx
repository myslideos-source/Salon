import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { SalonSettingsForm } from "@/components/admin/salon-settings-form";

export default async function AdminSalonSettingsPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = await createClient();
  const { data: salon } = await supabase.from("salons").select("*").eq("id", salonId).single();
  if (!salon) return null;

  return (
    <Card className="max-w-2xl">
      <CardHeader title="Einstellungen" subtitle="Stammdaten und Buchungsregeln dieses Salons." />
      <div className="p-5 pt-4">
        <SalonSettingsForm salon={salon} />
      </div>
    </Card>
  );
}
