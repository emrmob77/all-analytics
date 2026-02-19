import { createApiHandler } from "@/lib/api/handler";
import {
  ensureObjectRecord,
  readBodyInteger,
  readBodyString,
  readIntegerParam,
  readStringParam
} from "@/lib/api/validation";
import { listIntegrationRequests, requestIntegration } from "@/lib/connectors/store";

interface ListIntegrationRequestsQueryDto {
  tenantId?: string;
  limit: number;
}

interface RequestIntegrationBodyDto {
  providerName: string;
  requestedBy: string;
  tenantId: string;
  useCase: string;
  businessImpact: number;
  monthlySpendUsd?: number;
}

function parseListIntegrationRequestsQuery(url: URL): ListIntegrationRequestsQueryDto {
  const params = url.searchParams;

  return {
    tenantId: readStringParam(params, "tenantId", { maxLength: 128 }),
    limit: readIntegerParam(params, "limit", { min: 1, max: 200 }) ?? 100
  };
}

function parseRequestIntegrationBody(body: unknown): RequestIntegrationBodyDto {
  const record = ensureObjectRecord(body);

  return {
    providerName: readBodyString(record, "providerName", {
      required: true,
      maxLength: 120
    }) as string,
    requestedBy: readBodyString(record, "requestedBy", {
      required: true,
      maxLength: 120
    }) as string,
    tenantId: readBodyString(record, "tenantId", {
      required: true,
      maxLength: 128
    }) as string,
    useCase: readBodyString(record, "useCase", {
      required: true,
      maxLength: 1000
    }) as string,
    businessImpact: readBodyInteger(record, "businessImpact", {
      required: true,
      min: 1,
      max: 5
    }) as number,
    monthlySpendUsd: readBodyInteger(record, "monthlySpendUsd", {
      min: 0,
      max: 1_000_000_000
    })
  };
}

export const GET = createApiHandler(async (request, context) => {
  const query = parseListIntegrationRequestsQuery(new URL(request.url));
  context.requireTenantAccess(query.tenantId);

  const items = listIntegrationRequests(query);

  return {
    data: {
      items,
      count: items.length,
      filters: query
    }
  };
}, {
  auth: {
    required: true,
    roles: ["owner", "admin"]
  },
  rateLimit: {
    limit: 60,
    windowMs: 60_000,
    keyPrefix: "connectors-request-list"
  },
  audit: {
    action: "connectors.request.list"
  }
});

export const POST = createApiHandler(async (_request, context) => {
  const payload = parseRequestIntegrationBody(await context.readJson<unknown>());
  context.requireTenantAccess(payload.tenantId);

  const requestRecord = requestIntegration(payload);

  return {
    data: {
      request: requestRecord
    },
    status: 201
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 30,
    windowMs: 60_000,
    keyPrefix: "connectors-request-create"
  },
  audit: {
    action: "connectors.request.create"
  }
});
