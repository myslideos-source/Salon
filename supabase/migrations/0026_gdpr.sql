-- DSGVO-Grundlagen: Datenexport und Löschung für Kunden.
--
-- Customers are referenced by appointments/calls with `on delete
-- restrict`/`set null`, so a hard delete would either fail outright or
-- silently strip business records of their history. Both RPCs below scope
-- to the caller's own salon via has_permission()/is_salon_member(), never
-- take a salon_id from the client, and log to audit_logs — same pattern as
-- the existing toggle_salon_ai / update_voice_settings_customer_fields
-- SECURITY DEFINER RPCs.

-- Art. 15/20 DSGVO: a full export of everything HalloMia holds about one
-- customer, as a single JSON document.
create or replace function public.export_customer_data(target_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id uuid;
  result jsonb;
begin
  select salon_id into v_salon_id from customers where id = target_customer_id;
  if v_salon_id is null or not public.is_salon_member(v_salon_id) then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'customer', to_jsonb(c),
    'appointments', coalesce((select jsonb_agg(to_jsonb(a)) from appointments a where a.customer_id = target_customer_id), '[]'::jsonb),
    'calls', coalesce((select jsonb_agg(to_jsonb(cl)) from calls cl where cl.customer_id = target_customer_id), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(to_jsonb(r)) from requests r where r.customer_id = target_customer_id), '[]'::jsonb),
    'callback_requests', coalesce((select jsonb_agg(to_jsonb(cb)) from callback_requests cb where cb.customer_id = target_customer_id), '[]'::jsonb)
  ) into result
  from customers c where c.id = target_customer_id;

  insert into audit_logs (salon_id, actor_user_id, action, entity_type, entity_id)
  values (v_salon_id, auth.uid(), 'export_customer_data', 'customer', target_customer_id);

  return result;
end;
$$;

-- Art. 17 DSGVO ("Recht auf Löschung"): anonymizes all directly-identifying
-- fields in place and marks the row deleted, instead of a hard delete that
-- either violates the appointments FK or destroys legitimate business
-- records (invoicing history, no-show tracking, …). Restricted to roles
-- with manage_customers permission.
create or replace function public.delete_customer_data(target_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id uuid;
begin
  select salon_id into v_salon_id from customers where id = target_customer_id;
  if v_salon_id is null or not public.has_permission(v_salon_id, 'manage_customers') then
    raise exception 'not authorized';
  end if;

  update customers set
    first_name = 'Gelöscht',
    last_name = '',
    phone = 'geloescht-' || target_customer_id::text,
    email = null,
    address = null,
    company = null,
    notes = null,
    custom_fields = '{}'::jsonb,
    tags = '{}',
    consent_recording = false,
    consent_marketing = false,
    deleted_at = now(),
    updated_at = now()
  where id = target_customer_id;

  insert into audit_logs (salon_id, actor_user_id, action, entity_type, entity_id)
  values (v_salon_id, auth.uid(), 'delete_customer_data', 'customer', target_customer_id);
end;
$$;
