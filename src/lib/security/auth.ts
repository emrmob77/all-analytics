import { ApiError } from "@/lib/api/errors";
import { verifyBearerToken } from "@/lib/security/jwt";

interface AuthenticatedPrincipal {
  userId: string;
  tenantId?: string;
  roles: string[];
  claims: Record<string, unknown>;
}

function ensureNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function extractRoles(claims: Record<string, unknown>): string[] {
  const role = ensureNonEmptyString(claims.role);
  const rolesValue = claims.roles;

  if (Array.isArray(rolesValue)) {
    const roleList = rolesValue
      .map((item) => ensureNonEmptyString(item))
      .filter((item): item is string => Boolean(item));

    if (role && !roleList.includes(role)) {
      roleList.push(role);
    }

    return roleList;
  }

  return role ? [role] : [];
}

async function authenticateRequest(request: Request): Promise<AuthenticatedPrincipal> {
  const claims = await verifyBearerToken(request);
  const userId = ensureNonEmptyString(claims.sub) ?? ensureNonEmptyString(claims.user_id);

  if (!userId) {
    throw new ApiError({
      status: 401,
      code: "JWT_SUB_MISSING",
      message: "JWT subject claim is missing.",
      expose: true
    });
  }

  const tenantId =
    ensureNonEmptyString(claims.tenant_id) ??
    ensureNonEmptyString(claims.brand_id) ??
    ensureNonEmptyString(claims.tenantId);

  return {
    userId,
    tenantId,
    roles: extractRoles(claims),
    claims
  };
}

function assertPrincipalRole(principal: AuthenticatedPrincipal, allowedRoles: string[]): void {
  if (allowedRoles.length === 0) {
    return;
  }

  const hasAnyRole = principal.roles.some((role) => allowedRoles.includes(role));

  if (!hasAnyRole) {
    throw new ApiError({
      status: 403,
      code: "FORBIDDEN_ROLE",
      message: "User role does not have access to this endpoint.",
      expose: true
    });
  }
}

function assertTenantIsolation(principal: AuthenticatedPrincipal, requestedTenantId?: string): void {
  if (!requestedTenantId) {
    return;
  }

  if (!principal.tenantId) {
    throw new ApiError({
      status: 403,
      code: "TENANT_CLAIM_MISSING",
      message: "Tenant claim is missing in JWT.",
      expose: true
    });
  }

  if (principal.tenantId !== requestedTenantId) {
    throw new ApiError({
      status: 403,
      code: "TENANT_ACCESS_DENIED",
      message: "Requested tenant is outside of current JWT tenant scope.",
      expose: true
    });
  }
}

export { assertPrincipalRole, assertTenantIsolation, authenticateRequest };
export type { AuthenticatedPrincipal };
