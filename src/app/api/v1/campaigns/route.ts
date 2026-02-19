import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { readEnumParam, readIntegerParam, readStringParam } from "@/lib/api/validation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];

const campaignStatuses = ["active", "paused", "stopped"] as const;
type CampaignStatus = (typeof campaignStatuses)[number];

interface ListCampaignsQueryDto {
  brandId?: string;
  status?: CampaignStatus;
  limit: number;
}

interface CampaignDto {
  id: string;
  brandId: string;
  name: string;
  platformId: string;
  status: CampaignStatus;
  budgetUsed: number;
  budgetLimit: number;
  roas: number;
  roasTrend: "up" | "down" | "flat";
  createdAt: string;
  updatedAt: string;
}

function parseListCampaignsQuery(url: URL): ListCampaignsQueryDto {
  const params = url.searchParams;

  return {
    brandId: readStringParam(params, "brandId", { maxLength: 128 }),
    status: readEnumParam(params, "status", campaignStatuses),
    limit: readIntegerParam(params, "limit", { min: 1, max: 200 }) ?? 100
  };
}

function mapCampaignRow(row: CampaignRow): CampaignDto {
  return {
    id: row.id,
    brandId: row.brand_id,
    name: row.name,
    platformId: row.platform_id,
    status: row.status,
    budgetUsed: row.budget_used,
    budgetLimit: row.budget_limit,
    roas: row.roas,
    roasTrend: row.roas_trend,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const GET = createApiHandler(async (request, context) => {
  const query = parseListCampaignsQuery(new URL(request.url));
  context.requireTenantAccess(query.brandId);

  let campaignsQuery = supabase
    .from("campaigns")
    .select("id, brand_id, name, platform_id, status, budget_used, budget_limit, roas, roas_trend, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(query.limit);

  if (query.brandId) {
    campaignsQuery = campaignsQuery.eq("brand_id", query.brandId);
  }

  if (query.status) {
    campaignsQuery = campaignsQuery.eq("status", query.status);
  }

  const { data, error } = await campaignsQuery;

  if (error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to fetch campaigns.",
      details: { source: "supabase", message: error.message },
      expose: true
    });
  }

  return {
    data: {
      items: (data ?? []).map(mapCampaignRow),
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
    keyPrefix: "campaigns-list"
  }
});
