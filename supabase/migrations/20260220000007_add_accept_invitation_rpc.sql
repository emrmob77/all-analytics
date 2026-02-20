-- Accept an invitation by token. SECURITY DEFINER so the invitee (not yet
-- an org member) can validate and accept their own invitation.
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_invitation invitations%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Lock the invitation row to prevent concurrent accepts
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid invitation token');
  END IF;

  IF v_invitation.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Invitation has already been accepted');
  END IF;

  IF v_invitation.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invitation has expired');
  END IF;

  -- Prevent duplicate membership
  IF EXISTS (
    SELECT 1 FROM org_members
    WHERE organization_id = v_invitation.organization_id
      AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'You are already a member of this organization');
  END IF;

  -- Mark as accepted
  UPDATE invitations SET accepted_at = now() WHERE id = v_invitation.id;

  -- Add to org
  INSERT INTO org_members (organization_id, user_id, role)
  VALUES (v_invitation.organization_id, v_user_id, v_invitation.role);

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id::text,
    'role', v_invitation.role::text
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;

-- Allow anyone to look up an invitation by token (needed for the accept page
-- to show org name / role before the user decides to accept).
-- Restricts to non-accepted, non-expired rows.
CREATE POLICY invitations_select_by_token ON public.invitations
  FOR SELECT
  USING (
    accepted_at IS NULL
    AND expires_at > now()
  );
