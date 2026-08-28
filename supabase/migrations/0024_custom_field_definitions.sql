-- Individuelle Felder — generisches Framework, damit jedes Unternehmen
-- eigene Zusatzfelder definieren kann (z. B. "Kennzeichen" beim Kunden
-- einer Werkstatt), ohne dass dafür Migrationen nötig sind. Die Werte
-- selbst landen in den bereits vorhandenen bzw. neu angelegten
-- `custom_fields`-jsonb-Spalten (siehe customers, 0017); diese Tabelle
-- beschreibt nur, welche Felder pro Unternehmen existieren.

create table custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  entity_type text not null check (entity_type in ('customer', 'request', 'appointment', 'employee')),
  key text not null,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'number', 'date', 'boolean', 'select', 'textarea')),
  options jsonb not null default '[]'::jsonb,
  required boolean not null default false,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (salon_id, entity_type, key)
);
create index custom_field_definitions_salon_idx on custom_field_definitions (salon_id, entity_type);

alter table custom_field_definitions enable row level security;
create policy cfd_select on custom_field_definitions
  for select using (public.is_salon_member(salon_id));
create policy cfd_write on custom_field_definitions
  for insert with check (public.has_permission(salon_id, 'manage_settings'));
create policy cfd_update on custom_field_definitions
  for update using (public.has_permission(salon_id, 'manage_settings'));
create policy cfd_delete on custom_field_definitions
  for delete using (public.has_permission(salon_id, 'manage_settings'));
