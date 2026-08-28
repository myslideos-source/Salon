-- 0014_locations.sql backfilled a default location for every salon that
-- existed *at that time*, but any salon created afterwards had no trigger
-- creating one — discovered by extending supabase/tests/rls_and_booking.sql
-- with a locations tenant-isolation check (a freshly inserted test salon
-- had zero location rows). Every salon must always have exactly one
-- default location, so this closes the gap going forward.

create or replace function public.create_default_location()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into locations (salon_id, name, address, phone, timezone, is_default, active)
  values (new.id, new.name, new.address, new.phone, new.timezone, true, true);
  return new;
end;
$$;

create trigger salons_create_default_location
  after insert on salons
  for each row execute function public.create_default_location();
