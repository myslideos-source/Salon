-- Lets each customer add their own free-text business context/instructions
-- to the voice agent's prompt (see lib/voice/prompt.ts) - the branch-
-- agnostic building block for supporting industries beyond hairdressers
-- without maintaining a separate prompt template per industry.
alter table voice_settings add column custom_prompt text;
