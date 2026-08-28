import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSalonSession, resolveActiveSalonId } from "@/lib/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { AiSettingsForm } from "@/components/portal/ai-settings-form";
import { FaqManager } from "@/components/portal/faq-manager";
import { DEFAULT_COMPANY_LABEL } from "@/lib/terminology";

export default async function SalonAiPage() {
  const session = await requireSalonSession();
  const salonId = resolveActiveSalonId(session)!;
  const supabase = await createClient();

  const [{ data: settings }, { data: salon }, { data: faqs }] = await Promise.all([
    supabase.from("voice_settings").select("*").eq("salon_id", salonId).maybeSingle(),
    supabase.from("salons").select("description").eq("id", salonId).single(),
    supabase.from("faq").select("*").eq("salon_id", salonId).order("sort_order"),
  ]);

  return (
    <div>
      <Topbar title="Meine Mia" subtitle="Begrüßung, Persönlichkeit und dein eigenes Fachwissen" avatarLabel={session.email ?? DEFAULT_COMPANY_LABEL} />
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader title="KI-Einstellungen" subtitle="Diese Angaben nutzt dein Telefonassistent bei jedem Anruf." />
          <div className="p-5 pt-4">
            <AiSettingsForm settings={settings} description={salon?.description ?? null} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Häufige Fragen" subtitle="Fragen und Antworten, die Mia am Telefon direkt beantworten kann." />
          <div className="p-5 pt-4">
            <FaqManager salonId={salonId} faqs={faqs ?? []} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Mia testen" subtitle="Simuliere ein Telefongespräch mit den tatsächlich gespeicherten Einstellungen." />
          <div className="p-5 pt-4">
            <LinkButton href="/app/ai/test" variant="bronze">
              <MessageCircle className="h-4 w-4" /> Testchat öffnen
            </LinkButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
