-- Anfragen & Rückrufe als eigenständige Domäne.
--
-- `callback_requests` stays exactly as it is (still backing the existing
-- /app/requests page) — nothing is dropped or renamed. `requests` is the
-- new, branch-neutral superset (a callback is just one category of
-- request), and existing callback_requests rows are copied forward into it
-- below so historical data isn't lost or duplicated-with-drift.

create table requests (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  call_id uuid references calls(id) on delete set null,
  category text not null default 'general'
    check (category in ('general', 'callback', 'quote', 'complaint', 'information', 'other')),
  subject text,
  description text,
  desired_callback_from timestamptz,
  desired_callback_to timestamptz,
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high', 'urgent')),
  assigned_employee_id uuid references employees(id) on delete set null,
  attachments jsonb not null default '[]'::jsonb,
  status text not null default 'new'
    check (status in ('new', 'in_review', 'callback_scheduled', 'quote_required', 'in_progress', 'done', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index requests_salon_status_idx on requests (salon_id, status);
create index requests_salon_created_idx on requests (salon_id, created_at desc);

alter table requests enable row level security;
create policy requests_select on requests
  for select using (public.is_salon_member(salon_id));
create policy requests_write on requests
  for insert with check (public.is_salon_member(salon_id));
create policy requests_update on requests
  for update using (public.is_salon_member(salon_id));
create policy requests_delete on requests
  for delete using (public.has_permission(salon_id, 'manage_requests'));

-- Lossless continuity: bring existing callback_requests forward as
-- category 'callback' requests, mapping their smaller status set onto the
-- new one. The original table is left untouched.
insert into requests (salon_id, customer_id, call_id, category, description, urgency, status, notes, created_at)
select
  cb.salon_id,
  cb.customer_id,
  cb.call_id,
  'callback',
  nullif(trim(both E'\n' from coalesce(cb.reason, '') || case when cb.note is not null then E'\n' || cb.note else '' end), ''),
  'normal',
  case cb.status when 'open' then 'new' when 'contacted' then 'in_progress' when 'resolved' then 'done' else 'new' end,
  cb.note,
  cb.requested_at
from callback_requests cb;
