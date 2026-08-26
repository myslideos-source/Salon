import "server-only";
import type { SmsProvider } from "../provider";

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

// Twilio accepts Basic Auth with either the main Account SID + Auth Token,
// or a scoped API Key SID (starts with "SK") + API Key Secret - the Account
// SID always stays in the resource URL either way. API keys are the safer
// choice (revocable independently of the main account), so they're tried
// first if present.
function resolveCredentials(): { username: string; password: string } | null {
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  if (apiKeySid && apiKeySecret) return { username: apiKeySid, password: apiKeySecret };

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  if (accountSid && authToken) return { username: accountSid, password: authToken };

  return null;
}

export class TwilioProvider implements SmsProvider {
  readonly name = "twilio";

  isConfigured(): boolean {
    return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_FROM_NUMBER && resolveCredentials());
  }

  async send(to: string, body: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const from = process.env.TWILIO_FROM_NUMBER;
    const credentials = resolveCredentials();
    if (!accountSid || !from || !credentials) {
      return {
        ok: false,
        error:
          "Twilio ist nicht konfiguriert (TWILIO_ACCOUNT_SID/TWILIO_FROM_NUMBER + entweder TWILIO_API_KEY_SID/TWILIO_API_KEY_SECRET oder TWILIO_AUTH_TOKEN).",
      };
    }

    try {
      const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64");
      const response = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      });

      if (!response.ok) {
        return { ok: false, error: `Twilio Fehler (${response.status}): ${await response.text()}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Unbekannter Fehler beim SMS-Versand." };
    }
  }
}

export const twilioProvider = new TwilioProvider();
