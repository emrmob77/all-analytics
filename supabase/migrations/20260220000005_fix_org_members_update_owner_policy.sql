-- Bug Fix: Self-join ambiguity in org_members_update_owner policy.
-- Subquery'deki org_members referansı kendi scope'una çözümleniyordu,
-- bu da farklı organizasyonlardaki üyeleri güncellemeye izin veriyordu.
DROP POLICY IF EXISTS "org_members_update_owner" ON public.org_members;

CREATE POLICY "org_members_update_owner" ON public.org_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = org_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );
