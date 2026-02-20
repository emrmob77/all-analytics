-- Creates a default organization for the authenticated user.
-- Idempotent: returns the existing org if the user already has a membership.
-- Runs org INSERT + member INSERT in a single transaction (SECURITY DEFINER
-- bypasses RLS, so no partial-write rollback edge cases).

CREATE OR REPLACE FUNCTION public.create_default_organization(
  p_name TEXT,
  p_slug TEXT
)
RETURNS SETOF public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        UUID := auth.uid();
  v_existing_org_id UUID;
  v_org_id         UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Idempotency: return existing org if the user already has a membership
  SELECT om.organization_id INTO v_existing_org_id
  FROM org_members om
  WHERE om.user_id = v_user_id
  ORDER BY om.created_at ASC
  LIMIT 1;

  IF v_existing_org_id IS NOT NULL THEN
    RETURN QUERY SELECT * FROM organizations WHERE id = v_existing_org_id;
    RETURN;
  END IF;

  -- Atomically create org + add user as owner
  INSERT INTO organizations (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_org_id;

  INSERT INTO org_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  RETURN QUERY SELECT * FROM organizations WHERE id = v_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_default_organization(TEXT, TEXT) TO authenticated;
