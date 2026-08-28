-- Branchenvorlagen vervollständigen + Grundlage des Einrichtungsassistenten
-- (Schritte 1–3: Unternehmen, Branche, Unternehmensdaten) — additiv.
--
-- Die Auswahl einer Branchenvorlage bleibt reine Vorschlags-Ebene: Sie
-- befüllt lediglich `salons.onboarding_draft` (frei editierbar/löschbar,
-- siehe Onboarding-UI) und `salons.industry_template_id`. Kein bestehender
-- Code liest `industry_template_id`, um Verhalten zu verzweigen — eine
-- Branchenwahl aktiviert also keine feste, unumkehrbare Logik und kann
-- jederzeit erneut geändert werden.

-- ── Fehlende Branchenvorlagen ergänzen (Kanzlei, Fotografie) ─────────────
-- Bestehende sort_order-Werte werden neu vergeben, damit die beiden neuen
-- Vorlagen thematisch einsortiert werden können (1 hairdresser, 2 beauty,
-- 3 physio, 4 medical, 5 legal, 6 craft, 7 consulting, 8 automotive,
-- 9 restaurant, 10 photography, 99 other).
update industry_templates set sort_order = 6 where key = 'craft';
update industry_templates set sort_order = 7 where key = 'consulting';
update industry_templates set sort_order = 8 where key = 'automotive';
update industry_templates set sort_order = 9 where key = 'restaurant';

insert into industry_templates (key, name, description, terminology, example_services, sort_order) values
  ('legal', 'Kanzlei', 'Beratungstermine und Mandate',
    '{"service": "Termin", "employee": "Anwält:in", "customer": "Mandant:in"}',
    '["Erstberatung", "Beratungstermin", "Vertragsprüfung"]', 5),
  ('photography', 'Fotografie', 'Fototermine und Shootings',
    '{"service": "Fototermin", "employee": "Fotograf:in"}',
    '["Porträtshooting", "Hochzeitsfotografie", "Business-Fotos"]', 10);

-- ── Vorschlags-Buchungsfragen & benötigte Felder je Vorlage ──────────────
-- `example_custom_questions` war bislang für alle Vorlagen leer;
-- `example_required_fields` ist neu. Beides sind reine Vorschläge (siehe
-- Konzept "individuelle Buchungsfragen" bzw. "notwendige Kundenangaben")
-- und bleiben nach Übernahme ins Onboarding frei bearbeitbar/löschbar.
alter table industry_templates add column example_required_fields jsonb not null default '[]'::jsonb;

update industry_templates set
  example_custom_questions = '["Welche Haarlänge haben Sie?", "Wünschen Sie eine Typberatung?", "Ist es Ihr erster Termin bei uns?"]',
  example_required_fields = '["Haarlänge", "Wunschfarbe"]'
  where key = 'hairdresser';

update industry_templates set
  example_custom_questions = '["Haben Sie Allergien oder Unverträglichkeiten?", "Welche Art von Behandlung wünschen Sie?"]',
  example_required_fields = '["Hauttyp", "Allergien"]'
  where key = 'beauty';

update industry_templates set
  example_custom_questions = '["Liegt eine ärztliche Verordnung vor?", "Wo befinden sich Ihre Beschwerden?"]',
  example_required_fields = '["Verordnung vorhanden", "Beschwerdebereich"]'
  where key = 'physio';

update industry_templates set
  example_custom_questions = '["Ist es Ihr erster Termin bei uns?", "Liegt eine Überweisung vor?", "Worum geht es bei Ihrem Anliegen?"]',
  example_required_fields = '["Versicherungsart", "Überweisung vorhanden"]'
  where key = 'medical';

update industry_templates set
  example_custom_questions = '["Um welches Rechtsgebiet geht es?", "Liegt bereits ein Aktenzeichen vor?", "Sind Sie bereits Mandant:in bei uns?"]',
  example_required_fields = '["Rechtsgebiet", "Aktenzeichen"]'
  where key = 'legal';

update industry_templates set
  example_custom_questions = '["Um welches Anliegen handelt es sich?", "Handelt es sich um einen Neubau oder Altbau?", "Wie dringend ist Ihr Anliegen?"]',
  example_required_fields = '["Adresse der Baustelle", "Art des Anliegens"]'
  where key = 'craft';

update industry_templates set
  example_custom_questions = '["Worum geht es in Ihrem Anliegen?", "Ist es Ihr erstes Gespräch mit uns?"]',
  example_required_fields = '["Thema der Beratung"]'
  where key = 'consulting';

update industry_templates set
  example_custom_questions = '["Um welches Fahrzeug handelt es sich?", "Was ist das Kennzeichen?", "Was ist das Anliegen (z. B. Inspektion, Reparatur)?"]',
  example_required_fields = '["Fahrzeugmodell", "Kennzeichen"]'
  where key = 'automotive';

