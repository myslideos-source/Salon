-- Generische Ressourcen (Räume, Fahrzeuge, Geräte, Tische, …) — additive.
--
-- Data foundation only: booking/availability logic (checking a resource is
-- free before offering a slot) is scheduling-engine work for the calendar
-- phase and is intentionally not touched here. No exclusion/overlap guard
-- is added on appointment_resources yet for the same reason — add it
-- alongside the availability engine integration, not before.

create table resources (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  name text not null,
  type text not null default 'other' check (type in ('room', 'seat', 'vehicle', 'equipment', 'table', 'other')),
  description text,
  color text not null default '#8A7159',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index resources_salon_idx on resources (salon_id);

create table resource_working_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);
create index resource_working_hours_resource_idx on resource_working_hours (resource_id);

-- Which resources a service is allowed to use (many-to-many, mirrors
-- employee_services).
create table service_resources (
  service_id uuid not null references services(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  salon_id uuid not null references salons(id) on delete cascade,
  primary key (service_id, resource_id)
);

-- Which resources are actually assigned to a given appointment.
create table appointment_resources (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete restrict,
  salon_id uuid not null references salons(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (appointment_id, resource_id)
);
create index appointment_resources_appt_idx on appointment_resources (appointment_id);
create index appointment_resources_resource_idx on appointment_resources (resource_id);

-- ── RLS (same managed-service pattern as employees/services) ────────────
alter table resources enable row level security;
alter table resource_working_hours enable row level security;
alter table service_resources enable row level security;
alter table appointment_resources enable row level security;

create policy resources_select on resources
  for select using (public.is_salon_member(salon_id));
create policy resources_admin_write on resources
  for insert with check (public.is_platform_admin());
create policy resources_admin_update on resources
  for update using (public.is_platform_admin());
create policy resources_admin_delete on resources
  for delete using (public.is_platform_admin());

create policy rwh_select on resource_working_hours
  for select using (public.is_salon_member(salon_id));
create policy rwh_admin_write on resource_working_hours
  for insert with check (public.is_platform_admin());
create policy rwh_admin_update on resource_working_hours
  for update using (public.is_platform_admin());
create policy rwh_admin_delete on resource_working_hours
  for delete using (public.is_platform_admin());

create policy sr_select on service_resources
  for select using (public.is_salon_member(salon_id));
create policy sr_admin_write on service_resources
  for insert with check (public.is_platform_admin());
create policy sr_admin_delete on service_resources
  for delete using (public.is_platform_admin());

-- appointment_resources follows appointment write access (any salon
-- member may assign a resource to an appointment they can already edit).
create policy ar_select on appointment_resources
  for select using (public.is_salon_member(salon_id));
create policy ar_write on appointment_resources
  for insert with check (public.is_salon_member(salon_id));
create policy ar_delete on appointment_resources
  for delete using (public.is_salon_member(salon_id));
