-- Flexible Terminarten und Leistungen — additiv.
--
-- Ergänzt die zwei im Konzept geforderten, bisher fehlenden Felder
-- (Beschreibung, "Preis optional") und öffnet Self-Service-Schreibrechte,
-- analog zu 0031 (Team/Ressourcen): weg vom reinen Managed-Service-Modell,
-- hin zu has_permission('manage_services') — derselben Berechtigung, die
-- bereits seit 0016 im Rollen-Modell vorbereitet, aber noch nirgends
-- produktiv für Schreibzugriffe genutzt wurde.
--
-- price_cents selbst bleibt bewusst `not null default 0`: Die
-- Buchungs-Engine, appointment_services und die Voice-Tools lesen es an
-- vielen Stellen als garantiert vorhandene Zahl (kopiert bei Buchung nach
-- appointment_services.price_cents). Eine nullable Spalte hier würde all
-- diese Stellen berühren — reines Kalender-/Telefonie-Risiko, das nicht zu
-- "Terminarten und Leistungen" gehört. Stattdessen bildet has_price den
-- Konzeptwunsch "Preis optional" ab: false heißt "kein Preis hinterlegt/zu
-- nennen", unabhängig vom rohen Zahlenwert.
alter table services add column description text;
alter table services add column has_price boolean not null default true;

-- ── services: Self-Service statt Managed-Service ────────────────────────
drop policy if exists services_admin_write on services;
drop policy if exists services_admin_update on services;
drop policy if exists services_admin_delete on services;

create policy services_self_write on services
  for insert with check (public.has_permission(salon_id, 'manage_services'));
create policy services_self_update on services
  for update using (public.has_permission(salon_id, 'manage_services'));
create policy services_self_delete on services
  for delete using (public.has_permission(salon_id, 'manage_services'));

-- ── employee_services (verfügbare Mitarbeiter je Terminart) ────────────
drop policy if exists es_admin_write on employee_services;
drop policy if exists es_admin_update on employee_services;
drop policy if exists es_admin_delete on employee_services;

create policy es_self_write on employee_services
  for insert with check (public.has_permission(salon_id, 'manage_services'));
create policy es_self_update on employee_services
  for update using (public.has_permission(salon_id, 'manage_services'));
create policy es_self_delete on employee_services
  for delete using (public.has_permission(salon_id, 'manage_services'));

-- ── service_resources (benötigte Ressourcen je Terminart) ──────────────
drop policy if exists sr_admin_write on service_resources;
drop policy if exists sr_admin_delete on service_resources;

create policy sr_self_write on service_resources
  for insert with check (public.has_permission(salon_id, 'manage_services'));
create policy sr_self_delete on service_resources
  for delete using (public.has_permission(salon_id, 'manage_services'));
