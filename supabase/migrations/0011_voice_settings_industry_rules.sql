-- Three new, opt-in behaviors requested for branches beyond hairdressers
-- (Notfall-Hinweis, Stornofrist, Mitzubringendes) - same pattern as the
-- existing boolean rule columns, rendered conditionally in lib/voice/prompt.ts.
alter table voice_settings add column emergency_redirect boolean not null default false;
alter table voice_settings add column mention_cancellation_policy boolean not null default false;
alter table voice_settings add column cancellation_notice_hours integer not null default 24;
alter table voice_settings add column required_documents text;

-- Postgres treats a changed parameter list as a new overload rather than a
-- replacement, so the old 10-arg signature must be dropped explicitly or
-- both versions stick around and PostgREST can't pick one unambiguously.
drop function if exists public.update_voice_settings_customer_fields(
  uuid, text, text, text, boolean, boolean, boolean, boolean, boolean, boolean
);

-- Extend the salon-self-service RPC (section: custom_prompt self-service)
-- to also cover these new customer-editable fields.
create or replace function public.update_voice_settings_customer_fields(
  target_salon_id uuid,
  p_greeting text,
  p_personality text,
  p_custom_prompt text,
  p_mention_prices boolean,
  p_offer_alternatives boolean,
  p_respect_employee_preference boolean,
  p_offer_callback boolean,
  p_detect_new_customers boolean,
  p_send_confirmation_sms boolean,
  p_emergency_redirect boolean,
  p_mention_cancellation_policy boolean,
  p_cancellation_notice_hours integer,
  p_required_documents text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_salon_member(target_salon_id) then
    raise exception 'not authorized';
  end if;

  update voice_settings set
    greeting = p_greeting,
    personality = p_personality,
    custom_prompt = p_custom_prompt,
    mention_prices = p_mention_prices,
    offer_alternatives = p_offer_alternatives,
    respect_employee_preference = p_respect_employee_preference,
    offer_callback = p_offer_callback,
    detect_new_customers = p_detect_new_customers,
    send_confirmation_sms = p_send_confirmation_sms,
    emergency_redirect = p_emergency_redirect,
    mention_cancellation_policy = p_mention_cancellation_policy,
    cancellation_notice_hours = p_cancellation_notice_hours,
    required_documents = p_required_documents,
    updated_at = now()
  where salon_id = target_salon_id;
end;
$$;
