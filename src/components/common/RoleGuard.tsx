'use client';

import { useRole } from '@/hooks/useRole';
import type { OrgRole, Permission } from '@/lib/rbac';

type RoleGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
} & (
  | { permission: Permission; minimumRole?: OrgRole }
  | { minimumRole: OrgRole; permission?: Permission }
);

export function RoleGuard({
  children,
  fallback = null,
  permission,
  minimumRole,
}: RoleGuardProps) {
  const { hasPermission, hasMinimumRole, loading } = useRole();

  if (loading) return null;

  let allowed = true;

  if (permission !== undefined) {
    allowed = allowed && hasPermission(permission);
  }

  if (minimumRole !== undefined) {
    allowed = allowed && hasMinimumRole(minimumRole);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
