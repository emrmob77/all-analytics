import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import {
  ensureObjectRecord,
  readBodyEnum,
  readBodyInteger,
  readBodyString,
  readEnumParam,
  readIntegerParam,
  readStringParam
} from "@/lib/api/validation";
import { getIntegrationProviderByKey } from "@/lib/integrations/providerCatalog";
import { createSyncJob, listSyncJobs } from "@/lib/sync/store";
import { syncFrequencyValues, syncJobStatusValues } from "@/lib/sync/types";

interface ListSyncJobsQueryDto {
  providerKey?: string;
  brandId?: string;
  status?: (typeof syncJobStatusValues)[number];
  limit: number;
}

interface CreateSyncJobBodyDto {
  providerKey: string;
  brandId: string;
  frequency: (typeof syncFrequencyValues)[number];
  status?: (typeof syncJobStatusValues)[number];
  cursor?: string;
  maxRetries?: number;
  baseBackoffMs?: number;
}

function parseListSyncJobsQuery(url: URL): ListSyncJobsQueryDto {
  const params = url.searchParams;

  return {
    providerKey: readStringParam(params, "providerKey", { maxLength: 80 }),
    brandId: readStringParam(params, "brandId", { maxLength: 128 }),
    status: readEnumParam(params, "status", syncJobStatusValues),
    limit: readIntegerParam(params, "limit", { min: 1, max: 200 }) ?? 100
  };
}

function parseCreateSyncJobBody(body: unknown): CreateSyncJobBodyDto {
  const record = ensureObjectRecord(body);

  return {
    providerKey: readBodyString(record, "providerKey", {
      required: true,
      maxLength: 80
    }) as string,
    brandId: readBodyString(record, "brandId", {
      required: true,
      maxLength: 128
    }) as string,
    frequency: readBodyEnum(record, "frequency", syncFrequencyValues, {
      required: true
    }) as (typeof syncFrequencyValues)[number],
    status: readBodyEnum(record, "status", syncJobStatusValues),
    cursor: readBodyString(record, "cursor", {
      maxLength: 256
    }),
    maxRetries: readBodyInteger(record, "maxRetries", {
      min: 0,
      max: 10
    }),
    baseBackoffMs: readBodyInteger(record, "baseBackoffMs", {
      min: 100,
      max: 60_000
    })
  };
}

export const GET = createApiHandler(async (request, context) => {
  const query = parseListSyncJobsQuery(new URL(request.url));
  context.requireTenantAccess(query.brandId);
  const items = listSyncJobs(query);

  return {
    data: {
      items,
      count: items.length,
      filters: query
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 80,
    windowMs: 60_000,
    keyPrefix: "sync-jobs-list"
  },
  audit: {
    action: "sync.jobs.list"
  }
});

export const POST = createApiHandler(async (_request, context) => {
  const payload = parseCreateSyncJobBody(await context.readJson<unknown>());
  context.requireTenantAccess(payload.brandId);
  const provider = getIntegrationProviderByKey(payload.providerKey);

  if (!provider) {
    throw new ApiError({
      status: 404,
      code: "PROVIDER_NOT_FOUND",
      message: `Unknown provider key: '${payload.providerKey}'.`,
      expose: true
    });
  }

  const job = createSyncJob(payload);

  return {
    data: {
      job,
      provider: {
        key: provider.key,
        name: provider.name
      }
    },
    status: 201
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 40,
    windowMs: 60_000,
    keyPrefix: "sync-jobs-create"
  },
  audit: {
    action: "sync.jobs.create"
  }
});
