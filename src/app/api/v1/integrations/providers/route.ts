import { createApiHandler } from "@/lib/api/handler";
import { readEnumParam, readIntegerParam, readStringParam } from "@/lib/api/validation";
import {
  getIntegrationCategoryLabel,
  integrationCategoryLabels,
  listIntegrationProviders
} from "@/lib/integrations/providerCatalog";
import { integrationAuthModeValues, integrationCategoryValues } from "@/lib/integrations/types";

interface ListProvidersQueryDto {
  category?: (typeof integrationCategoryValues)[number];
  authMode?: (typeof integrationAuthModeValues)[number];
  search?: string;
  limit: number;
}

function parseListProvidersQuery(url: URL): ListProvidersQueryDto {
  const params = url.searchParams;

  return {
    category: readEnumParam(params, "category", integrationCategoryValues),
    authMode: readEnumParam(params, "authMode", integrationAuthModeValues),
    search: readStringParam(params, "search", { maxLength: 64 }),
    limit: readIntegerParam(params, "limit", { min: 1, max: 200 }) ?? 100
  };
}

export const GET = createApiHandler(async (request) => {
  const query = parseListProvidersQuery(new URL(request.url));
  const items = listIntegrationProviders(query);

  return {
    data: {
      items: items.map((provider) => ({
        ...provider,
        categoryLabel: getIntegrationCategoryLabel(provider.category)
      })),
      count: items.length,
      filters: query,
      categories: Object.entries(integrationCategoryLabels).map(([category, label]) => ({
        category,
        label
      }))
    }
  };
}, {
  auth: {
    required: true
  },
  rateLimit: {
    limit: 100,
    windowMs: 60_000,
    keyPrefix: "integrations-providers"
  }
});
