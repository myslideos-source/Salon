-- Korrektur zu 0029: `onboarding_step` bezeichnet den als Nächstes
-- anzuzeigenden Schritt (abgeschlossen sind alle Schritte < onboarding_step).
-- `create_own_salon` (Schritt 1 "Unternehmen anlegen") muss deshalb direkt
-- mit onboarding_step = 2 anlegen, damit der Assistent nach dem Anlegen mit
-- Schritt 2 "Branche" weitermacht statt Schritt 1 erneut anzuzeigen.
create or replace function public.create_own_salon(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from salon_users where user_id = auth.uid()) then
    raise exception 'already has a company';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'name required';
  end if;

  insert into salons (name, slug, status, ai_active, onboarding_step)
    values (trim(p_name), p_slug, 'trial', false, 2)
    returning id into v_salon_id;

  insert into salon_users (salon_id, user_id, role) values (v_salon_id, auth.uid(), 'owner');

  insert into business_hours (salon_id, weekday, is_closed, start_time, end_time)
    select v_salon_id, weekday, weekday = 1, case when weekday = 1 then null else '09:00:00'::time end,
      case when weekday = 1 then null else '18:00:00'::time end
    from generate_series(0, 6) as weekday;

  insert into voice_settings (salon_id, greeting)
    values (v_salon_id, 'Hallo und herzlich willkommen bei ' || trim(p_name) || '. Sie sprechen mit unserer digitalen Telefonassistenz. Wie kann ich Ihnen helfen?');

  return v_salon_id;
end;
$$;
