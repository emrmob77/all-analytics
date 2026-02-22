'use client';

// Re-export types so existing imports stay unchanged
export type { Organization, OrgMembership } from '@/lib/actions/organization';

// Delegate to the shared OrganizationProvider — org data is fetched once
// at AppShell level and shared across Sidebar, page content, and tab components.
export { useOrganizationContext as useOrganization } from '@/components/providers/OrganizationProvider';