update industry_templates set
  example_custom_questions = '["Wie viele Personen kommen?", "Gibt es besondere Wünsche (z. B. Allergien)?"]',
  example_required_fields = '["Anzahl Gäste"]'
  where key = 'restaurant';

update industry_templates set
  example_custom_questions = '["Um welchen Anlass handelt es sich?", "Wo soll das Shooting stattfinden?", "Wie viele Personen werden fotografiert?"]',
  example_required_fields = '["Anlass", "Ort des Shootings"]'
  where key = 'photography';

-- 'other' bleibt bewusst ohne Vorschläge — vollständig frei konfigurierbar.

-- ── Onboarding-Fortschritt & Entwurfs-Daten auf `salons` ─────────────────
-- `onboarding_step`: höchste erreichte Schrittnummer des 12-Schritte-
-- Assistenten (siehe Konzept), für Fortschrittsanzeige & Wiederaufnahme.
-- `onboarding_draft`: editierbare/löschbare Vorschläge aus der gewählten
-- Branchenvorlage (Terminarten, Buchungsfragen, benötigte Felder) sowie
-- eigene Ergänzungen — reine Entwurfsdaten, noch keine echten Terminarten.
-- `onboarding_completed_at`: bleibt null, bis der gesamte 12-Schritte-
-- Assistent abgeschlossen ist (spätere Fachbereichs-Phasen).
alter table salons add column onboarding_step int not null default 1 check (onboarding_step between 1 and 12);
alter table salons add column onboarding_draft jsonb not null default '{}'::jsonb;
alter table salons add column onboarding_completed_at timestamptz;

-- Bereits bestehende (von HalloMia betreut angelegte) Salons gelten
-- rückwirkend als eingerichtet, damit für sie keine Einrichtungs-Hinweise
-- erscheinen.
update salons set onboarding_step = 12, onboarding_completed_at = created_at
  where onboarding_completed_at is null;

-- ── Self-Service: eigenes Unternehmen anlegen & Onboarding-Daten pflegen ─
-- Eng gefasste SECURITY DEFINER-RPCs nach dem bestehenden Muster
-- (toggle_salon_ai, update_voice_settings_customer_fields, …): Die
-- restriktive Managed-Service-RLS auf `salons` (nur Plattform-Admins
-- dürfen INSERT/UPDATE) bleibt unverändert bestehen. Diese beiden RPCs
-- öffnen gezielt nur das, was der Einrichtungsassistent für die Schritte
-- "Unternehmen", "Branche" und "Unternehmensdaten" braucht.

create or replace function public.create_own_salon(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from salon_users where user_id = auth.uid()) then
    raise exception 'already has a company';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'name required';
  end if;

  insert into salons (name, slug, status, ai_active, onboarding_step)
    values (trim(p_name), p_slug, 'trial', false, 1)
    returning id into v_salon_id;

  insert into salon_users (salon_id, user_id, role) values (v_salon_id, auth.uid(), 'owner');

  -- Gleiche Grundausstattung wie beim admin-seitigen Anlegen (siehe
  -- createSalonAction), damit nachgelagerte Seiten (z. B. "Meine Mia")
  -- unabhängig vom Einrichtungsfortschritt konsistent funktionieren.
  insert into business_hours (salon_id, weekday, is_closed, start_time, end_time)
    select v_salon_id, weekday, weekday = 1, case when weekday = 1 then null else '09:00:00'::time end,
      case when weekday = 1 then null else '18:00:00'::time end
    from generate_series(0, 6) as weekday;

  insert into voice_settings (salon_id, greeting)
    values (v_salon_id, 'Hallo und herzlich willkommen bei ' || trim(p_name) || '. Sie sprechen mit unserer digitalen Telefonassistenz. Wie kann ich Ihnen helfen?');

  return v_salon_id;
end;
$$;

-- Aktualisiert die in Schritt 1–3 erfassten Felder. Alle Parameter sind
-- optional (null = unverändert lassen), damit jeder Schritt unabhängig und
-- per Autospeicherung einzelne Felder schreiben kann.
create or replace function public.update_own_salon_onboarding(
  target_salon_id uuid,
  p_name text default null,
  p_slug text default null,
  p_industry_template_id uuid default null,
  p_phone text default null,
  p_address text default null,
  p_timezone text default null,
  p_onboarding_draft jsonb default null,
  p_onboarding_step int default null
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

  update salons set
    name = coalesce(nullif(trim(p_name), ''), name),
    slug = coalesce(p_slug, slug),
    industry_template_id = coalesce(p_industry_template_id, industry_template_id),
    phone = coalesce(p_phone, phone),
    address = coalesce(p_address, address),
    timezone = coalesce(p_timezone, timezone),
    onboarding_draft = coalesce(p_onboarding_draft, onboarding_draft),
    onboarding_step = greatest(onboarding_step, coalesce(p_onboarding_step, onboarding_step)),
    updated_at = now()
  where id = target_salon_id;
end;
$$;
