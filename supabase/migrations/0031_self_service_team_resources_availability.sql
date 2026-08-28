-- Sonderauftrag "Standorte, Team, Ressourcen und Verfügbarkeit" — additiv.
--
-- Migrationen 0014/0015/0016 haben die Datengrundlage (locations, resources,
-- resource_working_hours, business_hour_exceptions, role_permissions,
-- has_permission()) bereits geschaffen, aber bewusst ohne UI und ohne
-- Self-Service-Schreibrechte belassen ("Managed Service"-Modell: nur
-- Plattform-Admins durften schreiben). Dieser Schritt macht diese Bereiche
-- für Unternehmen selbst verwaltbar — Vorbild ist exakt das in 0016
-- vorbereitete Berechtigungsmodell (has_permission()), nicht enge
-- SECURITY DEFINER-RPCs, weil diese Tabellen (anders als salons/
-- voice_settings) keine sicherheitskritischen/abrechnungsrelevanten Felder
-- enthalten, die vor dem eigenen Unternehmen geschützt werden müssten.
--
-- Betroffen: employees, employee_working_hours, locations, resources,
-- resource_working_hours, service_resources, business_hours,
-- business_hour_exceptions. employee_absences war bereits self-service
-- (0002_rls.sql) und bleibt unverändert.

-- ── employees & employee_working_hours: manage_team ─────────────────────
drop policy if exists employees_admin_write on employees;
drop policy if exists employees_admin_update on employees;
drop policy if exists employees_admin_delete on employees;
create policy employees_write on employees
  for insert with check (public.has_permission(salon_id, 'manage_team'));
create policy employees_update on employees
  for update using (public.has_permission(salon_id, 'manage_team'));
create policy employees_delete on employees
  for delete using (public.has_permission(salon_id, 'manage_team'));

drop policy if exists ewh_admin_write on employee_working_hours;
drop policy if exists ewh_admin_update on employee_working_hours;
drop policy if exists ewh_admin_delete on employee_working_hours;
create policy ewh_write on employee_working_hours
  for insert with check (public.has_permission(salon_id, 'manage_team'));
create policy ewh_update on employee_working_hours
  for update using (public.has_permission(salon_id, 'manage_team'));
create policy ewh_delete on employee_working_hours
  for delete using (public.has_permission(salon_id, 'manage_team'));

-- ── resources & resource_working_hours & service_resources: manage_team ──
drop policy if exists resources_admin_write on resources;
drop policy if exists resources_admin_update on resources;
drop policy if exists resources_admin_delete on resources;
create policy resources_write on resources
  for insert with check (public.has_permission(salon_id, 'manage_team'));
create policy resources_update on resources
  for update using (public.has_permission(salon_id, 'manage_team'));
create policy resources_delete on resources
  for delete using (public.has_permission(salon_id, 'manage_team'));

drop policy if exists rwh_admin_write on resource_working_hours;
drop policy if exists rwh_admin_update on resource_working_hours;
drop policy if exists rwh_admin_delete on resource_working_hours;
create policy rwh_write on resource_working_hours
  for insert with check (public.has_permission(salon_id, 'manage_team'));
create policy rwh_update on resource_working_hours
  for update using (public.has_permission(salon_id, 'manage_team'));
create policy rwh_delete on resource_working_hours
  for delete using (public.has_permission(salon_id, 'manage_team'));

drop policy if exists sr_admin_write on service_resources;
drop policy if exists sr_admin_delete on service_resources;
create policy sr_write on service_resources
  for insert with check (public.has_permission(salon_id, 'manage_team'));
create policy sr_delete on service_resources
  for delete using (public.has_permission(salon_id, 'manage_team'));

-- ── locations & business_hours & business_hour_exceptions: manage_settings
drop policy if exists locations_admin_write on locations;
drop policy if exists locations_admin_update on locations;
drop policy if exists locations_admin_delete on locations;
create policy locations_write on locations
  for insert with check (public.has_permission(salon_id, 'manage_settings'));
create policy locations_update on locations
  for update using (public.has_permission(salon_id, 'manage_settings'));
