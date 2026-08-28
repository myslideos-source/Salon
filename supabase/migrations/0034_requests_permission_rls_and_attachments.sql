-- Kunden, Anfragen und Rückrufe: `requests` bekommt jetzt seinen ersten
-- echten Anwendungscode (siehe src/lib/actions/requests.ts). Bislang
-- durfte jedes Salon-Mitglied schreiben (is_salon_member) — das war beim
-- Anlegen der Tabelle in 0019 bewusst provisorisch, da noch keine UI
-- existierte. Jetzt, wo Rollenregeln tatsächlich greifen müssen, wird auf
-- dasselbe has_permission('manage_requests')-Muster umgestellt wie beim
-- Löschen (siehe 0016_roles_permissions.sql). `customers` bleibt bewusst
-- unverändert bei is_salon_member: `createManualAppointmentAction`
-- (src/lib/actions/appointments.ts) legt beim manuellen Buchen im Kalender
-- clientseitig neue Kundendatensätze an, unabhängig von der Berechtigung
-- "manage_customers" — eine Verschärfung dort würde die bestehende
-- Kalenderbuchung für die Rolle "Nur Kalenderzugriff" brechen. Die neue
-- Kundenverwaltung (src/lib/actions/customers.ts) prüft "manage_customers"
-- stattdessen zusätzlich auf Anwendungsebene.

drop policy if exists requests_write on requests;
create policy requests_write on requests
  for insert with check (public.has_permission(salon_id, 'manage_requests'));

drop policy if exists requests_update on requests;
create policy requests_update on requests
  for update using (public.has_permission(salon_id, 'manage_requests'));

-- Privater Storage-Bucket für optionale Anlagen an Anfragen (Fotos/Dokumente,
-- Konzeptabschnitt "Anfragen und Rückrufe"). Privat statt öffentlich, da
-- Anlagen potenziell personenbezogene Kundendaten enthalten (DSGVO) —
-- Zugriff ausschließlich über zeitlich begrenzte Signed URLs. Schreiben und
-- Signieren laufen über den Service-Role-Client, anwendungsseitig hinter
-- has_permission('manage_requests') geprüft (Muster: employee-avatar.ts),
-- daher keine zusätzliche storage.objects-RLS-Policy nötig.
insert into storage.buckets (id, name, public)
values ('request-attachments', 'request-attachments', false)
on conflict (id) do nothing;
