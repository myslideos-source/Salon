import "server-only";
import type { SmsProvider } from "../provider";

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

export class TwilioProvider implements SmsProvider {
  readonly name = "twilio";

  isConfigured(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER
    );
  }

  async send(to: string, body: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || !from) {
      return { ok: false, error: "Twilio ist nicht konfiguriert (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER)." };
    }

    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
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
