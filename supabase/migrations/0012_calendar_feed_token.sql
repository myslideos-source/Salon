-- Read-only ICS calendar subscription per salon, so appointments booked via
-- the AI automatically show up in a salon owner's existing phone calendar
-- app (Apple/Google Kalender "per URL abonnieren") without a full two-way
-- external-calendar integration. The token alone is the credential for the
-- public feed route (no session) - unguessable, salon-scoped, revocable.
alter table salons add column calendar_feed_token text unique;

create or replace function public.regenerate_calendar_feed_token(target_salon_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token text;
begin
  if not public.is_salon_member(target_salon_id) then
    raise exception 'not authorized';
  end if;

  new_token := lower(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));
  update salons set calendar_feed_token = new_token where id = target_salon_id;
  return new_token;
end;
$$;
