
-- Fix search_path
create or replace function public.touch_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Restrict execute on security definer functions
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Replace public storage select policy with per-object (no listing for anon)
drop policy "article images public read" on storage.objects;
create policy "article images authenticated list" on storage.objects for select
  using (bucket_id = 'article-images' and auth.role() = 'authenticated');
-- public file fetch still works via the public bucket CDN URL even without a select policy
