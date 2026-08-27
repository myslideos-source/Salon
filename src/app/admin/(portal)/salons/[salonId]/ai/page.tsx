import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { VoiceSettingsForm } from "@/components/admin/voice-settings-form";
import { TestCallPanel } from "@/components/admin/test-call-panel";
import { RetellSyncPanel } from "@/components/admin/retell-sync-panel";
import { ElevenLabsSyncPanel } from "@/components/admin/elevenlabs-sync-panel";

export default async function AdminAiPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = await createClient();
  const { data: settings } = await supabase.from("voice_settings").select("*").eq("salon_id", salonId).maybeSingle();
  const webhookUrl = `${process.env.APP_URL ?? ""}/api/voice/webhook`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="h-fit">
          <CardHeader title="KI-Einstellungen" subtitle="Stimme, Begrüßung, Persönlichkeit und Regeln." />
          <div className="p-5 pt-4">
            <VoiceSettingsForm salonId={salonId} settings={settings} />
          </div>
        </Card>
        <RetellSyncPanel salonId={salonId} webhookUrl={webhookUrl} currentAgentId={settings?.provider_agent_id ?? null} />
        <ElevenLabsSyncPanel salonId={salonId} currentAgentId={settings?.elevenlabs_agent_id ?? null} />
      </div>
      <div>
        <h2 className="font-display text-lg text-ink px-1 mb-3">Testanruf</h2>
        <TestCallPanel salonId={salonId} greeting={settings?.greeting ?? "Hallo, wie kann ich Ihnen helfen?"} />
      </div>
    </div>
  );
}
