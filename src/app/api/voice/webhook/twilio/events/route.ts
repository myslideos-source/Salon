import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeCall, attachRecording } from "@/lib/voice/call-ingest";
import { parseTwilioForm, isTwilioRequestValid, resolveSalonIdByDialedNumber, resolveSalonIdByCallSid } from "@/lib/voice/providers/twilio-webhook-helpers";

// Twilio's call-status callback ("Gespräch beendet") and, on the same
// endpoint, its separate recording-status callback ("Transkript verfügbar"
// has no Twilio equivalent without a transcription add-on, so this route
// only ever populates the recording side of that pair for Twilio calls).
// Twilio posts both kinds of event as distinct requests distinguished by
// which fields are present (CallStatus vs. RecordingStatus).
export async function POST(req: Request) {
  const params = await parseTwilioForm(req);
  const signature = req.headers.get("x-twilio-signature");
  if (!isTwilioRequestValid(req, params, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Recording callback: RecordingStatus=completed, RecordingUrl present.
  // Twilio's RecordingStatusCallback payload carries no `To`/`From`, so
  // salonId comes from the `calls` row this CallSid's status callback
  // already created instead. Only ever stored if the business has legally
  // activated recording (voice_settings.recording_enabled) — never
  // automatically, matching the concept requirement even though Twilio
  // itself already required record="record-from-answer" to be explicitly
  // set (see twilio/voice route), so this is defense in depth, not the
  // only gate.
  if (params.RecordingStatus && params.CallSid) {
    if (params.RecordingStatus !== "completed" || !params.RecordingUrl) return NextResponse.json({ ok: true });
    const salonId = await resolveSalonIdByCallSid(supabase, params.CallSid);
    if (!salonId) return NextResponse.json({ error: "call not found for this recording" }, { status: 404 });
    const { data: settings } = await supabase.from("voice_settings").select("recording_enabled").eq("salon_id", salonId).maybeSingle();
    if (!settings?.recording_enabled) return NextResponse.json({ ok: true, note: "recording not legally activated, url discarded" });

    await attachRecording(supabase, {
      salonId,
      providerCallId: params.CallSid,
      recordingUrl: params.RecordingUrl,
      consentRecording: true,
    });
    return NextResponse.json({ ok: true });
  }

  // Status callback: CallStatus present (queued, ringing, in-progress, completed, ...).
  // Includes `To`, unlike the recording callback above.
  if (params.CallStatus && params.CallSid) {
    if (params.CallStatus !== "completed") return NextResponse.json({ ok: true });
    const salonId = (await resolveSalonIdByDialedNumber(supabase, params.To)) ?? (await resolveSalonIdByCallSid(supabase, params.CallSid));
    if (!salonId) return NextResponse.json({ error: "salon not found for this number" }, { status: 404 });

    await finalizeCall(supabase, {
      salonId,
      providerCallId: params.CallSid,
      phoneNumber: params.From ?? null,
      durationSeconds: Number(params.CallDuration ?? 0),
      status: "completed",
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unrecognized payload", receivedKeys: Object.keys(params) }, { status: 400 });
}
