-- Konzeptabschnitt "Benachrichtigungen": Als gelesen markieren.
-- `notifications_update` (0022_notifications.sql) erlaubt UPDATE nur für
-- `user_id = auth.uid()` — an alle Mitglieder gerichtete Zeilen
-- (`user_id is null`, siehe notify() in src/lib/notifications/notify.ts)
-- könnte damit niemand als gelesen markieren. Enge SECURITY-DEFINER-RPCs
-- nach dem etablierten Muster (toggle_salon_ai, update_call_recording_consent)
-- statt einer breiteren UPDATE-Policy: jedes Salon-Mitglied darf eine
-- an sein Unternehmen gerichtete Zeile als gelesen markieren, unabhängig
-- davon, ob sie persönlich oder an alle gerichtet ist.

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update notifications
  set read_at = coalesce(read_at, now())
  where id = p_notification_id
    and public.is_salon_member(salon_id)
    and (user_id is null or user_id = auth.uid());
end;
$$;

create or replace function public.mark_all_notifications_read(target_salon_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_salon_member(target_salon_id) then
    raise exception 'not authorized';
  end if;
  update notifications
  set read_at = now()
  where salon_id = target_salon_id
    and (user_id is null or user_id = auth.uid())
    and read_at is null;
end;
$$;
