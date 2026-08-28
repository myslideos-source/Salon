import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCall, linkCallCallback, markCallHandoff } from "@/lib/voice/call-ingest";
import { createCallbackRequest, findCustomer } from "@/lib/voice/tools";
import { parseTwilioForm, isTwilioRequestValid, resolveSalonIdByDialedNumber, verificationUrl, xmlEscape } from "@/lib/voice/providers/twilio-webhook-helpers";

// Twilio's own Voice webhook (TwiML). Twilio is a raw telephony carrier,
// not a hosted conversational agent (see providers/twilio.ts) — so unlike
// the Retell/ElevenLabs webhooks, which forward LLM tool calls, this route
// runs a small, honest IVR itself: greet the caller, offer a callback or a
// forward to a human. It deliberately does NOT pretend to hold a real
// conversation the way Mia does on Retell/ElevenLabs — a salon that wants
// that needs one of those configured as its voice provider, with Twilio
// only carrying the call underneath (BYO SIP trunk), or Twilio used
// standalone for salons that just need reliable intake + callback capture.

function twiml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function sayDe(text: string) {
  return `<Say language="de-DE">${xmlEscape(text)}</Say>`;
}

export async function POST(req: Request) {
  const params = await parseTwilioForm(req);
  const signature = req.headers.get("x-twilio-signature");
  if (!isTwilioRequestValid(req, params, signature)) {
    return new Response("invalid signature", { status: 401 });
  }

  const supabase = createAdminClient();
  const salonId = await resolveSalonIdByDialedNumber(supabase, params.To);
  if (!salonId) {
    return twiml(sayDe("Diese Nummer ist derzeit nicht mit einem Unternehmen verbunden.") + "<Hangup/>");
  }

  const { data: settings } = await supabase
    .from("voice_settings")
    .select("greeting, forwarding_number, handoff_number, recording_enabled, assistant_name")
    .eq("salon_id", salonId)
    .maybeSingle();

  const callSid = params.CallSid;
  if (callSid) {
    await ensureCall(supabase, { salonId, providerCallId: callSid, phoneNumber: params.From ?? null, direction: "inbound" });
  }

  const digits = params.Digits;
  const forwardTo = settings?.forwarding_number || settings?.handoff_number || null;

  // Step 2: caller pressed a menu option from the initial Gather.
  if (digits === "1") {
    const callback = await createCallbackRequest(supabase, salonId, {
      phone: params.From ?? "",
      reason: "Über Twilio-Telefonie angefragt (kein Sprach-KI-Anbieter für diese Nummer konfiguriert).",
    });
    if (callback.ok && callSid) {
      const call = await ensureCall(supabase, { salonId, providerCallId: callSid, phoneNumber: params.From ?? null });
      await linkCallCallback(supabase, call.id);
    }
    return twiml(sayDe("Vielen Dank. Wir rufen Sie so schnell wie möglich zurück. Auf Wiederhören.") + "<Hangup/>");
  }

  if (digits === "2" && forwardTo) {
    if (callSid) {
      const call = await ensureCall(supabase, { salonId, providerCallId: callSid, phoneNumber: params.From ?? null });
      await markCallHandoff(supabase, call.id);
    }
    const appUrl = (process.env.APP_URL ?? new URL(req.url).origin).replace(/\/$/, "");
    const recordAttrs = settings?.recording_enabled
      ? ` record="record-from-answer" recordingStatusCallback="${xmlEscape(`${appUrl}/api/voice/webhook/twilio/events`)}"`
      : "";
    return twiml(
      (settings?.recording_enabled ? sayDe("Dieses Gespräch kann zu Qualitätszwecken aufgezeichnet werden.") : "") +
        sayDe("Sie werden verbunden.") +
        `<Dial${recordAttrs}>${xmlEscape(forwardTo)}</Dial>`
    );
  }

  // Step 1: greet and offer the menu. Known caller gets a slightly warmer
  // "Grundregel: bestehende Kunden anhand der Telefonnummer erkennen" nod,
  // matching the concept's recognition rule even in this non-AI fallback.
  const known = params.From ? await findCustomer(supabase, salonId, params.From) : { ok: false as const, error: "" };
  const greetingPrefix =
    known.ok && known.data.found ? `Willkommen zurück, ${known.data.first_name}. ` : "";
  const assistantName = settings?.assistant_name || "unser Team";
  const greeting = settings?.greeting || `Willkommen, hier ist ${assistantName}.`;

  const menuParts = [`${greetingPrefix}${greeting}`, "Für einen Rückruf drücken Sie die 1."];
  if (forwardTo) menuParts.push("Um verbunden zu werden, drücken Sie die 2.");

  return twiml(
    `<Gather numDigits="1" timeout="8" action="${xmlEscape(verificationUrl(req))}" method="POST">` +
      sayDe(menuParts.join(" ")) +
      "</Gather>" +
      sayDe("Wir haben keine Eingabe erhalten. Auf Wiederhören.") +
      "<Hangup/>"
  );
}
