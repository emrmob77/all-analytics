import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { readIntegerParam, readStringParam } from "@/lib/api/validation";
import { supabase } from "@/lib/supabase";

interface DashboardChannelsQueryDto {
  brandId?: string;
  platformId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
}

function parseDate(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: `Invalid '${field}' parameter: expected YYYY-MM-DD format.`,
      expose: true
    });
  }

  return value;
}

function parseDashboardChannelsQuery(url: URL): DashboardChannelsQueryDto {
  const params = url.searchParams;
  const dateFrom = readStringParam(params, "dateFrom", { maxLength: 10 });
  const dateTo = readStringParam(params, "dateTo", { maxLength: 10 });

  return {
    brandId: readStringParam(params, "brandId", { maxLength: 128 }),
    platformId: readStringParam(params, "platformId", { maxLength: 128 }),
    dateFrom: dateFrom ? parseDate(dateFrom, "dateFrom") : undefined,
    dateTo: dateTo ? parseDate(dateTo, "dateTo") : undefined,
    limit: readIntegerParam(params, "limit", { min: 1, max: 500 }) ?? 200
  };
}

export const GET = createApiHandler(async (request, context) => {
  const query = parseDashboardChannelsQuery(new URL(request.url));
  context.requireTenantAccess(query.brandId);

  let channelsQuery = supabase
    .from("platform_connections")
    .select("id, brand_id, platform_id, is_active, spend, spend_limit, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(query.limit);

  if (query.brandId) {
    channelsQuery = channelsQuery.eq("brand_id", query.brandId);
  }

  if (query.platformId) {
    channelsQuery = channelsQuery.eq("platform_id", query.platformId);
  }

  if (query.dateFrom) {
    channelsQuery = channelsQuery.gte("created_at", `${query.dateFrom}T00:00:00.000Z`);
  }

  if (query.dateTo) {
    channelsQuery = channelsQuery.lte("created_at", `${query.dateTo}T23:59:59.999Z`);
  }

  const [channelsResult, platformsResult] = await Promise.all([
    channelsQuery,
    supabase.from("platforms").select("id, key, name, logo_key")
  ]);

  if (channelsResult.error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to fetch dashboard channels.",
      details: { source: "supabase", message: channelsResult.error.message },
      expose: true
    });
  }

  if (platformsResult.error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to fetch platform metadata.",
      details: { source: "supabase", message: platformsResult.error.message },
      expose: true
    });
  }

  const platformMap = new Map((platformsResult.data ?? []).map((item) => [item.id, item]));

  return {
    data: {
      items: (channelsResult.data ?? []).map((item) => {
        const platform = platformMap.get(item.platform_id);
        return {
          id: item.id,
          brandId: item.brand_id,
          platformId: item.platform_id,
          platform: platform
            ? {
                id: platform.id,
                key: platform.key,
                name: platform.name,
                logoKey: platform.logo_key
              }
            : null,
          isActive: item.is_active,
          spend: item.spend,
          spendLimit: item.spend_limit,
          spendUtilizationRate: item.spend_limit > 0 ? item.spend / item.spend_limit : 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        };
      }),
      count: channelsResult.data?.length ?? 0,
      filters: query
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 120,
    windowMs: 60_000,
    keyPrefix: "dashboard-channels"
  }
});
