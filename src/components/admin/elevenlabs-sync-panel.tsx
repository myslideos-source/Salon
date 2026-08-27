"use client";

import { useState, useTransition } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { syncElevenLabsAgentAction } from "@/lib/actions/elevenlabs";

export function ElevenLabsSyncPanel({
  salonId,
  currentAgentId,
}: {
  salonId: string;
  currentAgentId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [agentId, setAgentId] = useState(currentAgentId);
  const [error, setError] = useState<string | null>(null);

  function sync() {
    setError(null);
    startTransition(async () => {
      const result = await syncElevenLabsAgentAction(salonId);
      if (result.ok) {
        setAgentId(result.agentId);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader title="ElevenLabs-Telefonassistent (Test)" subtitle="Alternative zu Retell — überträgt Begrüßung, Stimme und Regeln zu ElevenLabs." />
      <div className="p-5 pt-4 space-y-4">
        {agentId && (
          <p className="flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Zuletzt synchronisiert · Agent-ID: {agentId}
          </p>
        )}
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <Button variant="bronze" onClick={sync} disabled={pending}>
          <UploadCloud className="h-4 w-4" />
          {pending ? "Wird übertragen…" : agentId ? "Erneut übertragen" : "Zu ElevenLabs hochladen"}
        </Button>

        {agentId && (
          <div className="rounded-lg border border-border bg-cream-soft/60 px-3 py-2.5 text-xs text-ink-soft">
            <strong className="text-ink">Nächster Schritt (einmalig, manuell):</strong> Im ElevenLabs-Dashboard unter
            &bdquo;Phone Numbers&ldquo; eure bestehende Twilio-Nummer importieren und diesem Agenten (
            <code className="rounded bg-sand px-1">{agentId}</code>) zuordnen — die Nummer, der SIP-Trunk und die
            Regulatorik bleiben dabei unverändert, nur das Ziel wechselt von Retell zu ElevenLabs.
          </div>
        )}

        <p className="text-xs text-ink-faint">
          Trägt intern <code className="rounded bg-sand px-1">ELEVENLABS_API_KEY</code> zum Anlegen/Aktualisieren des
          Agents bei ElevenLabs ein. Solange die Twilio-Nummer noch nicht dorthin umgehängt ist, kann dieser Agent
          gefahrlos parallel zum Retell-Agenten getestet werden, ohne den Live-Betrieb zu beeinflussen.
        </p>
      </div>
    </Card>
  );
}
