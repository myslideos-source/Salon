-- SalonCall AI — Row Level Security
-- Two roles: platform_admin (full access, via allowlist table) and
-- salon_user (scoped to their own salon via salon_users membership).
-- The service-role key (used only server-side, e.g. the voice webhook)
-- bypasses RLS entirely and is never exposed to the browser.

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

create or replace function public.is_salon_member(target_salon_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from salon_users su
      where su.salon_id = target_salon_id and su.user_id = auth.uid()
    )
    or public.is_platform_admin();
$$;

-- Enable RLS everywhere.
alter table platform_admins enable row level security;
alter table salons enable row level security;
alter table salon_users enable row level security;
alter table employees enable row level security;
alter table employee_working_hours enable row level security;
alter table employee_absences enable row level security;
alter table services enable row level security;
alter table employee_services enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;
alter table appointment_services enable row level security;
alter table calls enable row level security;
alter table callback_requests enable row level security;
alter table voice_settings enable row level security;
alter table business_hours enable row level security;
alter table audit_logs enable row level security;

-- platform_admins: only admins can see the allowlist. No public insert
-- policy — membership is granted via the service role only.
create policy platform_admins_select on platform_admins
  for select using (public.is_platform_admin());

-- salons: members can see their own salon; only admins can create/edit.
create policy salons_select on salons
  for select using (public.is_salon_member(id));
create policy salons_admin_write on salons
  for insert with check (public.is_platform_admin());
create policy salons_admin_update on salons
  for update using (public.is_platform_admin());
create policy salons_admin_delete on salons
  for delete using (public.is_platform_admin());

-- salon_users: members can see co-members of their own salon; only admins manage.
create policy salon_users_select on salon_users
  for select using (public.is_salon_member(salon_id));
create policy salon_users_admin_write on salon_users
  for insert with check (public.is_platform_admin());
create policy salon_users_admin_update on salon_users
  for update using (public.is_platform_admin());
create policy salon_users_admin_delete on salon_users
  for delete using (public.is_platform_admin());

-- employees: salon members read-only, admin manages (managed-service model).
create policy employees_select on employees
  for select using (public.is_salon_member(salon_id));
create policy employees_admin_write on employees
  for insert with check (public.is_platform_admin());
create policy employees_admin_update on employees
  for update using (public.is_platform_admin());
create policy employees_admin_delete on employees
  for delete using (public.is_platform_admin());

create policy ewh_select on employee_working_hours
  for select using (public.is_salon_member(salon_id));
create policy ewh_admin_write on employee_working_hours
  for insert with check (public.is_platform_admin());
create policy ewh_admin_update on employee_working_hours
  for update using (public.is_platform_admin());
create policy ewh_admin_delete on employee_working_hours
  for delete using (public.is_platform_admin());

-- employee_absences: salon users may manage these day to day.
create policy absences_select on employee_absences
  for select using (public.is_salon_member(salon_id));
create policy absences_write on employee_absences
  for insert with check (public.is_salon_member(salon_id));
create policy absences_update on employee_absences
  for update using (public.is_salon_member(salon_id));
create policy absences_delete on employee_absences
  for delete using (public.is_salon_member(salon_id));

-- services: salon members read-only, admin manages.
create policy services_select on services
  for select using (public.is_salon_member(salon_id));
create policy services_admin_write on services
  for insert with check (public.is_platform_admin());
create policy services_admin_update on services
  for update using (public.is_platform_admin());
create policy services_admin_delete on services
  for delete using (public.is_platform_admin());

create policy es_select on employee_services
  for select using (public.is_salon_member(salon_id));
create policy es_admin_write on employee_services
  for insert with check (public.is_platform_admin());
create policy es_admin_update on employee_services
  for update using (public.is_platform_admin());
create policy es_admin_delete on employee_services
  for delete using (public.is_platform_admin());

-- customers: salon members can view, create and update; delete admin-only.
create policy customers_select on customers
  for select using (public.is_salon_member(salon_id));
create policy customers_write on customers
  for insert with check (public.is_salon_member(salon_id));
create policy customers_update on customers
  for update using (public.is_salon_member(salon_id));
create policy customers_admin_delete on customers
  for delete using (public.is_platform_admin());

-- appointments: salon members can view, create and update (reschedule /
-- change status); hard delete is admin-only (cancellations use status).
create policy appointments_select on appointments
  for select using (public.is_salon_member(salon_id));
create policy appointments_write on appointments
  for insert with check (public.is_salon_member(salon_id));
create policy appointments_update on appointments
  for update using (public.is_salon_member(salon_id));
create policy appointments_admin_delete on appointments
  for delete using (public.is_platform_admin());

create policy appointment_services_select on appointment_services
  for select using (public.is_salon_member(salon_id));
create policy appointment_services_write on appointment_services
  for insert with check (public.is_salon_member(salon_id));
create policy appointment_services_update on appointment_services
  for update using (public.is_salon_member(salon_id));
create policy appointment_services_delete on appointment_services
  for delete using (public.is_salon_member(salon_id));

-- calls: salon members can view; writes normally come from the service role
-- (voice webhook) but manual logging by salon staff is allowed too.
create policy calls_select on calls
  for select using (public.is_salon_member(salon_id));
create policy calls_write on calls
  for insert with check (public.is_salon_member(salon_id));
create policy calls_update on calls
  for update using (public.is_salon_member(salon_id));

create policy callback_requests_select on callback_requests
  for select using (public.is_salon_member(salon_id));
create policy callback_requests_write on callback_requests
  for insert with check (public.is_salon_member(salon_id));
create policy callback_requests_update on callback_requests
  for update using (public.is_salon_member(salon_id));

-- voice_settings: salon members read-only (so the UI can show current
-- config), only admins can change technical AI configuration.
create policy voice_settings_select on voice_settings
  for select using (public.is_salon_member(salon_id));
create policy voice_settings_admin_write on voice_settings
  for insert with check (public.is_platform_admin());
create policy voice_settings_admin_update on voice_settings
  for update using (public.is_platform_admin());
create policy voice_settings_admin_delete on voice_settings
  for delete using (public.is_platform_admin());

create policy business_hours_select on business_hours
  for select using (public.is_salon_member(salon_id));
create policy business_hours_admin_write on business_hours
  for insert with check (public.is_platform_admin());
create policy business_hours_admin_update on business_hours
  for update using (public.is_platform_admin());
create policy business_hours_admin_delete on business_hours
  for delete using (public.is_platform_admin());

-- audit_logs: internal, admin-only visibility.
create policy audit_logs_select on audit_logs
  for select using (public.is_platform_admin());
create policy audit_logs_write on audit_logs
  for insert with check (true);

-- RPC: lets a salon user toggle only their own salon's AI on/off (section
-- 37) without granting general UPDATE access to the salons table.
create or replace function public.toggle_salon_ai(target_salon_id uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_salon_member(target_salon_id) then
    raise exception 'not authorized';
  end if;
  update salons set ai_active = active, updated_at = now() where id = target_salon_id;
end;
$$;
