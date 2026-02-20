'use client';

import { useOrganization } from '@/hooks/useOrganization';
import {
  hasPermission as _hasPermission,
  hasMinimumRole as _hasMinimumRole,
} from '@/lib/rbac';
import type { OrgRole, Permission } from '@/lib/rbac';

interface UseRoleReturn {
  role: OrgRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isViewer: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasMinimumRole: (minimumRole: OrgRole) => boolean;
  loading: boolean;
}

export function useRole(): UseRoleReturn {
  const { role, loading } = useOrganization();

  const isOwner = role === 'owner';
  const isAdmin = role === 'owner' || role === 'admin';
  const isMember = role === 'owner' || role === 'admin' || role === 'member';
  const isViewer = role !== null;

  function hasPermission(permission: Permission): boolean {
    if (!role) return false;
    return _hasPermission(role, permission);
  }

  function hasMinimumRole(minimumRole: OrgRole): boolean {
    if (!role) return false;
    return _hasMinimumRole(role, minimumRole);
  }

  return {
    role,
    isOwner,
    isAdmin,
    isMember,
    isViewer,
    hasPermission,
    hasMinimumRole,
    loading,
  };
}
