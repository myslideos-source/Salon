-- Gesprächsübersicht: Zusammenfassung, Dringlichkeit/Stimmung, Einwilligung
-- zur Aufzeichnung — additive Spalten auf `calls`.

alter table calls add column summary text;
alter table calls add column urgency text check (urgency in ('low', 'normal', 'high', 'urgent'));
alter table calls add column sentiment text check (sentiment in ('positive', 'neutral', 'negative'));
alter table calls add column resolved boolean not null default true;
alter table calls add column consent_recording boolean;
alter table calls add column recording_url text;
