-- Standorte (Locations) — additive, non-breaking.
--
-- Every existing salon today implicitly *is* one location. This migration
-- introduces a real `locations` table without changing that assumption for
-- existing data: every current salon gets exactly one implicit default
-- location (backfilled below), so nothing that already works can break.
-- Multi-location salons and a location picker in the calendar UI are a
-- later, calendar-touching phase — this only lays the data foundation.

create table locations (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  timezone text,
  is_default boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index locations_salon_idx on locations (salon_id);
-- At most one default location per salon (used as the implicit target
-- wherever a record's location_id is still null).
create unique index locations_salon_default_uidx on locations (salon_id) where is_default;

alter table employees add column location_id uuid references locations(id) on delete set null;
alter table services add column location_id uuid references locations(id) on delete set null;
alter table appointments add column location_id uuid references locations(id) on delete set null;
alter table business_hours add column location_id uuid references locations(id) on delete set null;

-- Öffnungszeiten-Ausnahmen: Feiertage und abweichende Öffnungszeiten je
-- Standort, orthogonal zu den bestehenden wöchentlichen `business_hours`.
create table business_hour_exceptions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  date date not null,
  is_closed boolean not null default true,
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now(),
  unique (salon_id, location_id, date)
);
create index business_hour_exceptions_salon_date_idx on business_hour_exceptions (salon_id, date);

-- ── Backfill: give every existing salon its implicit default location ────
insert into locations (salon_id, name, address, phone, timezone, is_default, active)
select id, name, coalesce(address, name), phone, timezone, true, true from salons;

update employees e set location_id = l.id
  from locations l where l.salon_id = e.salon_id and l.is_default;
update services s set location_id = l.id
  from locations l where l.salon_id = s.salon_id and l.is_default;
update appointments a set location_id = l.id
  from locations l where l.salon_id = a.salon_id and l.is_default;
update business_hours b set location_id = l.id
  from locations l where l.salon_id = b.salon_id and l.is_default;

-- ── RLS ────────────────────────────────────────────────────────────────
alter table locations enable row level security;
alter table business_hour_exceptions enable row level security;

create policy locations_select on locations
  for select using (public.is_salon_member(salon_id));
create policy locations_admin_write on locations
  for insert with check (public.is_platform_admin());
create policy locations_admin_update on locations
  for update using (public.is_platform_admin());
create policy locations_admin_delete on locations
  for delete using (public.is_platform_admin());

create policy bhe_select on business_hour_exceptions
  for select using (public.is_salon_member(salon_id));
create policy bhe_admin_write on business_hour_exceptions
  for insert with check (public.is_platform_admin());
create policy bhe_admin_update on business_hour_exceptions
  for update using (public.is_platform_admin());
create policy bhe_admin_delete on business_hour_exceptions
  for delete using (public.is_platform_admin());
