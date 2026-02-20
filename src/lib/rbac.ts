import type { OrgRole } from '@/lib/actions/organization';

export type { OrgRole };

export type Permission =
  | 'invite-member'
  | 'remove-member'
  | 'change-member-role'
  | 'manage-ad-accounts'
  | 'update-campaign-budget'
  | 'update-campaign-status'
  | 'view-campaigns'
  | 'view-reports'
  | 'export-reports'
  | 'manage-organization';

export const ROLE_RANK: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
  viewer: 0,
};

const PERMISSION_MIN_ROLE: Record<Permission, OrgRole> = {
  'invite-member': 'admin',
  'remove-member': 'admin',
  'change-member-role': 'owner',
  'manage-ad-accounts': 'admin',
  'update-campaign-budget': 'member',
  'update-campaign-status': 'member',
  'view-campaigns': 'viewer',
  'view-reports': 'viewer',
  'export-reports': 'member',
  'manage-organization': 'owner',
};

export function hasMinimumRole(role: OrgRole, minimumRole: OrgRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimumRole];
}

export function hasPermission(role: OrgRole, permission: Permission): boolean {
  return hasMinimumRole(role, PERMISSION_MIN_ROLE[permission]);
}
