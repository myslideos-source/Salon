-- Internal sales pipeline (section: Akquise) - HalloMia's own list of
-- prospective salon customers to call/visit, not customer-facing data.
-- Platform-admin only, no salon_id (this isn't scoped to a tenant).
create table sales_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  email text,
  website text,
  distance_km numeric,
  status text not null default 'neu',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sales_leads enable row level security;

create policy sales_leads_admin_all on sales_leads
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
