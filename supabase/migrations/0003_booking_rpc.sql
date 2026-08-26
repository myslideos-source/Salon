-- book_appointment: atomic booking of an appointment + its services.
--
-- Runs as SECURITY INVOKER (the default) so the caller's RLS policies still
-- apply — a salon user can only book within their own salon, exactly as
-- with a direct INSERT. The appointments_no_overlap exclusion constraint
-- (0001_schema.sql) is the real double-booking guard: if two requests race
-- for the same employee/time, the second INSERT here raises a Postgres
-- exclusion-violation (SQLSTATE 23P01), which the caller maps to a friendly
-- "slot no longer available" response instead of a silent overwrite.
create or replace function public.book_appointment(
  p_salon_id uuid,
  p_customer_id uuid,
  p_employee_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_service_ids uuid[],
  p_source text default 'manual',
  p_notes text default null
)
returns appointments
language plpgsql
as $$
declare
  v_appt appointments;
  v_total_price int := 0;
  v_sort int := 0;
  v_service record;
begin
  if array_length(p_service_ids, 1) is null then
    raise exception 'at least one service is required';
  end if;

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, source, notes, total_price_cents)
  values (p_salon_id, p_customer_id, p_employee_id, p_start_at, p_end_at, coalesce(p_source, 'manual'), p_notes, 0)
  returning * into v_appt;

  for v_service in
    select
      s.id,
      s.price_cents,
      coalesce(es.duration_minutes, s.duration_minutes) as duration_minutes
    from services s
    left join employee_services es on es.service_id = s.id and es.employee_id = p_employee_id
    where s.id = any(p_service_ids) and s.salon_id = p_salon_id
  loop
    insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order)
    values (v_appt.id, v_service.id, p_salon_id, v_service.duration_minutes, v_service.price_cents, v_sort);
    v_total_price := v_total_price + v_service.price_cents;
    v_sort := v_sort + 1;
  end loop;

  update appointments set total_price_cents = v_total_price where id = v_appt.id
  returning * into v_appt;

  return v_appt;
end;
$$;