create policy locations_delete on locations
  for delete using (public.has_permission(salon_id, 'manage_settings'));

drop policy if exists business_hours_admin_write on business_hours;
drop policy if exists business_hours_admin_update on business_hours;
drop policy if exists business_hours_admin_delete on business_hours;
create policy business_hours_write on business_hours
  for insert with check (public.has_permission(salon_id, 'manage_settings'));
create policy business_hours_update on business_hours
  for update using (public.has_permission(salon_id, 'manage_settings'));
create policy business_hours_delete on business_hours
  for delete using (public.has_permission(salon_id, 'manage_settings'));

drop policy if exists bhe_admin_write on business_hour_exceptions;
drop policy if exists bhe_admin_update on business_hour_exceptions;
drop policy if exists bhe_admin_delete on business_hour_exceptions;
create policy bhe_write on business_hour_exceptions
  for insert with check (public.has_permission(salon_id, 'manage_settings'));
create policy bhe_update on business_hour_exceptions
  for update using (public.has_permission(salon_id, 'manage_settings'));
create policy bhe_delete on business_hour_exceptions
  for delete using (public.has_permission(salon_id, 'manage_settings'));

-- ── Rückrufzeiträume (Konzept: "Zeiträume für telefonische Rückrufe") ────
-- Orthogonal zu den regulären Öffnungszeiten: mehrere Zeitfenster pro
-- Wochentag möglich (anders als business_hours, das genau ein Fenster pro
-- Tag kennt), da ein Unternehmen z. B. nur vormittags zurückrufen möchte.
create table callback_windows (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);
create index callback_windows_salon_idx on callback_windows (salon_id);

alter table callback_windows enable row level security;
create policy callback_windows_select on callback_windows
  for select using (public.is_salon_member(salon_id));
create policy callback_windows_write on callback_windows
  for insert with check (public.has_permission(salon_id, 'manage_settings'));
create policy callback_windows_update on callback_windows
  for update using (public.has_permission(salon_id, 'manage_settings'));
create policy callback_windows_delete on callback_windows
  for delete using (public.has_permission(salon_id, 'manage_settings'));

-- ── Buchungsregeln: parallele Termine & maximale Termine pro Tag ────────
-- slot_granularity_minutes/earliest_booking_lead_minutes/
-- max_advance_booking_days existierten bereits (0001_schema.sql); diese
-- beiden fehlten gegenüber dem Konzept.
alter table salons add column max_parallel_appointments int not null default 1
  check (max_parallel_appointments >= 1);
alter table salons add column max_appointments_per_day int
  check (max_appointments_per_day is null or max_appointments_per_day >= 1);

-- Eng gefasste RPC statt breiter UPDATE-Policy auf `salons` (dort liegen
-- auch geschützte Felder wie status/slug/ai_active — siehe toggle_salon_ai
-- und Risiko 2 im Umsetzungsplan). Deckt genau die Buchungsregeln ab.
create or replace function public.update_own_booking_rules(
  target_salon_id uuid,
  p_slot_granularity_minutes int,
  p_earliest_booking_lead_minutes int,
  p_max_advance_booking_days int,
  p_max_parallel_appointments int,
  p_max_appointments_per_day int default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission(target_salon_id, 'manage_settings') then
    raise exception 'not authorized';
  end if;
  if p_slot_granularity_minutes not in (5, 10, 15, 30) then
    raise exception 'invalid slot granularity';
  end if;
  if p_earliest_booking_lead_minutes < 0 or p_max_advance_booking_days < 1 or p_max_parallel_appointments < 1 then
    raise exception 'invalid booking rule value';
  end if;
  if p_max_appointments_per_day is not null and p_max_appointments_per_day < 1 then
    raise exception 'invalid booking rule value';
  end if;

  update salons set
    slot_granularity_minutes = p_slot_granularity_minutes,
    earliest_booking_lead_minutes = p_earliest_booking_lead_minutes,
    max_advance_booking_days = p_max_advance_booking_days,
    max_parallel_appointments = p_max_parallel_appointments,
    max_appointments_per_day = p_max_appointments_per_day,
    updated_at = now()
  where id = target_salon_id;
end;
$$;
