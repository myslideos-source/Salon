-- "Meine Mia": universelle KI-Einstellungen aus dem Konzept — additive
-- Spalten mit sicheren Defaults. Bewusst nur die Datengrundlage: das
-- Einbinden in prompt.ts, die Tool-Schemas und die Voice-Provider-Adapter
-- ist Telefonie-/KI-Konfigurationsarbeit für eine spätere Phase und bleibt
-- hier unangetastet, ebenso wie die RLS (weiterhin admin-only UPDATE,
-- gleiches Muster wie die bestehenden Spalten dieser Tabelle).

alter table voice_settings add column assistant_name text not null default 'Mia';
alter table voice_settings add column formality text not null default 'sie' check (formality in ('du', 'sie'));
alter table voice_settings add column languages text[] not null default '{de}';
alter table voice_settings add column never_mention text;
alter table voice_settings add column after_hours_behavior text not null default 'offer_callback'
  check (after_hours_behavior in ('offer_callback', 'voicemail', 'info_only'));
alter table voice_settings add column handoff_number text;
alter table voice_settings add column urgent_keywords text[] not null default '{}';
alter table voice_settings add column notify_after_call boolean not null default true;
