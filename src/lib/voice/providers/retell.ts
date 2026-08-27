import "server-only";
import crypto from "node:crypto";
import type { VoiceAgentConfig, VoiceProvider } from "../provider";
import { toolJsonSchemas, toolDescriptions } from "../tool-json-schemas";
import type { ToolName } from "../tools";
import { toSpokenGerman } from "../spoken-text";
import { buildPromptFromConfig } from "../prompt";

const RETELL_API_BASE = "https://api.retellai.com";

function buildGeneralTools(config: VoiceAgentConfig) {
  const customTools = (Object.keys(toolJsonSchemas) as ToolName[]).map((name) => ({
    type: "custom",
    name,
    description: toolDescriptions[name],
    // Retell posts here with { name, args, call: { call_id, metadata, ... } }
    // on invocation — matches the shape our webhook route already parses.
    url: config.webhookUrl,
    parameters: toolJsonSchemas[name],
    // Every tool here is a network round trip to our backend, so any of
    // them can produce a noticeable silent gap - not just the two originally
    // flagged. Was especially bad for findCustomer, which the prompt now
    // calls proactively at the start of nearly every call.
    speak_during_execution: true,
    speak_after_execution: true,
  }));

  // Built-in Retell tool (not routed through our webhook) that lets the
  // agent actually hang up once the caller confirms they need nothing
  // else, instead of just sitting on the line after saying goodbye.
  // UNVERIFIED: exact shape not confirmed from this environment - if
  // wrong, syncAgent's error response will name the problem.
  const endCallTool = { type: "end_call", name: "end_call", description: "Beendet den Anruf höflich, nachdem du dich verabschiedet hast und die Anruferin/der Anrufer nichts mehr möchte." };

  return [...customTools, endCallTool];
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
        begin_message: toSpokenGerman(config.greeting),
        general_tools: buildGeneralTools(config),
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
        voice_id: config.voiceId || "cartesia-Eva",
        // Pin to exactly one voice. Without this, Retell may silently swap
        // in a different voice mid-call if the primary one errors, which is
        // what "zwei unterschiedliche Stimmen" (two different voices) most
        // likely was.
        fallback_voice_ids: [],
        // Natural-sounding "mhm"/"ja" acknowledgements while the caller is
        // still talking, so the agent doesn't feel like it's just silently
        // waiting for its turn.
        enable_backchannel: true,
        backchannel_words: ["Mhm", "Ja", "Okay", "Genau"],
        // Biases speech recognition toward correctly transcribing these
        // proper nouns (employee/service names) instead of mishearing them
        // as similar-sounding common words.
        boosted_keywords: config.boostedKeywords,
        // Background office ambience so the silent gap during a tool call
        // reads as "she's typing something up" rather than dead air.
        // UNVERIFIED: the exact set of valid Retell ambient_sound presets
        // isn't confirmed from this environment - if this preset name is
        // wrong, syncAgent's error response will name the actual field/value
        // problem and this can be corrected precisely.
        ambient_sound: "call-center",
        ambient_sound_volume: 0.3,
        // Lower value = harder to interrupt. This applies to the whole call,
        // not just the opening greeting - Retell's retell-llm response engine
        // (unlike its newer Conversation Flow product) has no field to scope
        // non-interruptibility to just the first message. Kept moderate
        // (not 0) so genuine interruptions later in the call still work.
        interruption_sensitivity: 0.4,
        language: "de-DE",
        webhook_url: config.webhookUrl,
        response_engine: { type: "retell-llm", llm_id: llmId },
        // If Retell merges this into every call's metadata, our webhook can
        // resolve the salon directly instead of falling back to a
        // to_number -> voice_settings.phone_number lookup.
        metadata: { salonId: config.salonId },
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
