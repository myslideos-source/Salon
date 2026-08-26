import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { VoiceSettingsForm } from "@/components/admin/voice-settings-form";
import { TestCallPanel } from "@/components/admin/test-call-panel";

export default async function AdminAiPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = await createClient();
  const { data: settings } = await supabase.from("voice_settings").select("*").eq("salon_id", salonId).maybeSingle();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="h-fit">
        <CardHeader title="KI-Einstellungen" subtitle="Stimme, Begrüßung, Persönlichkeit und Regeln." />
        <div className="p-5 pt-4">
          <VoiceSettingsForm salonId={salonId} settings={settings} />
        </div>
      </Card>
      <div>
        <h2 className="font-display text-lg text-ink px-1 mb-3">Testanruf</h2>
        <TestCallPanel salonId={salonId} greeting={settings?.greeting ?? "Hallo, wie kann ich Ihnen helfen?"} />
      </div>
    </div>
  );
}
