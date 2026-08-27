import "server-only";
import crypto from "node:crypto";
import type { VoiceAgentConfig, VoiceProvider } from "../provider";
import { toolJsonSchemas, toolDescriptions } from "../tool-json-schemas";
import type { ToolName } from "../tools";
import { toSpokenGerman } from "../spoken-text";
import { buildPromptFromConfig } from "../prompt";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io";

// UNVERIFIED: ElevenLabs' Agents Platform REST API shape below (endpoint
// paths, the conversation_config nesting, field names) is built from the
// generally-documented structure of their Agents API, not confirmed live
// from this environment — network access to elevenlabs.io is blocked here.
// If any of it is wrong, syncAgent's error response surfaces the exact
// field ElevenLabs rejected (same "let the API name the problem" approach
// already used for the few unverified Retell fields below), so a real
// sync attempt in the admin UI is the fastest way to correct it precisely.

// Unlike Retell (one shared webhook URL, tool name passed in the body),
// ElevenLabs configures one webhook URL PER tool. We bake the salonId
// directly into each tool's URL at sync time instead of relying on
// dynamic-variable field names we can't confirm, and protect the endpoint
// with our own static shared secret (a query param) rather than trying to
// reproduce ElevenLabs' own webhook-signing scheme.
function toolWebhookUrl(baseWebhookUrl: string, toolName: ToolName, salonId: string): string {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET ?? "";
  const url = new URL(`${baseWebhookUrl}/${toolName}`);
  url.searchParams.set("salonId", salonId);
  if (secret) url.searchParams.set("secret", secret);
  return url.toString();
}

type JsonSchema = {
  type: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  description?: string;
};

// ElevenLabs' webhook-tool request_body_schema is NOT plain JSON Schema -
// confirmed live from a real sync attempt (422 response), it requires:
// (a) every property/items node to carry a `description` (or one of a few
// other "how to fill this" markers we don't use), and (b) `type` to be a
// single literal tag - a nullable union like ["object", "null"] isn't
// supported for object/array types (string/number/boolean nullable unions
// are fine, but our only nullable non-primitive is preferredTimeRange, so
// dropping "null" and relying on the field being non-required is enough).
function normalizeType(type: string | string[]): string {
  if (Array.isArray(type)) return type.find((t) => t !== "null") ?? "string";
  return type;
}

function normalizeProperty(node: JsonSchema, fallbackKey: string): Record<string, unknown> {
  const result: Record<string, unknown> = {
    type: normalizeType(node.type),
    description: node.description ?? `Wert für ${fallbackKey}`,
  };
  if (node.properties) {
    result.properties = Object.fromEntries(
      Object.entries(node.properties).map(([key, value]) => [key, normalizeProperty(value, key)])
    );
  }
  if (node.items) result.items = normalizeProperty(node.items, "Element");
  return result;
}

function buildTools(config: VoiceAgentConfig) {
  const customTools = (Object.keys(toolJsonSchemas) as ToolName[]).map((name) => {
    const schema = toolJsonSchemas[name] as JsonSchema;
    return {
      type: "webhook",
      name,
      description: toolDescriptions[name],
      // UNVERIFIED: exact webhook-tool config shape (api_schema nesting,
      // whether params are body vs query) — this follows ElevenLabs'
      // general "webhook tool with a JSON body schema" documentation.
      api_schema: {
        url: toolWebhookUrl(config.webhookUrl, name, config.salonId),
        method: "POST",
        request_body_schema: {
          type: "object",
          properties: Object.fromEntries(
            Object.entries(schema.properties ?? {}).map(([key, value]) => [key, normalizeProperty(value, key)])
          ),
          required: schema.required ?? [],
        },
      },
    };
  });

  // UNVERIFIED: exact system-tool name for hanging up - mirrors Retell's
  // built-in end_call tool. If ElevenLabs names this differently, the
  // agent simply won't hang up on its own; everything else still works.
  const endCallTool = { type: "system", name: "end_call", description: "Beendet den Anruf höflich, nachdem du dich verabschiedet hast und die Anruferin/der Anrufer nichts mehr möchte." };

  return [...customTools, endCallTool];
}

export class ElevenLabsProvider implements VoiceProvider {
  readonly name = "elevenlabs";

  isConfigured(): boolean {
    return Boolean(process.env.ELEVENLABS_API_KEY);
  }

  async syncAgent(config: VoiceAgentConfig, existing?: { agentId?: string | null; llmId?: string | null }) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "ELEVENLABS_API_KEY ist nicht gesetzt. Siehe .env.example." };
    }
    const headers = { "xi-api-key": apiKey, "Content-Type": "application/json" };

    try {
      const agentBody = {
        name: `hallomia-${config.salonId}`,
        conversation_config: {
          agent: {
            first_message: toSpokenGerman(config.greeting),
            language: "de",
            prompt: {
              prompt: buildPromptFromConfig(config),
              tools: buildTools(config),
            },
          },
          tts: {
            // Falls back to ElevenLabs' own default voice if none is set -
            // pick a real German voice ID from the ElevenLabs voice library
            // under "KI-Einstellungen" once synced, then sync again.
            voice_id: config.voiceId || undefined,
            // ElevenLabs rejects non-English agents outright without this:
            // "Non-english Agents must use turbo or flash V2_5" (confirmed
            // live). Turbo v2.5 is the more natural-sounding of the two
            // multilingual-capable options; Flash v2.5 trades some quality
            // for lower latency if turbo ever feels too slow in a real call.
            model_id: "eleven_turbo_v2_5",
          },
        },
      };

      const response = existing?.agentId
        ? await fetch(`${ELEVENLABS_API_BASE}/v1/convai/agents/${existing.agentId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(agentBody),
          })
        : await fetch(`${ELEVENLABS_API_BASE}/v1/convai/agents/create`, {
            method: "POST",
            headers,
            body: JSON.stringify(agentBody),
          });

      if (!response.ok) {
        return { ok: false as const, error: `ElevenLabs Agent Fehler (${response.status}): ${await response.text()}` };
      }
      const json = (await response.json()) as { agent_id: string };
      const agentId = json.agent_id ?? existing?.agentId;
      if (!agentId) {
        return { ok: false as const, error: "ElevenLabs hat keine agent_id zurückgegeben." };
      }

      // ElevenLabs bundles prompt + tools + voice into one Agent object -
      // there's no separate "LLM" resource like Retell's, so llmId just
      // mirrors agentId to satisfy the shared VoiceProvider return shape.
      return { ok: true as const, agentId, llmId: agentId };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Unbekannter Fehler bei der ElevenLabs-Synchronisation." };
    }
  }

  verifyWebhookSignature(_payload: string, signatureHeader: string | null): boolean {
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
    if (!secret) return false;
    if (!signatureHeader) return false;
    const a = Buffer.from(secret);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}

export const elevenLabsProvider = new ElevenLabsProvider();
