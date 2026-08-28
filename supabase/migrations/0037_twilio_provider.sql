-- Twilio als dritter, provider-agnostic austauschbarer Telefonie-Provider
-- (siehe src/lib/voice/providers/twilio.ts). Eigene Spalte nach demselben
-- Muster wie elevenlabs_agent_id: Twilio kann unabhängig von Retell/
-- ElevenLabs synchronisiert bleiben, ohne deren gespeicherte IDs zu
-- überschreiben — nur voice_settings.phone_number/provider entscheidet,
-- welcher Provider echte Anrufe entgegennimmt.
alter table voice_settings add column twilio_phone_number_sid text;
comment on column voice_settings.twilio_phone_number_sid is 'Twilio "Incoming Phone Number" Resource-Sid, deren Voice-Webhook auf /api/voice/webhook/twilio/voice zeigt.';
