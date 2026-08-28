-- FAQ als eigene, strukturierte Tabelle (bisher nur Freitext in
-- voice_settings.custom_prompt). Additiv, ersetzt nichts.

create table faq (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  question text not null,
  answer text not null,
  category text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index faq_salon_idx on faq (salon_id, sort_order);

alter table faq enable row level security;
create policy faq_select on faq
  for select using (public.is_salon_member(salon_id));
create policy faq_write on faq
  for insert with check (public.has_permission(salon_id, 'manage_settings'));
create policy faq_update on faq
  for update using (public.has_permission(salon_id, 'manage_settings'));
create policy faq_delete on faq
  for delete using (public.has_permission(salon_id, 'manage_settings'));
