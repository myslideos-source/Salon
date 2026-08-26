import "server-only";
import crypto from "node:crypto";
import type { VoiceAgentConfig, VoiceProvider } from "../provider";

const RETELL_API_BASE = "https://api.retellai.com";

function buildPromptFromConfig(config: VoiceAgentConfig): string {
  return [
    `Du bist die digitale Telefonassistenz von "${config.salonName}".`,
    `Persönlichkeit: ${config.personality}.`,
    `Begrüßung: "${config.greeting}"`,
    "",
    "Regeln:",
    "- Nutze ausschließlich die bereitgestellten Tools für Preise, Öffnungszeiten, Mitarbeiter, Leistungen und Verfügbarkeiten.",
    "- Erfinde niemals Informationen. Wenn etwas unbekannt ist, sage das offen und biete einen Rückruf an.",
    config.rules.mentionPrices ? "- Nenne Preise, wenn danach gefragt wird oder ein Termin besprochen wird." : "",
    config.rules.offerAlternatives ? "- Biete bei Nichtverfügbarkeit aktiv Alternativtermine an." : "",
    config.rules.respectEmployeePreference ? "- Beachte Mitarbeiterwünsche der Anruferin/des Anrufers." : "",
    config.rules.offerCallback ? "- Biete einen Rückruf an, wenn du nicht weiterhelfen kannst." : "",
    config.rules.detectNewCustomers ? "- Erkenne Neukunden anhand der Telefonnummer und begrüße sie entsprechend." : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export class RetellProvider implements VoiceProvider {
  readonly name = "retell";

  isConfigured(): boolean {
    return Boolean(process.env.RETELL_API_KEY);
  }

  async syncAgent(config: VoiceAgentConfig) {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "RETELL_API_KEY ist nicht gesetzt. Siehe .env.example." };
    }

    try {
      const response = await fetch(`${RETELL_API_BASE}/create-agent`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: `saloncall-${config.salonId}`,
          voice_id: config.voiceId || "11labs-Anna",
          webhook_url: config.webhookUrl,
          general_prompt: buildPromptFromConfig(config),
        }),
      });
      if (!response.ok) {
        return { ok: false as const, error: `Retell API Fehler (${response.status}): ${await response.text()}` };
      }
      const json = (await response.json()) as { agent_id: string };
      return { ok: true as const, agentId: json.agent_id };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Unbekannter Fehler bei der Retell-Synchronisation." };
    }
  }

  verifyWebhookSignature(payload: string, signatureHeader: string | null): boolean {
    const secret = process.env.RETELL_WEBHOOK_SECRET;
    if (!secret) return false;
    if (!signatureHeader) return false;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}

export const retellProvider = new RetellProvider();
