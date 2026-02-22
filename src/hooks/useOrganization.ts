'use client';

import { useOrganizationContext } from '@/components/providers/OrganizationProvider';

export type { Organization, OrgMembership } from '@/lib/actions/organization';

// Thin wrapper so existing call-sites don't need to change import paths.
export function useOrganization() {
  return useOrganizationContext();
}
