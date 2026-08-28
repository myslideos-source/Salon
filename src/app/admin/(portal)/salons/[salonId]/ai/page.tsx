import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { VoiceSettingsForm } from "@/components/admin/voice-settings-form";
import { ElevenLabsSyncPanel } from "@/components/admin/elevenlabs-sync-panel";
import { TwilioSyncPanel } from "@/components/admin/twilio-sync-panel";

export default async function AdminAiPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = await createClient();
  const { data: settings } = await supabase.from("voice_settings").select("*").eq("salon_id", salonId).maybeSingle();

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="h-fit">
        <CardHeader title="KI-Einstellungen" subtitle="Stimme, Begrüßung, Persönlichkeit und Regeln." />
        <div className="p-5 pt-4">
          <VoiceSettingsForm salonId={salonId} settings={settings} />
        </div>
      </Card>
      <ElevenLabsSyncPanel salonId={salonId} currentAgentId={settings?.elevenlabs_agent_id ?? null} />
      <TwilioSyncPanel salonId={salonId} currentSid={settings?.twilio_phone_number_sid ?? null} />
    </div>
  );
}
