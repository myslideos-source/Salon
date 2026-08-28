-- Branchenvorlagen — additiv. Nur lesend genutzt (Vorschläge fürs
-- Onboarding); solange `salons.industry_template_id` null bleibt, ändert
-- sich für bestehende Salons nichts. Ein Template liefert Vorschläge, keine
-- Zwänge: alles bleibt nach Auswahl frei bearbeitbar.

create table industry_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  terminology jsonb not null default '{}'::jsonb,
  example_services jsonb not null default '[]'::jsonb,
  example_custom_questions jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table salons add column industry_template_id uuid references industry_templates(id) on delete set null;

alter table industry_templates enable row level security;
-- Public read (needed pre-signup for an industry picker on the landing
-- page / onboarding); only platform admins curate the catalog.
create policy industry_templates_select on industry_templates
  for select using (true);
create policy industry_templates_admin_write on industry_templates
  for insert with check (public.is_platform_admin());
create policy industry_templates_admin_update on industry_templates
  for update using (public.is_platform_admin());
create policy industry_templates_admin_delete on industry_templates
  for delete using (public.is_platform_admin());

insert into industry_templates (key, name, description, terminology, example_services, sort_order) values
  ('hairdresser', 'Friseur & Barbershop', 'Haarschnitte, Farbe, Bart',
    '{"service": "Leistung", "employee": "Stylist"}',
    '["Damenschnitt", "Herrenschnitt", "Farbe", "Bart"]', 1),
  ('beauty', 'Kosmetik- & Nagelstudio', 'Kosmetik- und Nagelbehandlungen',
    '{"service": "Behandlung"}',
    '["Maniküre", "Pediküre", "Gesichtsbehandlung"]', 2),
  ('physio', 'Physiotherapie & Massage', 'Behandlungstermine',
    '{"service": "Behandlung", "employee": "Therapeut:in"}',
    '["Erstbehandlung", "Massage", "Folgetermin"]', 3),
  ('medical', 'Arzt- & Zahnarztpraxis', 'Sprechstunden und Behandlungen',
    '{"service": "Terminart", "employee": "Behandler:in"}',
    '["Erstuntersuchung", "Kontrolltermin", "Beratung"]', 4),
  ('craft', 'Handwerksbetrieb', 'Aufträge und Vor-Ort-Termine',
    '{"service": "Auftrag", "request": "Anfrage"}',
    '["Vor-Ort-Besichtigung", "Reparatur", "Wartung"]', 5),
  ('consulting', 'Beratung & Coaching', 'Erstgespräche und Beratungstermine',
    '{"service": "Beratung"}',
    '["Erstgespräch", "Beratung", "Folgetermin"]', 6),
  ('automotive', 'Werkstatt', 'Fahrzeugservice',
    '{"service": "Serviceart", "resource": "Fahrzeug"}',
    '["Inspektion", "Reifenwechsel", "Reparatur"]', 7),
  ('restaurant', 'Restaurant & Gastronomie', 'Tischreservierungen',
    '{"service": "Reservierung", "resource": "Tisch"}',
    '["Tischreservierung"]', 8),
  ('other', 'Andere Branche', 'Individuell konfigurierbar', '{}', '[]', 99);
