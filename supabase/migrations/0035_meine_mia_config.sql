-- "Meine Mia" vollständig: Unternehmensbeschreibung + die self-service
-- Erweiterung der RPCs auf die in 0021 bereits als reine Spalten
-- angelegten Felder (assistant_name, formality, languages, never_mention,
-- after_hours_behavior, handoff_number, urgent_keywords, notify_after_call).
-- Additiv, keine bestehende Migration wird verändert.

alter table salons add column description text;

-- ── salons: Unternehmensbeschreibung self-service editierbar ───────────
-- Gleiches Muster wie 0029/0030: neue Spalte als zusätzlicher, optionaler
-- Parameter am Ende (Postgres behandelt ein geändertes Parameter-Set als
-- neuen Overload statt eines Replace, siehe Begründung in 0011).
drop function if exists public.update_own_salon_onboarding(
  uuid, text, text, uuid, text, text, text, jsonb, int
);

create or replace function public.update_own_salon_onboarding(
  target_salon_id uuid,
  p_name text default null,
  p_slug text default null,
  p_industry_template_id uuid default null,
  p_phone text default null,
  p_address text default null,
  p_timezone text default null,
  p_onboarding_draft jsonb default null,
  p_onboarding_step int default null,
  p_description text default null
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

  update salons set
    name = coalesce(nullif(trim(p_name), ''), name),
    slug = coalesce(p_slug, slug),
    industry_template_id = coalesce(p_industry_template_id, industry_template_id),
    phone = coalesce(p_phone, phone),
    address = coalesce(p_address, address),
    timezone = coalesce(p_timezone, timezone),
    onboarding_draft = coalesce(p_onboarding_draft, onboarding_draft),
    onboarding_step = greatest(onboarding_step, coalesce(p_onboarding_step, onboarding_step)),
    description = coalesce(p_description, description),
    updated_at = now()
  where id = target_salon_id;
end;
$$;

-- ── voice_settings: die universellen "Meine Mia"-Felder self-service ───
-- Erweitert die bestehende, eng gefasste SECURITY DEFINER-RPC (Vorbild
-- 0010/0011) um exakt die in 0021 additiv angelegten Spalten. Die
-- technischen/abrechnungsrelevanten Felder (phone_number, provider,
-- provider_agent_id, forwarding_number, voice_id, ...) bleiben bewusst
-- weiterhin außerhalb dieser RPC und damit admin-only.
drop function if exists public.update_voice_settings_customer_fields(
  uuid, text, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, integer, text
);

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
  p_required_documents text,
  p_assistant_name text,
  p_formality text,
  p_languages text[],
  p_never_mention text,
  p_after_hours_behavior text,
  p_handoff_number text,
  p_urgent_keywords text[],
  p_notify_after_call boolean
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
    assistant_name = p_assistant_name,
    formality = p_formality,
    languages = p_languages,
    never_mention = p_never_mention,
    after_hours_behavior = p_after_hours_behavior,
    handoff_number = p_handoff_number,
    urgent_keywords = p_urgent_keywords,
    notify_after_call = p_notify_after_call,
    updated_at = now()
  where salon_id = target_salon_id;
end;
$$;
