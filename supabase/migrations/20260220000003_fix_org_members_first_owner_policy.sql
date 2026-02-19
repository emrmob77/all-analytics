-- Bug Fix: Organizasyonu oluşturan kişinin kendini owner olarak
-- ekleyebilmesi için özel policy. is_org_admin() sıfır üyeli orgda
-- false döndürdüğünden chicken-and-egg oluşuyordu.
CREATE POLICY "org_members_insert_first_owner" ON public.org_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND NOT EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = org_members.organization_id
    )
  );
