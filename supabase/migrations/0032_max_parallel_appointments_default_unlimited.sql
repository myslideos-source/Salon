-- 0031 defaulted max_parallel_appointments to 1 (not null), which would
-- retroactively cap every existing multi-employee salon to a single
-- concurrent appointment company-wide the moment the availability engine
-- started reading it — a real regression for salons like "Hair Lounge
-- Milano" where several employees legitimately have simultaneous
-- appointments today. The setting must default to "no cap" (null) so
-- nothing changes for a salon until it explicitly configures a limit.
alter table salons alter column max_parallel_appointments drop not null;
alter table salons alter column max_parallel_appointments drop default;
update salons set max_parallel_appointments = null;

create or replace function public.update_own_booking_rules(
  target_salon_id uuid,
  p_slot_granularity_minutes int,
  p_earliest_booking_lead_minutes int,
  p_max_advance_booking_days int,
  p_max_parallel_appointments int default null,
  p_max_appointments_per_day int default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission(target_salon_id, 'manage_settings') then
    raise exception 'not authorized';
  end if;
  if p_slot_granularity_minutes not in (5, 10, 15, 30) then
    raise exception 'invalid slot granularity';
  end if;
  if p_earliest_booking_lead_minutes < 0 or p_max_advance_booking_days < 1 then
    raise exception 'invalid booking rule value';
  end if;
  if p_max_parallel_appointments is not null and p_max_parallel_appointments < 1 then
    raise exception 'invalid booking rule value';
  end if;
  if p_max_appointments_per_day is not null and p_max_appointments_per_day < 1 then
    raise exception 'invalid booking rule value';
  end if;

  update salons set
    slot_granularity_minutes = p_slot_granularity_minutes,
    earliest_booking_lead_minutes = p_earliest_booking_lead_minutes,
    max_advance_booking_days = p_max_advance_booking_days,
    max_parallel_appointments = p_max_parallel_appointments,
    max_appointments_per_day = p_max_appointments_per_day,
    updated_at = now()
  where id = target_salon_id;
end;
$$;
