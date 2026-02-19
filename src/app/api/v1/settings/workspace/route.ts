import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyInteger, readBodyString, readStringParam } from "@/lib/api/validation";
import { getDefaultTenantId, getWorkspaceSettings, updateWorkspaceSettings } from "@/lib/saas/store";

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);
  const tenantId = readStringParam(url.searchParams, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId();

  const workspace = getWorkspaceSettings(tenantId);

  if (!workspace) {
    throw new ApiError({
      status: 404,
      code: "WORKSPACE_NOT_FOUND",
      message: "Workspace settings not found.",
      expose: true
    });
  }

  return {
    data: {
      workspace
    }
  };
});

export const PUT = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const tenantId = readBodyString(body, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId();

  const workspace = updateWorkspaceSettings(tenantId, {
    name: readBodyString(body, "name", { maxLength: 120 }),
    logoUrl: readBodyString(body, "logoUrl", { maxLength: 800 }),
    defaultCurrency: readBodyString(body, "defaultCurrency", { maxLength: 20 }),
    dataRetentionDays: readBodyInteger(body, "dataRetentionDays", { min: 7, max: 3650 }),
    exportFormat:
      (readBodyString(body, "exportFormat", { maxLength: 10 }) as "csv" | "xlsx" | "json" | undefined) ??
      undefined,
    permissionDefaults:
      (readBodyString(body, "permissionDefaults", { maxLength: 20 }) as
        | "owner"
        | "admin"
        | "member"
        | "viewer"
        | undefined) ?? undefined
  });

  if (!workspace) {
    throw new ApiError({
      status: 404,
      code: "WORKSPACE_NOT_FOUND",
      message: "Workspace settings not found.",
      expose: true
    });
  }

  return {
    data: {
      workspace
    }
  };
}, {
  audit: {
    action: "settings.workspace.update"
  }
});
