-- Konzeptabschnitt "Demo-Daten": Demo-Unternehmen müssen im Dashboard und in
-- den Statistiken eindeutig als Demo gekennzeichnet werden, damit niemand
-- Beispielzahlen für echte Live-Daten hält. Additiv, kein bestehendes
-- Verhalten ändert sich für `is_demo = false` (Default).
alter table salons add column is_demo boolean not null default false;

comment on column salons.is_demo is
  'Kennzeichnet ein Demo-/Vorführ-Unternehmen (Seed-Daten). Wird im Salon-Portal als sichtbarer "Demo"-Hinweis auf Dashboard und Statistiken angezeigt, damit Beispielzahlen nicht mit echten Live-Daten verwechselt werden.';

-- Backfill: das einzige bislang existierende Seed-Unternehmen (siehe
-- supabase/seed.sql) ist ein Demo-Salon.
update salons set is_demo = true where slug = 'hair-lounge-milano';
