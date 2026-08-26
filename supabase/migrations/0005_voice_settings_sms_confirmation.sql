alter table voice_settings
  add column send_confirmation_sms boolean not null default true;
