import type { AppRole } from "@/lib/auth/mockAuthStore";

const roleHierarchy: AppRole[] = ["viewer", "member", "admin", "owner"];

const routePermissionMap: Record<string, AppRole[]> = {
  "/settings": ["admin", "owner"],
  "/settings/team": ["admin", "owner"],
  "/billing": ["owner"],
  "/integrations/marketplace": ["member", "admin", "owner"],
  "/team": ["member", "admin", "owner"]
};

function compareRoles(left: AppRole, right: AppRole): number {
  return roleHierarchy.indexOf(left) - roleHierarchy.indexOf(right);
}

function canAccessRole(requiredRole: AppRole, actualRole: AppRole): boolean {
  return compareRoles(actualRole, requiredRole) >= 0;
}

function canAccessRoute(pathname: string, role: AppRole): boolean {
  const matchedEntry = Object.entries(routePermissionMap).find(([prefix]) => pathname.startsWith(prefix));

  if (!matchedEntry) {
    return true;
  }

  const requiredRoles = matchedEntry[1];
  return requiredRoles.includes(role);
}

function listRoutePermissions() {
  return routePermissionMap;
}

export { canAccessRole, canAccessRoute, listRoutePermissions, roleHierarchy };
