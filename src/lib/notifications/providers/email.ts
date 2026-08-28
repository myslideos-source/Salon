import "server-only";

// E-Mail-Zustellung für die Benachrichtigungsgrundlage (Konzeptabschnitt
// "Benachrichtigungen"). Nutzt Resends HTTP-API direkt per fetch, exakt
// nach demselben isConfigured()/send()-Muster wie der bestehende
// Twilio-SMS-Anbieter (src/lib/sms/providers/twilio.ts) — ohne
// RESEND_API_KEY läuft der Code real weiter, versendet aber schlicht
// nichts (kein Fake-Versand, keine erfundene Zustellung).

const RESEND_API_BASE = "https://api.resend.com";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATIONS_FROM_EMAIL);
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATIONS_FROM_EMAIL;
  if (!apiKey || !from) {
    return { ok: false, error: "E-Mail-Versand ist nicht konfiguriert (RESEND_API_KEY/NOTIFICATIONS_FROM_EMAIL fehlen)." };
  }

  try {
    const response = await fetch(`${RESEND_API_BASE}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `Resend Fehler (${response.status}): ${await response.text()}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unbekannter Fehler beim E-Mail-Versand." };
  }
}
