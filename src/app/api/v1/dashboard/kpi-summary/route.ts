import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { readStringParam } from "@/lib/api/validation";
import { supabase } from "@/lib/supabase";

interface KpiSummaryQueryDto {
  brandId?: string;
  platformId?: string;
  dateFrom?: string;
  dateTo?: string;
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

function parseKpiSummaryQuery(url: URL): KpiSummaryQueryDto {
  const params = url.searchParams;
  const dateFrom = readStringParam(params, "dateFrom", { maxLength: 10 });
  const dateTo = readStringParam(params, "dateTo", { maxLength: 10 });

  return {
    brandId: readStringParam(params, "brandId", { maxLength: 128 }),
    platformId: readStringParam(params, "platformId", { maxLength: 128 }),
    dateFrom: dateFrom ? parseDate(dateFrom, "dateFrom") : undefined,
    dateTo: dateTo ? parseDate(dateTo, "dateTo") : undefined
  };
}

export const GET = createApiHandler(async (request, context) => {
  const query = parseKpiSummaryQuery(new URL(request.url));
  context.requireTenantAccess(query.brandId);

  let campaignQuery = supabase
    .from("campaigns")
    .select("id, status, budget_used, budget_limit, roas, created_at");

  if (query.brandId) {
    campaignQuery = campaignQuery.eq("brand_id", query.brandId);
  }

  if (query.platformId) {
    campaignQuery = campaignQuery.eq("platform_id", query.platformId);
  }

  if (query.dateFrom) {
    campaignQuery = campaignQuery.gte("created_at", `${query.dateFrom}T00:00:00.000Z`);
  }

  if (query.dateTo) {
    campaignQuery = campaignQuery.lte("created_at", `${query.dateTo}T23:59:59.999Z`);
  }

  let channelQuery = supabase
    .from("platform_connections")
    .select("id, is_active, spend, spend_limit");

  if (query.brandId) {
    channelQuery = channelQuery.eq("brand_id", query.brandId);
  }

  if (query.platformId) {
    channelQuery = channelQuery.eq("platform_id", query.platformId);
  }

  const [campaignResult, channelResult] = await Promise.all([campaignQuery, channelQuery]);

  if (campaignResult.error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to fetch campaign summary.",
      details: { source: "supabase", message: campaignResult.error.message },
      expose: true
    });
  }

  if (channelResult.error) {
    throw new ApiError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Unable to fetch channel summary.",
      details: { source: "supabase", message: channelResult.error.message },
      expose: true
    });
  }

  const campaigns = campaignResult.data ?? [];
  const channels = channelResult.data ?? [];

  const totalBudgetUsed = campaigns.reduce((sum, item) => sum + item.budget_used, 0);
  const totalBudgetLimit = campaigns.reduce((sum, item) => sum + item.budget_limit, 0);
  const averageRoas = campaigns.length > 0 ? campaigns.reduce((sum, item) => sum + item.roas, 0) / campaigns.length : 0;
  const connectedChannels = channels.filter((item) => item.is_active).length;
  const channelSpend = channels.reduce((sum, item) => sum + item.spend, 0);
  const channelSpendLimit = channels.reduce((sum, item) => sum + item.spend_limit, 0);

  return {
    data: {
      summary: {
        campaignCount: campaigns.length,
        activeCampaignCount: campaigns.filter((item) => item.status === "active").length,
        connectedChannels,
        totalBudgetUsed,
        totalBudgetLimit,
        averageRoas,
        spendUtilizationRate: totalBudgetLimit > 0 ? totalBudgetUsed / totalBudgetLimit : 0,
        channelSpend,
        channelSpendLimit,
        channelSpendUtilizationRate: channelSpendLimit > 0 ? channelSpend / channelSpendLimit : 0
      },
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
    keyPrefix: "dashboard-kpi-summary"
  }
});
