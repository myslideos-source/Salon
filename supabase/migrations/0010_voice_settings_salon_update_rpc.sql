-- voice_settings only allows platform-admin UPDATEs via RLS (technical
-- fields like phone numbers, provider choice and agent IDs must stay
-- admin-controlled). Self-service prompt editing (section: "Jeder Kunde
-- muss Möglichkeit haben dann seinen prompt einzugeben") needs salon
-- owners to update greeting/personality/custom_prompt/rules themselves
-- without a blanket UPDATE policy that would also let them change
-- phone_number, provider or agent IDs directly via the client. Same
-- SECURITY DEFINER + is_salon_member() scoping pattern as toggle_salon_ai.
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
  p_send_confirmation_sms boolean
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
    updated_at = now()
  where salon_id = target_salon_id;
end;
$$;
