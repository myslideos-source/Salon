-- Adds ElevenLabs as a second, parallel Voice-AI provider (see
-- lib/voice/provider.ts). Kept as separate nullable columns rather than
-- reusing provider_agent_id/provider_llm_id so a salon can have both a
-- Retell agent and an ElevenLabs agent synced at once - `provider` picks
-- which one actually receives live calls, without losing the other's sync
-- state when switching back and forth during testing.
alter table voice_settings
  add column elevenlabs_agent_id text,
  add column elevenlabs_voice_id text;
