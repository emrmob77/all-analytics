import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyString, readStringParam } from "@/lib/api/validation";
import {
  getDefaultTenantId,
  listIntegrationSettings,
  updateIntegrationSettings
} from "@/lib/saas/store";

const syncFrequencies = ["hourly", "daily"] as const;
const lifecycleStates = ["connected", "syncing", "paused", "failed"] as const;

function asLifecycleState(value: string | undefined) {
  if (!value) return undefined;
  return lifecycleStates.includes(value as (typeof lifecycleStates)[number])
    ? (value as (typeof lifecycleStates)[number])
    : undefined;
}

function asSyncFrequency(value: string | undefined) {
  if (!value) return undefined;
  return syncFrequencies.includes(value as (typeof syncFrequencies)[number])
    ? (value as (typeof syncFrequencies)[number])
    : undefined;
}

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);
  const tenantId = readStringParam(url.searchParams, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId();

  return {
    data: {
      integrations: listIntegrationSettings(tenantId)
    }
  };
});

export const PUT = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const tenantId = readBodyString(body, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId();
  const integrationId = readBodyString(body, "integrationId", { required: true, maxLength: 255 }) ?? "";

  const integration = updateIntegrationSettings({
    tenantId,
    integrationId,
    lifecycleState: asLifecycleState(readBodyString(body, "lifecycleState", { maxLength: 20 })),
    syncFrequency: asSyncFrequency(readBodyString(body, "syncFrequency", { maxLength: 20 }))
  });

  if (!integration) {
    throw new ApiError({
      status: 404,
      code: "INTEGRATION_NOT_FOUND",
      message: "Integration setting could not be found.",
      expose: true
    });
  }

  return {
    data: {
      integration,
      testConnection: {
        status: integration.lifecycleState === "failed" ? "failed" : "ok",
        checkedAt: new Date().toISOString()
      }
    }
  };
}, {
  audit: {
    action: "settings.integrations.update"
  }
});
