-- Retell's agent references a separate "Retell LLM" (response engine)
-- object; track its id alongside the agent id so subsequent syncs update
-- both instead of creating duplicates each time.
alter table voice_settings add column provider_llm_id text;
