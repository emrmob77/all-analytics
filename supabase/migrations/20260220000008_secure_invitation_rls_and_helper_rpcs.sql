-- Bug 1: Remove overly-permissive RLS policy that exposes ALL pending
-- invitations. Token lookup is now handled by a SECURITY DEFINER function.
DROP POLICY IF EXISTS invitations_select_by_token ON public.invitations;

-- Bug 1 fix: SECURITY DEFINER function to look up an invitation by token.
-- Returns only the fields needed for the accept page preview.
-- Callable by anon so the accept page works before login.
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS TABLE(
  email      text,
  role       text,
  org_name   text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT i.email,
           i.role::text,
           o.name   AS org_name,
           i.expires_at
    FROM   invitations  i
    JOIN   organizations o ON o.id = i.organization_id
    WHERE  i.token        = p_token
      AND  i.accepted_at IS NULL
      AND  i.expires_at  > now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon, authenticated;

-- Bug 2 fix: SECURITY DEFINER function to check whether a user with a given
-- email is already a member of an org — bypasses the users table RLS that
-- prevents admins from seeing other users' email addresses.
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
