"use client";

import { useState, useTransition } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { syncTwilioNumberAction } from "@/lib/actions/twilio";

export function TwilioSyncPanel({ salonId, currentSid }: { salonId: string; currentSid: string | null }) {
  const [pending, startTransition] = useTransition();
  const [sid, setSid] = useState(currentSid);
  const [error, setError] = useState<string | null>(null);

  function sync() {
    setError(null);
    startTransition(async () => {
      const result = await syncTwilioNumberAction(salonId);
      if (result.ok) {
        setSid(result.agentId);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader title="Twilio-Telefonie" subtitle="Verbindet eine Twilio-Nummer direkt mit HalloMia (ohne Retell/ElevenLabs)." />
      <div className="p-5 pt-4 space-y-4">
        {sid && (
          <p className="flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verbunden · Nummer-SID: {sid}
          </p>
        )}
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <Button variant="bronze" onClick={sync} disabled={pending}>
          <UploadCloud className="h-4 w-4" />
          {pending ? "Wird verbunden…" : sid ? "Erneut verbinden" : "Twilio-Nummer verbinden"}
        </Button>

        <p className="text-xs text-ink-faint">
          Setzt den Voice-Webhook der oben hinterlegten Telefonnummer im verbundenen Twilio-Konto
          (<code className="rounded bg-sand px-1">TWILIO_ACCOUNT_SID</code>/
          <code className="rounded bg-sand px-1">TWILIO_AUTH_TOKEN</code>, serverseitig) auf HalloMia. Twilio führt dabei
          selbst kein KI-Gespräch — es begrüßt Anrufer, nimmt Rückrufwünsche auf und kann an eine hinterlegte
          Weiterleitungsnummer verbinden. Für ein echtes KI-Gespräch bitte Retell oder ElevenLabs konfigurieren.
        </p>
      </div>
    </Card>
  );
}
