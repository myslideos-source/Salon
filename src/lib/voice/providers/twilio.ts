import "server-only";
import crypto from "node:crypto";
import type { VoiceAgentConfig, VoiceProvider } from "../provider";

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

function authHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

/**
 * Twilio is a raw telephony carrier, not a hosted conversational-AI agent
 * like Retell/ElevenLabs — there is no "agent"/"LLM" resource to create.
 * Its role in the provider-agnostic interface (VoiceProvider) is: own a
 * real phone number and point that number's Voice webhook at our own
 * `/api/voice/webhook/twilio/voice` route, which then runs a small,
 * honest IVR (greeting, forward to a human, or take a callback request —
 * see that route) rather than pretending to run a full conversational
 * agent it doesn't have. A salon that wants Mia to actually hold a
 * conversation needs Retell or ElevenLabs configured as the voice
 * provider; Twilio is the option for salons that just need reliable call
 * intake, forwarding and callback capture without a conversational AI.
 *
 * `agentId`/`llmId` in the shared VoiceProvider return shape are reused to
 * store the Twilio "Incoming Phone Number" resource Sid, exactly the way
 * ElevenLabs reuses them for its single Agent id (see providers/
 * elevenlabs.ts) — keeps the shared sync/resync code paths identical
 * across all three providers instead of adding Twilio-specific columns.
 */
export class TwilioProvider implements VoiceProvider {
  readonly name = "twilio";

  isConfigured(): boolean {
    return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  }

  async syncAgent(config: VoiceAgentConfig, existing?: { agentId?: string | null; llmId?: string | null }) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      return { ok: false as const, error: "TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN sind nicht gesetzt. Siehe .env.example." };
    }
    if (!config.phoneNumber) {
      return { ok: false as const, error: "Bitte zuerst eine Telefonnummer hinterlegen, bevor Twilio verbunden wird." };
    }
    const headers = { Authorization: authHeader(accountSid, authToken), "Content-Type": "application/x-www-form-urlencoded" };

    try {
      let phoneNumberSid = existing?.agentId ?? null;

      if (!phoneNumberSid) {
        const lookup = await fetch(
          `${TWILIO_API_BASE}/Accounts/${accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(config.phoneNumber)}`,
          { headers }
        );
        if (!lookup.ok) {
          return { ok: false as const, error: `Twilio Nummernsuche fehlgeschlagen (${lookup.status}): ${await lookup.text()}` };
        }
        const lookupJson = (await lookup.json()) as { incoming_phone_numbers?: { sid: string }[] };
        phoneNumberSid = lookupJson.incoming_phone_numbers?.[0]?.sid ?? null;
        if (!phoneNumberSid) {
          return {
            ok: false as const,
            error: `Keine Twilio-Telefonnummer ${config.phoneNumber} im verbundenen Twilio-Konto gefunden. Die Nummer muss zuerst im Twilio-Konto vorhanden sein.`,
          };
        }
      }

      const body = new URLSearchParams({
        VoiceUrl: `${config.webhookUrl}/voice`,
        VoiceMethod: "POST",
        StatusCallback: `${config.webhookUrl}/events`,
        StatusCallbackMethod: "POST",
        StatusCallbackEvent: "initiated ringing answered completed",
      });
      const update = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/IncomingPhoneNumbers/${phoneNumberSid}.json`, {
        method: "POST",
        headers,
        body,
      });
      if (!update.ok) {
        return { ok: false as const, error: `Twilio Webhook-Verknüpfung fehlgeschlagen (${update.status}): ${await update.text()}` };
      }

      return { ok: true as const, agentId: phoneNumberSid, llmId: phoneNumberSid };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Unbekannter Fehler bei der Twilio-Synchronisation." };
    }
  }

  /** Not used for Twilio — see verifyRequestSignature for the real check (needs the full request URL, not just the body). */
  verifyWebhookSignature(): boolean {
    return false;
  }

  /**
   * Twilio's actual signature scheme (X-Twilio-Signature): base64(HMAC-SHA1(
   * authToken, url + sorted "key"+"value" concatenation of every POST
   * param)). Documented at
   * https://www.twilio.com/docs/usage/security#validating-requests — unlike
   * Retell/ElevenLabs (a static shared secret we invented ourselves), this
   * is Twilio's own, fully specified algorithm, so it's implemented
   * precisely rather than permissively.
   */
  verifyRequestSignature(fullUrl: string, params: Record<string, string>, signatureHeader: string | null): boolean {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken || !signatureHeader) return false;

    let data = fullUrl;
    for (const key of Object.keys(params).sort()) {
      data += key + params[key];
    }
    const expected = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");

    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}

export const twilioProvider = new TwilioProvider();
