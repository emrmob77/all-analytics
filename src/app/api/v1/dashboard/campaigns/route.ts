import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { readEnumParam, readIntegerParam, readStringParam } from "@/lib/api/validation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type CampaignStatus = Database["public"]["Tables"]["campaigns"]["Row"]["status"];

const campaignStatusValues = ["active", "paused", "stopped"] as const;

interface DashboardCampaignsQueryDto {
  brandId?: string;
  platformId?: string;
  status?: CampaignStatus;
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

function parseDashboardCampaignsQuery(url: URL): DashboardCampaignsQueryDto {
  const params = url.searchParams;
  const dateFrom = readStringParam(params, "dateFrom", { maxLength: 10 });
  const dateTo = readStringParam(params, "dateTo", { maxLength: 10 });

  return {
    brandId: readStringParam(params, "brandId", { maxLength: 128 }),
    platformId: readStringParam(params, "platformId", { maxLength: 128 }),
    status: readEnumParam(params, "status", campaignStatusValues),
    dateFrom: dateFrom ? parseDate(dateFrom, "dateFrom") : undefined,
    dateTo: dateTo ? parseDate(dateTo, "dateTo") : undefined,
    limit: readIntegerParam(params, "limit", { min: 1, max: 500 }) ?? 200
  };
}

export const GET = createApiHandler(async (request, context) => {
  const query = parseDashboardCampaignsQuery(new URL(request.url));
  context.requireTenantAccess(query.brandId);

  let campaignQuery = supabase
    .from("campaigns")
    .select("id, brand_id, name, platform_id, status, budget_used, budget_limit, roas, roas_trend, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(query.limit);

  if (query.brandId) {
    campaignQuery = campaignQuery.eq("brand_id", query.brandId);
  }

  if (query.platformId) {
    campaignQuery = campaignQuery.eq("platform_id", query.platformId);
  }

  if (query.status) {
    campaignQuery = campaignQuery.eq("status", query.status);
  }

  if (query.dateFrom) {
    campaignQuery = campaignQuery.gte("created_at", `${query.dateFrom}T00:00:00.000Z`);
  }

  if (query.dateTo) {
    campaignQuery = campaignQuery.lte("created_at", `${query.dateTo}T23:59:59.999Z`);
  }

  const { data, error } = await campaignQuery;

  if (error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to fetch dashboard campaign list.",
      details: { source: "supabase", message: error.message },
      expose: true
    });
  }

  return {
    data: {
      items: (data ?? []).map((item) => ({
        id: item.id,
        brandId: item.brand_id,
        name: item.name,
        platformId: item.platform_id,
        status: item.status,
        budgetUsed: item.budget_used,
        budgetLimit: item.budget_limit,
        roas: item.roas,
        roasTrend: item.roas_trend,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })),
      count: data?.length ?? 0,
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
    keyPrefix: "dashboard-campaigns"
  }
});
