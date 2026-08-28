-- Kundenverwaltung erweitern — additive, alle neuen Spalten mit sicherem
-- Default, damit bestehende Kunden unverändert lesbar bleiben.

alter table customers add column status text not null default 'new'
  check (status in ('new', 'returning', 'vip', 'inactive', 'blocked'));
alter table customers add column tags text[] not null default '{}';
alter table customers add column custom_fields jsonb not null default '{}'::jsonb;
alter table customers add column address text;
alter table customers add column company text;
alter table customers add column preferred_location_id uuid references locations(id) on delete set null;
alter table customers add column consent_recording boolean not null default false;
alter table customers add column consent_marketing boolean not null default false;
-- Soft-delete marker used by the erasure RPC (0026_gdpr.sql) — the row
-- stays (appointments/calls reference it with `on delete restrict`) but is
-- flagged and anonymized rather than removed.
alter table customers add column deleted_at timestamptz;

create index customers_salon_status_idx on customers (salon_id, status);
create index customers_salon_tags_idx on customers using gin (tags);
-- Supports the concept's "Dubletten anhand von Telefonnummer und E-Mail
-- erkennen" requirement (phone already has a unique index; this adds a
-- lookup index for the email half of that check).
create index customers_salon_email_idx on customers (salon_id, lower(email)) where email is not null;
