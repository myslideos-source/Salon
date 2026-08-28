-- Schritt 12 "Mia aktivieren" schließt den zwölfstufigen Assistenten ab.
-- Eigene, eng gefasste RPC statt eines weiteren Parameters an
-- update_own_salon_onboarding — Abschluss ist ein einmaliges, klar
-- abgegrenztes Ereignis (setzt onboarding_completed_at, das der
-- "Einrichtung unvollständig"-Hinweis im Dashboard prüft), kein
-- gewöhnliches Entwurfsfeld wie Name/Branche/Adresse.
create or replace function public.complete_own_salon_onboarding(target_salon_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_salon_member(target_salon_id) then
    raise exception 'not authorized';
  end if;

  update salons
  set onboarding_step = greatest(onboarding_step, 12),
      onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where id = target_salon_id;
end;
$$;
