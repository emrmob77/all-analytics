-- Add authorization check to check_org_member_by_email so that only
-- owners and admins of the target organization can call this function.
-- Previously any authenticated user could probe membership of any org.
CREATE OR REPLACE FUNCTION public.check_org_member_by_email(
  p_org_id UUID,
  p_email  TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only owners/admins of the target org may call this function.
  IF NOT EXISTS (
    SELECT 1
    FROM   org_members
    WHERE  organization_id = p_org_id
      AND  user_id         = auth.uid()
      AND  role            IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied: caller is not an owner or admin of this organization';
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM   org_members om
    JOIN   users       u  ON u.id = om.user_id
    WHERE  om.organization_id = p_org_id
      AND  u.email            = p_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_org_member_by_email(UUID, TEXT) TO authenticated;
