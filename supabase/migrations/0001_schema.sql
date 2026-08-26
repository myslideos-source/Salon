-- SalonCall AI — core schema
-- Multi-tenant: every salon-scoped table carries salon_id.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ─────────────────────────────────────────────────────────────────────────
-- Platform admins (allowlist, managed only via service role)
-- ─────────────────────────────────────────────────────────────────────────
create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Salons
-- ─────────────────────────────────────────────────────────────────────────
create table salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Europe/Berlin',
  phone text,
  address text,
  logo_url text,
  status text not null default 'active' check (status in ('active', 'paused', 'trial')),
  ai_active boolean not null default true,
  slot_granularity_minutes int not null default 15 check (slot_granularity_minutes in (5, 10, 15, 30)),
  earliest_booking_lead_minutes int not null default 60,
  max_advance_booking_days int not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table salon_users (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  unique (salon_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Employees
-- ─────────────────────────────────────────────────────────────────────────
create table employees (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  avatar_url text,
  color text not null default '#B08968',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table employee_working_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table employee_absences (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  type text not null default 'other' check (type in ('vacation', 'sick', 'break', 'training', 'private', 'other')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  check (start_at < end_at)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Services
-- ─────────────────────────────────────────────────────────────────────────
create table services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name text not null,
  category text,
  duration_minutes int not null check (duration_minutes > 0),
  price_cents int not null default 0 check (price_cents >= 0),
  buffer_before_minutes int not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes int not null default 0 check (buffer_after_minutes >= 0),
  color text not null default '#8A7159',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table employee_services (
  employee_id uuid not null references employees(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  salon_id uuid not null references salons(id) on delete cascade,
  duration_minutes int,
  primary key (employee_id, service_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Customers
-- ─────────────────────────────────────────────────────────────────────────
create table customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null,
  email text,
  preferred_employee_id uuid references employees(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, phone)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Appointments
-- ─────────────────────────────────────────────────────────────────────────
create table appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete restrict,
  employee_id uuid not null references employees(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked', 'completed', 'cancelled', 'no_show')),
  source text not null default 'manual' check (source in ('voice_ai', 'manual', 'online_booking')),
  total_price_cents int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_at < end_at),
  period tstzrange generated always as (tstzrange(start_at, end_at, '[)')) stored
);

-- Hard double-booking guard at the database level: no two *booked*
-- appointments for the same employee may overlap in time. This holds even
-- under concurrent inserts (e.g. two simultaneous phone calls).
alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (employee_id with =, period with &&)
  where (status = 'booked');

create index appointments_salon_start_idx on appointments (salon_id, start_at);
create index appointments_employee_start_idx on appointments (employee_id, start_at);
create index appointments_customer_idx on appointments (customer_id);

create table appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  salon_id uuid not null references salons(id) on delete cascade,
  duration_minutes int not null,
  price_cents int not null,
  sort_order int not null default 0
);

create index appointment_services_appointment_idx on appointment_services (appointment_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Calls & callbacks
-- ─────────────────────────────────────────────────────────────────────────
create table calls (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  phone_number text,
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound')),
  started_at timestamptz not null default now(),
  duration_seconds int not null default 0,
  topic text,
  outcome text check (outcome in ('appointment_booked', 'appointment_rescheduled', 'appointment_cancelled', 'info_given', 'callback_requested', 'no_action', 'handoff')),
  appointment_id uuid references appointments(id) on delete set null,
  status text not null default 'completed' check (status in ('completed', 'missed', 'voicemail', 'in_progress')),
  transcript jsonb not null default '[]'::jsonb,
  provider_call_id text,
  created_at timestamptz not null default now()
);

create index calls_salon_started_idx on calls (salon_id, started_at desc);

create table callback_requests (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  call_id uuid references calls(id) on delete set null,
  phone_number text not null,
  reason text,
  note text,
  status text not null default 'open' check (status in ('open', 'contacted', 'resolved')),
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index callback_requests_salon_status_idx on callback_requests (salon_id, status);

-- ─────────────────────────────────────────────────────────────────────────
-- Voice settings & business hours
-- ─────────────────────────────────────────────────────────────────────────
create table voice_settings (
  salon_id uuid primary key references salons(id) on delete cascade,
  voice_id text not null default 'default',
  greeting text not null default '',
  personality text not null default 'freundlich' check (personality in ('freundlich', 'professionell', 'locker', 'elegant')),
  mention_prices boolean not null default true,
  offer_alternatives boolean not null default true,
  respect_employee_preference boolean not null default true,
  offer_callback boolean not null default true,
  detect_new_customers boolean not null default true,
  phone_number text,
  forwarding_number text,
  provider text not null default 'retell',
  provider_agent_id text,
  updated_at timestamptz not null default now()
);

create table business_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  is_closed boolean not null default false,
  start_time time,
  end_time time,
  created_at timestamptz not null default now(),
  unique (salon_id, weekday)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Audit log
-- ─────────────────────────────────────────────────────────────────────────
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references salons(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_salon_idx on audit_logs (salon_id, created_at desc);
