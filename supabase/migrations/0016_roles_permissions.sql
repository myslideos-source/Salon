-- Rollen & konfigurierbare Berechtigungen — additive.
--
-- Widens salon_users.role from the binary owner/staff model to the five
-- roles from the concept (Inhaber, Administrator, Mitarbeiter, Empfang,
-- Nur-Kalenderzugriff) and introduces a configurable role→permission
-- matrix. Existing rows keep working unchanged: 'owner' and 'staff' remain
-- valid values, and the seeded defaults below reproduce today's behavior
-- for them (full salon access) — nothing regresses for current users.
--
-- This is deliberately *foundation only*: it does not rewrite RLS on the
-- pre-existing tables (employees, services, business_hours, customers,
-- appointments, voice_settings). Those either already follow a managed-
-- service model (admin-only writes) that a later self-service phase will
-- change deliberately, or are calendar/booking-critical and out of scope
-- for this pass. New tables introduced in this same phase (locations,
-- resources, requests, faq, …) do consume has_permission() where it makes
-- sense, so the permission model is exercised end-to-end from day one.

alter table salon_users drop constraint if exists salon_users_role_check;
alter table salon_users add constraint salon_users_role_check
  check (role in ('owner', 'administrator', 'staff', 'reception', 'calendar_only'));

create table role_permissions (
  id uuid primary key default gen_random_uuid(),
  -- null = platform-wide default for this role; a salon-specific row (same
  -- salon_id, role, permission_key) overrides it. This is what makes
  -- permissions "configurable" per company rather than hardcoded per role.
  salon_id uuid references salons(id) on delete cascade,
  role text not null check (role in ('owner', 'administrator', 'staff', 'reception', 'calendar_only')),
  permission_key text not null,
  allowed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, role, permission_key)
);
create index role_permissions_salon_idx on role_permissions (salon_id);

insert into role_permissions (salon_id, role, permission_key, allowed) values
  (null, 'owner', 'manage_company', true),
  (null, 'owner', 'manage_users', true),
  (null, 'owner', 'manage_settings', true),
  (null, 'owner', 'manage_services', true),
  (null, 'owner', 'manage_team', true),
  (null, 'owner', 'manage_calendar', true),
  (null, 'owner', 'manage_customers', true),
  (null, 'owner', 'manage_requests', true),
  (null, 'owner', 'view_calls', true),
  (null, 'owner', 'view_statistics', true),

  (null, 'administrator', 'manage_company', false),
  (null, 'administrator', 'manage_users', true),
  (null, 'administrator', 'manage_settings', true),
  (null, 'administrator', 'manage_services', true),
  (null, 'administrator', 'manage_team', true),
  (null, 'administrator', 'manage_calendar', true),
  (null, 'administrator', 'manage_customers', true),
  (null, 'administrator', 'manage_requests', true),
  (null, 'administrator', 'view_calls', true),
  (null, 'administrator', 'view_statistics', true),

  (null, 'staff', 'manage_company', false),
  (null, 'staff', 'manage_users', false),
  (null, 'staff', 'manage_settings', false),
  (null, 'staff', 'manage_services', false),
  (null, 'staff', 'manage_team', false),
  (null, 'staff', 'manage_calendar', true),
  (null, 'staff', 'manage_customers', true),
  (null, 'staff', 'manage_requests', true),
  (null, 'staff', 'view_calls', true),
  (null, 'staff', 'view_statistics', false),

  (null, 'reception', 'manage_company', false),
  (null, 'reception', 'manage_users', false),
  (null, 'reception', 'manage_settings', false),
  (null, 'reception', 'manage_services', false),
  (null, 'reception', 'manage_team', false),
  (null, 'reception', 'manage_calendar', true),
  (null, 'reception', 'manage_customers', true),
  (null, 'reception', 'manage_requests', true),
  (null, 'reception', 'view_calls', true),
  (null, 'reception', 'view_statistics', false),

  (null, 'calendar_only', 'manage_company', false),
  (null, 'calendar_only', 'manage_users', false),
  (null, 'calendar_only', 'manage_settings', false),
  (null, 'calendar_only', 'manage_services', false),
  (null, 'calendar_only', 'manage_team', false),
  (null, 'calendar_only', 'manage_calendar', true),
  (null, 'calendar_only', 'manage_customers', false),
  (null, 'calendar_only', 'manage_requests', false),
  (null, 'calendar_only', 'view_calls', false),
  (null, 'calendar_only', 'view_statistics', false);

create or replace function public.current_salon_role(target_salon_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from salon_users where salon_id = target_salon_id and user_id = auth.uid() limit 1;
$$;

-- Resolves whether the current user may perform `p_permission_key` in
-- `target_salon_id`: platform admins always may; otherwise a salon-specific
-- override wins, falling back to the platform default for that role, and
-- finally to false (deny by default for unknown permission keys).
create or replace function public.has_permission(target_salon_id uuid, p_permission_key text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_platform_admin()
    or coalesce(
      (select allowed from role_permissions
        where salon_id = target_salon_id
          and role = public.current_salon_role(target_salon_id)
          and permission_key = p_permission_key
        limit 1),
      (select allowed from role_permissions
        where salon_id is null
          and role = public.current_salon_role(target_salon_id)
          and permission_key = p_permission_key
        limit 1),
      false
    );
$$;

alter table role_permissions enable row level security;

-- Platform defaults (salon_id is null) are readable by any authenticated
-- salon member so the client can render "what can my role do"; salon-
-- specific overrides are only readable by members of that salon.
create policy role_permissions_select on role_permissions
  for select using (
    auth.uid() is not null and (salon_id is null or public.is_salon_member(salon_id))
  );
create policy role_permissions_write on role_permissions
  for insert with check (salon_id is not null and public.has_permission(salon_id, 'manage_users'));
create policy role_permissions_update on role_permissions
  for update using (salon_id is not null and public.has_permission(salon_id, 'manage_users'));
create policy role_permissions_delete on role_permissions
  for delete using (salon_id is not null and public.has_permission(salon_id, 'manage_users'));
