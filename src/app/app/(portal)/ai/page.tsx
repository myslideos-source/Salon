import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { AiSettingsForm } from "@/components/portal/ai-settings-form";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

export default async function SalonAiPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const { data: settings } = await supabase.from("voice_settings").select("*").eq("salon_id", salonId).maybeSingle();

  return (
    <div>
      <Topbar title="Meine Mia" subtitle="Begrüßung, Persönlichkeit und dein eigenes Fachwissen" avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} />
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
        <Card>
          <CardHeader title="KI-Einstellungen" subtitle="Diese Angaben nutzt dein Telefonassistent bei jedem Anruf." />
          <div className="p-5 pt-4">
            <AiSettingsForm settings={settings} />
          </div>
        </Card>
      </div>
    </div>
  );
}
