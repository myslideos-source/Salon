"use client";

import { useState, useTransition } from "react";
import { UploadCloud, CheckCircle2, Copy } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { syncRetellAgentAction } from "@/lib/actions/retell";

export function RetellSyncPanel({
  salonId,
  webhookUrl,
  currentAgentId,
}: {
  salonId: string;
  webhookUrl: string;
  currentAgentId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [agentId, setAgentId] = useState(currentAgentId);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function sync() {
    setError(null);
    startTransition(async () => {
      const result = await syncRetellAgentAction(salonId);
      if (result.ok) {
        setAgentId(result.agentId);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader title="Retell-Telefonassistent" subtitle="Überträgt Begrüßung, Stimme und Regeln zu Retell." />
      <div className="p-5 pt-4 space-y-4">
        <div>
          <p className="mb-1 text-xs font-medium text-ink-soft">Webhook-URL (für Retell-Konfiguration)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-sand px-3 py-2 text-xs text-ink-soft">{webhookUrl}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-lg p-2 text-ink-soft hover:bg-sand"
              title="Kopieren"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {agentId && (
          <p className="flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Zuletzt synchronisiert · Agent-ID: {agentId}
          </p>
        )}
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <Button variant="bronze" onClick={sync} disabled={pending}>
          <UploadCloud className="h-4 w-4" />
          {pending ? "Wird übertragen…" : agentId ? "Erneut übertragen" : "Zu Retell hochladen"}
        </Button>

        <p className="text-xs text-ink-faint">
          Trägt intern <code className="rounded bg-sand px-1">RETELL_API_KEY</code> zum Anlegen/Aktualisieren des Agents bei
          Retell ein. Telefonnummer und Weiterleitung stellst du links unter &bdquo;KI-Einstellungen&ldquo; ein.
        </p>
      </div>
    </Card>
  );
}
