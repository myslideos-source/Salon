-- Manual DB-level verification for the two guarantees unit tests can't
-- cover (they need a real Postgres instance with RLS + the exclusion
-- constraint): double-booking prevention and tenant isolation.
--
-- Run against a project that already has the demo seed (supabase/seed.sql)
-- applied — e.g. via the Supabase SQL editor, or `supabase db execute -f`.
-- Everything it creates is cleaned up at the end.

-- ── 1) Double-booking guard ──────────────────────────────────────────────
-- Attempting to book an employee into a time range that overlaps an
-- existing *booked* appointment must fail with an exclusion violation,
-- even though the request goes through the normal booking RPC.
create temporary table test_results (name text, result text);

do $$
declare
  v_salon_id uuid; v_anna_id uuid; v_cust_id uuid;
begin
  select id into v_salon_id from salons where slug = 'hair-lounge-milano';
  select id into v_anna_id from employees where salon_id = v_salon_id and first_name = 'Anna';
  select id into v_cust_id from customers where salon_id = v_salon_id limit 1;

  begin
    -- Anna has a 09:00–10:00 appointment seeded for "today"; this overlaps it.
    perform book_appointment(
      v_salon_id, v_cust_id, v_anna_id,
      (((now() at time zone 'Europe/Berlin')::date::text || ' 09:30:00')::timestamp at time zone 'Europe/Berlin'),
      (((now() at time zone 'Europe/Berlin')::date::text || ' 10:30:00')::timestamp at time zone 'Europe/Berlin'),
      array[(select id from services where salon_id = v_salon_id and name = 'Herren Schnitt')],
      'manual', 'overlap test'
    );
    insert into test_results values ('double_booking_guard', 'FAIL: overlap succeeded');
  exception when exclusion_violation then
    insert into test_results values ('double_booking_guard', 'PASS');
  end;
end $$;

-- ── 2) Tenant isolation ──────────────────────────────────────────────────
-- A second salon's member must see their own salon's rows and nothing
-- from any other salon, purely via RLS (no application-layer filtering).
do $$
declare
  v_salon_a uuid; v_salon_b uuid; v_user_b uuid := gen_random_uuid();
  r1 boolean; r2 boolean; r3 boolean; r4 boolean; r5 boolean;
begin
  select id into v_salon_a from salons where slug = 'hair-lounge-milano';

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
  values ('00000000-0000-0000-0000-000000000000', v_user_b, 'authenticated', 'authenticated', 'tenant-test-b@example.com', crypt('x', gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb, now(), now(), false, false);

  insert into salons (name, slug) values ('Tenant Test Salon B', 'tenant-test-salon-b') returning id into v_salon_b;
  insert into salon_users (salon_id, user_id, role) values (v_salon_b, v_user_b, 'owner');
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_b, 'Isolated', 'Customer', '+49 000 0000');

  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('role', 'authenticated', true);

  select (select count(*) from salons where id = v_salon_b) = 1 into r1;
  select (select count(*) from customers where salon_id = v_salon_b) = 1 into r2;
  select (select count(*) from salons where id = v_salon_a) = 0 into r3;
  select (select count(*) from customers where salon_id = v_salon_a) = 0 into r4;
  select (select count(*) from appointments where salon_id = v_salon_a) = 0 into r5;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claim.sub', '', true);

  insert into test_results values
    ('own_salon_visible', case when r1 then 'PASS' else 'FAIL' end),
    ('own_customers_visible', case when r2 then 'PASS' else 'FAIL' end),
    ('other_salon_hidden', case when r3 then 'PASS' else 'FAIL' end),
    ('other_salon_customers_hidden', case when r4 then 'PASS' else 'FAIL' end),
    ('other_salon_appointments_hidden', case when r5 then 'PASS' else 'FAIL' end);

  delete from salons where id = v_salon_b;
  delete from auth.users where id = v_user_b;
end $$;

-- ── 2b) Tenant isolation for the new phase's tables (locations, requests) ─
-- Every salon gets an implicit default location (0014_locations.sql); a
-- second salon's member must see only their own salon's location and
-- requests, never salon A's — same guarantee as above, extended to the
-- newly introduced tables.
do $$
declare
  v_salon_a uuid; v_salon_b uuid; v_user_b uuid := gen_random_uuid();
  v_cust_b uuid;
  r1 boolean; r2 boolean; r3 boolean; r4 boolean;
begin
  select id into v_salon_a from salons where slug = 'hair-lounge-milano';

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
  values ('00000000-0000-0000-0000-000000000000', v_user_b, 'authenticated', 'authenticated', 'tenant-test-b2@example.com', crypt('x', gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb, now(), now(), false, false);

  insert into salons (name, slug) values ('Tenant Test Salon B2', 'tenant-test-salon-b2') returning id into v_salon_b;
  insert into salon_users (salon_id, user_id, role) values (v_salon_b, v_user_b, 'owner');
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_b, 'Isolated', 'Customer', '+49 000 0001') returning id into v_cust_b;
  insert into requests (salon_id, customer_id, category, description) values (v_salon_b, v_cust_b, 'general', 'Test-Anfrage B');

  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  perform set_config('role', 'authenticated', true);

  select (select count(*) from locations where salon_id = v_salon_b) = 1 into r1;
  select (select count(*) from locations where salon_id = v_salon_a) = 0 into r2;
  select (select count(*) from requests where salon_id = v_salon_b) = 1 into r3;
  select (select count(*) from requests where salon_id = v_salon_a) = 0 into r4;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claim.sub', '', true);

  insert into test_results values
    ('own_location_visible', case when r1 then 'PASS' else 'FAIL' end),
    ('other_salon_locations_hidden', case when r2 then 'PASS' else 'FAIL' end),
    ('own_requests_visible', case when r3 then 'PASS' else 'FAIL' end),
    ('other_salon_requests_hidden', case when r4 then 'PASS' else 'FAIL' end);

  delete from salons where id = v_salon_b;
  delete from auth.users where id = v_user_b;
end $$;

-- ── 3) Anonymous access ──────────────────────────────────────────────────
do $$
declare v_count int;
begin
  perform set_config('role', 'anon', true);
  select
    (select count(*) from salons) + (select count(*) from customers) +
    (select count(*) from appointments) + (select count(*) from platform_admins)
  into v_count;
  perform set_config('role', 'postgres', true);
  insert into test_results values ('anon_sees_nothing', case when v_count = 0 then 'PASS' else 'FAIL' end);
end $$;

select * from test_results order by name;
