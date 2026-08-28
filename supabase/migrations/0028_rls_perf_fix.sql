-- Perf lint fix (Supabase performance advisor, auth_rls_initplan): wrap
-- auth.uid() as (select auth.uid()) in the policies from this phase so
-- Postgres evaluates it once per query instead of once per row.

drop policy if exists role_permissions_select on role_permissions;
create policy role_permissions_select on role_permissions
  for select using (
    (select auth.uid()) is not null and (salon_id is null or public.is_salon_member(salon_id))
  );

drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications
  for select using (public.is_salon_member(salon_id) and (user_id is null or user_id = (select auth.uid())));

drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications
  for update using (user_id = (select auth.uid()));

drop policy if exists notification_preferences_select on notification_preferences;
create policy notification_preferences_select on notification_preferences
  for select using (user_id = (select auth.uid()) or public.is_platform_admin());

drop policy if exists notification_preferences_write on notification_preferences;
create policy notification_preferences_write on notification_preferences
  for insert with check (user_id = (select auth.uid()) and public.is_salon_member(salon_id));

drop policy if exists notification_preferences_update on notification_preferences;
create policy notification_preferences_update on notification_preferences
  for update using (user_id = (select auth.uid()));

drop policy if exists notification_preferences_delete on notification_preferences;
create policy notification_preferences_delete on notification_preferences
  for delete using (user_id = (select auth.uid()));
