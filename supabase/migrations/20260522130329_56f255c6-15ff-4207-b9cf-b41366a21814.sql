-- Extend app_role enum with new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'journalist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chief_editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor_in_chief';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'it_specialist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'board_director';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'president';

-- Function: list all users with their roles (admin only)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  roles app_role[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'ليس لديك صلاحية';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    p.display_name,
    u.created_at,
    COALESCE(ARRAY_AGG(r.role) FILTER (WHERE r.role IS NOT NULL), ARRAY[]::app_role[]) AS roles
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  GROUP BY u.id, u.email, p.display_name, u.created_at
  ORDER BY u.created_at DESC;
END;
$$;
