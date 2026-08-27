-- Public Storage bucket for employee profile photos (employees.avatar_url).
-- Public so getPublicUrl() works directly without signed URLs. Writes go
-- through lib/actions/employee-avatar.ts using the service-role client
-- (gated by requirePlatformAdmin() at the application layer), so no
-- separate storage.objects RLS write policy is needed here.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
