-- Benachrichtigungen — In-App-Ablage + konfigurierbare Kanal-Präferenzen
-- pro Nutzer. Additiv; das tatsächliche Versenden (E-Mail/SMS/Push) bleibt
-- Aufgabe späterer Integrationsarbeit, hier entsteht nur die Datengrundlage
-- plus die In-App-Anzeige-Tabelle selbst.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  -- null = an alle Mitglieder des Salons gerichtet, statt an eine Person.
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in (
    'appointment_booked', 'appointment_changed', 'appointment_cancelled',
    'callback_requested', 'request_unresolved', 'urgent_request',
    'customer_unreachable', 'employee_absence', 'calendar_conflict'
  )),
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'sms', 'push')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_salon_user_idx on notifications (salon_id, user_id, created_at desc);
create index notifications_unread_idx on notifications (salon_id, user_id) where read_at is null;

create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  channel text not null check (channel in ('in_app', 'email', 'sms', 'push')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (salon_id, user_id, event_type, channel)
);

alter table notifications enable row level security;
alter table notification_preferences enable row level security;

create policy notifications_select on notifications
  for select using (public.is_salon_member(salon_id) and (user_id is null or user_id = auth.uid()));
create policy notifications_write on notifications
  for insert with check (public.is_salon_member(salon_id));
create policy notifications_update on notifications
  for update using (user_id = auth.uid());

create policy notification_preferences_select on notification_preferences
  for select using (user_id = auth.uid() or public.is_platform_admin());
create policy notification_preferences_write on notification_preferences
  for insert with check (user_id = auth.uid() and public.is_salon_member(salon_id));
create policy notification_preferences_update on notification_preferences
  for update using (user_id = auth.uid());
create policy notification_preferences_delete on notification_preferences
  for delete using (user_id = auth.uid());
