import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import {
  ensureObjectRecord,
  readBodyEnum,
  readBodyString,
  readEnumParam,
  readIntegerParam,
  readStringParam
} from "@/lib/api/validation";
import { listConnectors, updateConnectorState } from "@/lib/connectors/store";
import { connectorLifecycleStateValues } from "@/lib/connectors/types";
import { integrationCategoryValues } from "@/lib/integrations/types";

interface ListConnectorsQueryDto {
  search?: string;
  category?: (typeof integrationCategoryValues)[number];
  lifecycleState?: (typeof connectorLifecycleStateValues)[number];
  tenantId?: string;
  limit: number;
}

interface UpdateConnectorStateBodyDto {
  connectorKey: string;
  lifecycleState: (typeof connectorLifecycleStateValues)[number];
  tenantId?: string;
}

function parseListConnectorsQuery(url: URL): ListConnectorsQueryDto {
  const params = url.searchParams;

  return {
    search: readStringParam(params, "search", { maxLength: 64 }),
    category: readEnumParam(params, "category", integrationCategoryValues),
    lifecycleState: readEnumParam(params, "lifecycleState", connectorLifecycleStateValues),
    tenantId: readStringParam(params, "tenantId", { maxLength: 128 }),
    limit: readIntegerParam(params, "limit", { min: 1, max: 500 }) ?? 200
  };
}

function parseUpdateConnectorStateBody(body: unknown): UpdateConnectorStateBodyDto {
  const record = ensureObjectRecord(body);

  return {
    connectorKey: readBodyString(record, "connectorKey", {
      required: true,
      maxLength: 160
    }) as string,
    lifecycleState: readBodyEnum(record, "lifecycleState", connectorLifecycleStateValues, {
      required: true
    }) as (typeof connectorLifecycleStateValues)[number],
    tenantId: readBodyString(record, "tenantId", { maxLength: 128 })
  };
}

export const GET = createApiHandler(async (request, context) => {
  const query = parseListConnectorsQuery(new URL(request.url));
  context.requireTenantAccess(query.tenantId);

  const items = listConnectors(query);

  return {
    data: {
      items,
      count: items.length,
      filters: query,
      lifecycleStates: connectorLifecycleStateValues
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 100,
    windowMs: 60_000,
    keyPrefix: "connectors-list"
  },
  audit: {
    action: "connectors.list"
  }
});

export const POST = createApiHandler(async (_request, context) => {
  const payload = parseUpdateConnectorStateBody(await context.readJson<unknown>());
  context.requireTenantAccess(payload.tenantId);

  const connector = updateConnectorState(payload.connectorKey, payload.lifecycleState);

  if (!connector) {
    throw new ApiError({
      status: 404,
      code: "CONNECTOR_NOT_FOUND",
      message: `Connector '${payload.connectorKey}' not found.`,
      expose: true
    });
  }

  return {
    data: {
      connector
    }
  };
}, {
  auth: {
    required: true,
    roles: ["owner", "admin"]
  },
  rateLimit: {
    limit: 40,
    windowMs: 60_000,
    keyPrefix: "connectors-update-state"
  },
  audit: {
    action: "connectors.state.update"
  }
});
