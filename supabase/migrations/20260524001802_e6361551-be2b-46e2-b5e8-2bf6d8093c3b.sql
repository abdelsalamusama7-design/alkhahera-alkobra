
-- 1. ad_placements: remove public read (frontend reads through server function with service role)
DROP POLICY IF EXISTS "ad_placements public read enabled" ON public.ad_placements;

-- 2. sitemap_checks: restrict to admins only
DROP POLICY IF EXISTS "anyone can read sitemap checks" ON public.sitemap_checks;
CREATE POLICY "sitemap_checks admin read"
ON public.sitemap_checks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Lock down SECURITY DEFINER trigger/admin helpers from being callable by signed-in users
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_primary_admin() FROM PUBLIC, anon, authenticated;
