-- Flexible Terminarten: individuelle Buchungsfragen & notwendige
-- Kundenangaben — additive.
--
-- Wiring these into the voice prompt/tool schemas and the booking modal is
-- calendar/telephony work for a later phase; this only adds the storage.

alter table services add column custom_questions jsonb not null default '[]'::jsonb;
alter table services add column required_customer_fields jsonb not null default '[]'::jsonb;
alter table services add column bookable_phone boolean not null default true;
alter table services add column bookable_online boolean not null default true;

-- Answers collected for a service's custom_questions at booking time.
create table appointment_answers (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  salon_id uuid not null references salons(id) on delete cascade,
  question text not null,
  answer text,
  created_at timestamptz not null default now()
);
create index appointment_answers_appt_idx on appointment_answers (appointment_id);

alter table appointment_answers enable row level security;
create policy appointment_answers_select on appointment_answers
  for select using (public.is_salon_member(salon_id));
create policy appointment_answers_write on appointment_answers
  for insert with check (public.is_salon_member(salon_id));
create policy appointment_answers_update on appointment_answers
  for update using (public.is_salon_member(salon_id));
create policy appointment_answers_delete on appointment_answers
  for delete using (public.is_salon_member(salon_id));
