-- SalonCall AI demo seed: Hair Lounge Milano
--
-- Creates one fully-populated demo salon (employees, services, business
-- hours, customers, today's appointments, calls, callbacks) plus two login
-- accounts so the app is usable immediately after a fresh deploy.
--
-- IMPORTANT: replace the placeholder admin email/password below before
-- running this against a real project, then change both passwords on first
-- login. Run via the Supabase SQL editor or `supabase db execute -f`.

do $$
declare
  v_salon_id uuid;
  v_anna_id uuid;
  v_lisa_id uuid;
  v_marco_id uuid;
  v_admin_user_id uuid := gen_random_uuid();
  v_salon_user_id uuid := gen_random_uuid();
  v_today_weekday int := extract(dow from (now() at time zone 'Europe/Berlin'))::int;
  v_svc_damen uuid;
  v_svc_herren uuid;
  v_svc_farbe uuid;
  v_svc_balayage uuid;
  v_svc_styling uuid;
  v_svc_bart uuid;
  v_cust_julia uuid;
  v_cust_sophia uuid;
  v_cust_lea uuid;
  v_cust_marie uuid;
  v_cust_clara uuid;
  v_cust_laura uuid;
  v_cust_nina uuid;
  v_cust_annaf uuid;
  v_cust_mia uuid;
  v_cust_tom uuid;
  v_cust_markus uuid;
  v_cust_fabian uuid;
  v_cust_paul uuid;
  v_appt uuid;
  today date := (now() at time zone 'Europe/Berlin')::date;

  -- ⚠️ Replace before running against a real project.
  admin_email text := 'admin@example.com';
  admin_password text := 'change-me-now';
  salon_email text := 'salon@hairlounge-milano.saloncall.ai';
  salon_password text := 'change-me-too';
begin
  -- ── Auth users (email/password login via Supabase Auth) ────────────────
  -- The token columns must be '' rather than their NULL default: GoTrue's
  -- Go code scans them as non-nullable strings, and a NULL here makes every
  -- subsequent login fail with "error finding user: ... converting NULL to
  -- string is unsupported" — a well-known gotcha when inserting auth.users
  -- directly via SQL instead of through the Auth API.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_sso_user, is_anonymous,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_admin_user_id, 'authenticated', 'authenticated',
    admin_email, crypt(admin_password, gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now(), false, false,
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_admin_user_id::text, v_admin_user_id,
    jsonb_build_object('sub', v_admin_user_id::text, 'email', admin_email), 'email', now(), now(), now());
  insert into platform_admins (user_id) values (v_admin_user_id);

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_sso_user, is_anonymous,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_salon_user_id, 'authenticated', 'authenticated',
    salon_email, crypt(salon_password, gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now(), false, false,
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_salon_user_id::text, v_salon_user_id,
    jsonb_build_object('sub', v_salon_user_id::text, 'email', salon_email), 'email', now(), now(), now());

  -- ── Salon ────────────────────────────────────────────────────────────
  insert into salons (name, slug, timezone, phone, address, status, ai_active, slot_granularity_minutes, earliest_booking_lead_minutes, max_advance_booking_days)
  values ('Hair Lounge Milano', 'hair-lounge-milano', 'Europe/Berlin', '+49 30 1234567', 'Kastanienallee 12, 10435 Berlin', 'active', true, 15, 60, 60)
  returning id into v_salon_id;

  insert into salon_users (salon_id, user_id, role) values (v_salon_id, v_salon_user_id, 'owner');

  insert into voice_settings (salon_id, voice_id, greeting, personality, phone_number)
  values (v_salon_id, '11labs-Anna', 'Hallo und herzlich willkommen bei Hair Lounge Milano. Sie sprechen mit unserer digitalen Telefonassistenz. Wie kann ich Ihnen helfen?', 'freundlich', '+49 30 1234567');

  -- ── Business hours: Mo closed, Tue-Fri 09-18, Thu 09-20, Sat 08-14, Sun closed.
  -- Today's weekday gets a wider 09:00-20:00 window so the seeded demo day fits.
  insert into business_hours (salon_id, weekday, is_closed, start_time, end_time)
  select v_salon_id, w,
    (w in (0,1) and w <> v_today_weekday),
    case when w in (0,1) and w <> v_today_weekday then null
         when w = v_today_weekday then time '09:00'
         when w = 4 then time '09:00'
         when w = 6 then time '08:00'
         else time '09:00' end,
    case when w in (0,1) and w <> v_today_weekday then null
         when w = v_today_weekday then time '20:00'
         when w = 4 then time '20:00'
         when w = 6 then time '14:00'
         else time '18:00' end
  from generate_series(0,6) as w;

  -- ── Employees ────────────────────────────────────────────────────────
  insert into employees (salon_id, first_name, last_name, color, sort_order) values (v_salon_id, 'Anna', 'Keller', '#B08968', 0) returning id into v_anna_id;
  insert into employees (salon_id, first_name, last_name, color, sort_order) values (v_salon_id, 'Lisa', 'Brandt', '#7C8B6E', 1) returning id into v_lisa_id;
  insert into employees (salon_id, first_name, last_name, color, sort_order) values (v_salon_id, 'Marco', 'Rossi', '#4F6F8F', 2) returning id into v_marco_id;

  -- Working hours: Tue-Sat, generous window so the seeded appointments fit,
  -- plus explicit coverage for whatever weekday "today" happens to be.
  insert into employee_working_hours (salon_id, employee_id, weekday, start_time, end_time)
  select v_salon_id, v_anna_id, w, time '08:30', time '20:00' from generate_series(2,6) w;
  insert into employee_working_hours (salon_id, employee_id, weekday, start_time, end_time)
  select v_salon_id, v_lisa_id, w, time '09:00', time '19:00' from generate_series(2,6) w;
  insert into employee_working_hours (salon_id, employee_id, weekday, start_time, end_time)
  select v_salon_id, v_marco_id, w, time '09:30', time '19:00' from generate_series(2,6) w;
  if v_today_weekday not in (2,3,4,5,6) then
    insert into employee_working_hours (salon_id, employee_id, weekday, start_time, end_time) values
      (v_salon_id, v_anna_id, v_today_weekday, time '08:30', time '20:00'),
      (v_salon_id, v_lisa_id, v_today_weekday, time '09:00', time '20:00'),
      (v_salon_id, v_marco_id, v_today_weekday, time '09:30', time '20:00');
  end if;

  -- ── Services ─────────────────────────────────────────────────────────
  insert into services (salon_id, name, category, duration_minutes, price_cents, buffer_before_minutes, buffer_after_minutes, color, sort_order)
  values (v_salon_id, 'Damen Schnitt', 'Schneiden', 60, 5900, 0, 10, '#8A7159', 0) returning id into v_svc_damen;
  insert into services (salon_id, name, category, duration_minutes, price_cents, buffer_before_minutes, buffer_after_minutes, color, sort_order)
  values (v_salon_id, 'Herren Schnitt', 'Schneiden', 30, 3200, 0, 5, '#4F6F8F', 1) returning id into v_svc_herren;
  insert into services (salon_id, name, category, duration_minutes, price_cents, buffer_before_minutes, buffer_after_minutes, color, sort_order)
  values (v_salon_id, 'Ansatzfarbe', 'Farbe', 90, 8500, 0, 10, '#B1533F', 2) returning id into v_svc_farbe;
  insert into services (salon_id, name, category, duration_minutes, price_cents, buffer_before_minutes, buffer_after_minutes, color, sort_order)
  values (v_salon_id, 'Balayage', 'Farbe', 180, 17900, 0, 15, '#B8873F', 3) returning id into v_svc_balayage;
  insert into services (salon_id, name, category, duration_minutes, price_cents, buffer_before_minutes, buffer_after_minutes, color, sort_order)
  values (v_salon_id, 'Styling', 'Styling', 45, 3900, 0, 5, '#7C8B6E', 4) returning id into v_svc_styling;
  insert into services (salon_id, name, category, duration_minutes, price_cents, buffer_before_minutes, buffer_after_minutes, color, sort_order)
  values (v_salon_id, 'Bart', 'Bart', 20, 1800, 0, 5, '#5C554C', 5) returning id into v_svc_bart;

  -- ── Employee skills (only where restricted; unset = everyone can do it) ─
  insert into employee_services (salon_id, employee_id, service_id) values
    (v_salon_id, v_anna_id, v_svc_damen), (v_salon_id, v_anna_id, v_svc_farbe), (v_salon_id, v_anna_id, v_svc_balayage), (v_salon_id, v_anna_id, v_svc_styling),
    (v_salon_id, v_lisa_id, v_svc_damen), (v_salon_id, v_lisa_id, v_svc_farbe), (v_salon_id, v_lisa_id, v_svc_balayage), (v_salon_id, v_lisa_id, v_svc_styling),
    (v_salon_id, v_marco_id, v_svc_herren), (v_salon_id, v_marco_id, v_svc_bart), (v_salon_id, v_marco_id, v_svc_styling);

  -- ── Customers ────────────────────────────────────────────────────────
  insert into customers (salon_id, first_name, last_name, phone, email) values (v_salon_id, 'Julia', 'Müller', '+49 151 23456789', 'julia.mueller@example.com') returning id into v_cust_julia;
  insert into customers (salon_id, first_name, last_name, phone, email) values (v_salon_id, 'Sophia', 'Wagner', '+49 160 98765432', 'sophia.wagner@example.com') returning id into v_cust_sophia;
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_id, 'Lea', 'Hoffmann', '+49 176 54321098') returning id into v_cust_lea;
  insert into customers (salon_id, first_name, last_name, phone, preferred_employee_id) values (v_salon_id, 'Marie', 'Weber', '+49 152 11122334', v_anna_id) returning id into v_cust_marie;
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_id, 'Clara', 'Zimmer', '+49 157 22233445') returning id into v_cust_clara;
  insert into customers (salon_id, first_name, last_name, phone, preferred_employee_id) values (v_salon_id, 'Laura', 'Schmidt', '+49 159 33344556', v_lisa_id) returning id into v_cust_laura;
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_id, 'Nina', 'Köhler', '+49 162 44455667') returning id into v_cust_nina;
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_id, 'Anna', 'Fischer', '+49 163 55566778') returning id into v_cust_annaf;
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_id, 'Mia', 'Schuster', '+49 155 66677889') returning id into v_cust_mia;
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_id, 'Tom', 'Becker', '+49 171 11223344') returning id into v_cust_tom;
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_id, 'Markus', 'Lange', '+49 172 22334455') returning id into v_cust_markus;
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_id, 'Fabian', 'Krause', '+49 173 33445566') returning id into v_cust_fabian;
  insert into customers (salon_id, first_name, last_name, phone) values (v_salon_id, 'Paul', 'Richter', '+49 152 66778899') returning id into v_cust_paul;

  -- ── Today's appointments (mirrors the reference mockup) ────────────────
  -- Anna
  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_julia, v_anna_id, ((today::text || ' 09:00:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 10:00:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'manual', 5900) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_damen, v_salon_id, 60, 5900, 0);

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_sophia, v_anna_id, ((today::text || ' 11:00:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 12:30:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'manual', 8500) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_farbe, v_salon_id, 90, 8500, 0);

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_lea, v_anna_id, ((today::text || ' 14:00:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 15:00:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'voice_ai', 5900) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_damen, v_salon_id, 60, 5900, 0);

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_marie, v_anna_id, ((today::text || ' 16:00:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 17:30:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'manual', 17900) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_balayage, v_salon_id, 90, 17900, 0);

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_clara, v_anna_id, ((today::text || ' 18:00:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 19:00:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'manual', 3900) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_styling, v_salon_id, 45, 3900, 0);

  -- Lisa
  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_laura, v_lisa_id, ((today::text || ' 09:30:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 11:30:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'voice_ai', 17900) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_balayage, v_salon_id, 90, 17900, 0);

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_nina, v_lisa_id, ((today::text || ' 12:00:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 13:00:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'manual', 5900) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_damen, v_salon_id, 60, 5900, 0);

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_annaf, v_lisa_id, ((today::text || ' 14:30:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 16:00:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'manual', 14400) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values
    (v_appt, v_svc_farbe, v_salon_id, 60, 8500, 0), (v_appt, v_svc_damen, v_salon_id, 30, 5900, 1);

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_mia, v_lisa_id, ((today::text || ' 17:00:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 18:00:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'manual', 3900) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_styling, v_salon_id, 45, 3900, 0);

  -- Marco
  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_tom, v_marco_id, ((today::text || ' 10:00:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 11:00:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'manual', 3200) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_herren, v_salon_id, 30, 3200, 0);

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_markus, v_marco_id, ((today::text || ' 12:30:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 13:30:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'voice_ai', 3200) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_herren, v_salon_id, 30, 3200, 0);

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_fabian, v_marco_id, ((today::text || ' 15:00:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 16:00:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'manual', 3200) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_herren, v_salon_id, 30, 3200, 0);

  insert into appointments (salon_id, customer_id, employee_id, start_at, end_at, status, source, total_price_cents)
  values (v_salon_id, v_cust_paul, v_marco_id, ((today::text || ' 17:30:00')::timestamp at time zone 'Europe/Berlin'), ((today::text || ' 18:30:00')::timestamp at time zone 'Europe/Berlin'), 'booked', 'manual', 3200) returning id into v_appt;
  insert into appointment_services (appointment_id, service_id, salon_id, duration_minutes, price_cents, sort_order) values (v_appt, v_svc_herren, v_salon_id, 30, 3200, 0);

  -- ── Calls & callbacks (mirrors the reference mockup) ────────────────────
  insert into calls (salon_id, customer_id, phone_number, started_at, duration_seconds, topic, outcome, status)
  values
    (v_salon_id, v_cust_julia, '+49 151 23456789', ((today::text || ' 10:24:00')::timestamp at time zone 'Europe/Berlin'), 152, 'Interessiert an Balayage', 'appointment_booked', 'completed'),
    (v_salon_id, v_cust_tom, '+49 160 98765432', ((today::text || ' 09:47:00')::timestamp at time zone 'Europe/Berlin'), 134, 'Herren Schnitt', 'appointment_booked', 'completed'),
    (v_salon_id, null, '+49 176 54321098', ((today::text || ' 08:55:00')::timestamp at time zone 'Europe/Berlin'), 96, 'Allgemeine Anfrage', 'info_given', 'completed');

  insert into callback_requests (salon_id, phone_number, reason, status, requested_at)
  values
    (v_salon_id, '+49 171 11223344', 'Bitte um Rückruf wegen Beratung', 'open', ((today::text || ' 11:30:00')::timestamp at time zone 'Europe/Berlin')),
    (v_salon_id, '+49 152 66778899', 'Rückruf zu Farbberatung gewünscht', 'open', ((today::text || ' 15:00:00')::timestamp at time zone 'Europe/Berlin'));

  raise notice 'Seed complete. Admin login: % / Salon login: %', admin_email, salon_email;
end $$;
