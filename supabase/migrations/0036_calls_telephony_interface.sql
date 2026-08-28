-- "Anrufe, Gespräche und Telefonie-Schnittstelle" (siehe
-- docs/HALLOMIA_UNIVERSAL_KONZEPT.md, Abschnitte "Gesprächsübersicht" und
-- "Telefonie und Integrationen"). Additiv, keine bestehende Migration wird
-- verändert.

-- ── Gesprächsübersicht: interne Notizen ─────────────────────────────────
-- Bislang fehlte ein Feld für interne, für den Anrufer nicht sichtbare
-- Notizen zu einem Gespräch (Konzept: "interne Notizen" unter
-- "Gesprächsübersicht"). `calls_update` erlaubt bereits jedem Salon-Mitglied
-- ein UPDATE auf eigene Zeilen (0002_rls.sql) — keine neue Policy nötig.
alter table calls add column notes text;

-- Zeigt Gespräche mit Rückrufwunsch schnell an (Filter "Rückruf
-- erforderlich" verknüpft calls <-> callback_requests über call_id).
create index if not exists idx_callback_requests_call_id on callback_requests (call_id) where call_id is not null;
create index if not exists idx_calls_provider_call_id on calls (provider_call_id) where provider_call_id is not null;

-- ── Audioaufzeichnung: rechtliche Aktivierung, niemals automatisch ──────
-- Konzept: "Berücksichtige Einwilligungen und rechtliche Aktivierung von
-- Aufzeichnungen. Aktiviere Audioaufzeichnung nicht automatisch." Das ist
-- eine bewusste rechtliche Entscheidung des Unternehmens (z. B. weil ein
-- entsprechender Hinweis/Einwilligungstext in der eigenen Ansage verwendet
-- wird), keine technische Zugangsdaten-Änderung wie phone_number/
-- provider_agent_id — deshalb self-service über eine eigene, eng gefasste
-- RPC (Vorbild toggle_salon_ai) statt einer breiten UPDATE-Policy auf
-- voice_settings, die auch die admin-only Felder öffnen würde.
alter table voice_settings add column recording_enabled boolean not null default false;

create or replace function public.update_call_recording_consent(
  target_salon_id uuid,
  p_recording_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_salon_member(target_salon_id) then
    raise exception 'not authorized';
  end if;

  update voice_settings
  set recording_enabled = p_recording_enabled, updated_at = now()
  where salon_id = target_salon_id;
end;
$$;

comment on column voice_settings.recording_enabled is
  'Rechtliche Aktivierung der Audioaufzeichnung durch das Unternehmen selbst. Muss aktiv eingeschaltet werden, ist niemals Default-an. Getrennt von calls.consent_recording (Einwilligung je einzelnem Gespräch).';
comment on column calls.notes is 'Interne Notizen zum Gespräch, für Anrufer nicht sichtbar.';
