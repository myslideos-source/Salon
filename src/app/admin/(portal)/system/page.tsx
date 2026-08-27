import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { ADMIN_AVATAR_URL } from "@/lib/utils";

const ENV_CHECKS = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase Anon Key" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase Service Role Key" },
  { key: "OPENAI_API_KEY", label: "OpenAI API Key (Voice Test Mode)" },
  { key: "ELEVENLABS_API_KEY", label: "ElevenLabs API Key (Live-Telefonie)" },
  { key: "ELEVENLABS_WEBHOOK_SECRET", label: "ElevenLabs Webhook Secret" },
];

export default async function AdminSystemPage() {
  const supabase = await createClient();
  const [{ count: activeSalons }, { count: totalSalons }, { data: callDurations }] = await Promise.all([
    supabase.from("salons").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("salons").select("id", { count: "exact", head: true }),
    supabase.from("calls").select("duration_seconds"),
  ]);

  const totalMinutes = Math.round((callDurations ?? []).reduce((sum, c) => sum + c.duration_seconds, 0) / 60);

  return (
    <div>
      <Topbar title="Systemstatus" avatarLabel="Admin" avatarImageUrl={ADMIN_AVATAR_URL} />
      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-2">
        <Card>
          <CardHeader title="Plattform" />
          <div className="grid grid-cols-3 gap-4 p-5 pt-3">
            <div>
              <p className="text-2xl font-semibold text-ink">{activeSalons ?? 0}</p>
              <p className="text-xs text-ink-soft">Aktive Salons</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{totalSalons ?? 0}</p>
              <p className="text-xs text-ink-soft">Salons gesamt</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{totalMinutes}</p>
              <p className="text-xs text-ink-soft">KI-Gesprächsminuten</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Konfiguration" subtitle="Server-Umgebungsvariablen" />
          <div className="divide-y divide-border">
            {ENV_CHECKS.map((check) => {
              const configured = Boolean(process.env[check.key]);
              return (
                <div key={check.key} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-ink">{check.label}</p>
                    <p className="font-mono text-[11px] text-ink-faint">{check.key}</p>
                  </div>
                  {configured ? (
                    <Badge tone="success" dot>
                      <CheckCircle2 className="h-3 w-3" /> Gesetzt
                    </Badge>
                  ) : (
                    <Badge tone="warning" dot>
                      <XCircle className="h-3 w-3" /> Fehlt
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
