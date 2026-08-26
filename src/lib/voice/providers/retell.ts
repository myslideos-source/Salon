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

  async syncAgent(config: VoiceAgentConfig, existing?: { agentId?: string | null; llmId?: string | null }) {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "RETELL_API_KEY ist nicht gesetzt. Siehe .env.example." };
    }
    const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

    try {
      // 1) Retell LLM — the "response engine" that owns the conversation
      // logic/prompt. Agents reference one by id rather than embedding the
      // prompt directly.
      const llmBody = {
        general_prompt: buildPromptFromConfig(config),
        begin_message: config.greeting,
      };
      const llmResponse = existing?.llmId
        ? await fetch(`${RETELL_API_BASE}/update-retell-llm/${existing.llmId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(llmBody),
          })
        : await fetch(`${RETELL_API_BASE}/create-retell-llm`, {
            method: "POST",
            headers,
            body: JSON.stringify(llmBody),
          });
      if (!llmResponse.ok) {
        return { ok: false as const, error: `Retell LLM Fehler (${llmResponse.status}): ${await llmResponse.text()}` };
      }
      const llmJson = (await llmResponse.json()) as { llm_id: string };
      const llmId = llmJson.llm_id ?? existing?.llmId;
      if (!llmId) {
        return { ok: false as const, error: "Retell hat keine llm_id zurückgegeben." };
      }

      // 2) Agent — voice, language, webhook and which Retell LLM to use.
      // language controls STT/TTS; it's independent of the prompt's text
      // language and defaults to en-US on Retell if left unset.
      const agentBody = {
        agent_name: `saloncall-${config.salonId}`,
        voice_id: config.voiceId || "11labs-Anna",
        language: "de-DE",
        webhook_url: config.webhookUrl,
        response_engine: { type: "retell-llm", llm_id: llmId },
      };
      const agentResponse = existing?.agentId
        ? await fetch(`${RETELL_API_BASE}/update-agent/${existing.agentId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(agentBody),
          })
        : await fetch(`${RETELL_API_BASE}/create-agent`, {
            method: "POST",
            headers,
            body: JSON.stringify(agentBody),
          });
      if (!agentResponse.ok) {
        return { ok: false as const, error: `Retell Agent Fehler (${agentResponse.status}): ${await agentResponse.text()}` };
      }
      const agentJson = (await agentResponse.json()) as { agent_id: string };
      const agentId = agentJson.agent_id ?? existing?.agentId;
      if (!agentId) {
        return { ok: false as const, error: "Retell hat keine agent_id zurückgegeben." };
      }

      return { ok: true as const, agentId, llmId };
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
