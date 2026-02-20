-- SECURITY DEFINER function to list all members of an organization with
-- their user profile info. Needed because users table RLS only allows
-- users to SELECT their own row, so a plain JOIN would return no data
-- for other members' profiles.
-- Callable by any org member (viewer and above).
CREATE OR REPLACE FUNCTION public.get_org_members(p_org_id UUID)
RETURNS TABLE(
  user_id    uuid,
  email      text,
  full_name  text,
  avatar_url text,
  role       text,
  joined_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Any org member may list the members of their own org.
  IF NOT EXISTS (
    SELECT 1 FROM org_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied: not a member of this organization';
  END IF;

  RETURN QUERY
    SELECT
      u.id           AS user_id,
      u.email,
      u.full_name,
      u.avatar_url,
      om.role::text  AS role,
      om.created_at  AS joined_at
    FROM   org_members om
    JOIN   users       u ON u.id = om.user_id
    WHERE  om.organization_id = p_org_id
    ORDER  BY om.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_org_members(UUID) TO authenticated;
