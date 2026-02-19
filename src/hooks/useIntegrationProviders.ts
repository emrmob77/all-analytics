"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchApi } from "@/lib/api/client";
import type { IntegrationAuthMode, IntegrationCategory, IntegrationProviderDefinition } from "@/lib/integrations/types";

interface IntegrationCategoryOption {
  category: string;
  label: string;
}

interface ListIntegrationProvidersResponse {
  items: (IntegrationProviderDefinition & { categoryLabel: string })[];
  count: number;
  filters: {
    category?: IntegrationCategory;
    authMode?: IntegrationAuthMode;
    search?: string;
    limit: number;
  };
  categories: IntegrationCategoryOption[];
}

interface UseIntegrationProvidersOptions {
  category?: IntegrationCategory;
  authMode?: IntegrationAuthMode;
  search?: string;
  limit?: number;
  enabled?: boolean;
}

function integrationProvidersQueryKey(options?: UseIntegrationProvidersOptions) {
  return [
    "integration-providers",
    options?.category ?? "all-categories",
    options?.authMode ?? "all-auth-modes",
    options?.search ?? "",
    options?.limit ?? 100
  ] as const;
}

async function fetchIntegrationProviders(
  options?: UseIntegrationProvidersOptions
): Promise<ListIntegrationProvidersResponse> {
  const params = new URLSearchParams();

  if (options?.category) {
    params.set("category", options.category);
  }

  if (options?.authMode) {
    params.set("authMode", options.authMode);
  }

  if (options?.search) {
    params.set("search", options.search);
  }

  if (typeof options?.limit === "number") {
    params.set("limit", String(options.limit));
  }

  const search = params.toString();
  const endpoint = search.length > 0 ? `/api/v1/integrations/providers?${search}` : "/api/v1/integrations/providers";

  const { data } = await fetchApi<ListIntegrationProvidersResponse>(endpoint);
  return data;
}

export function useIntegrationProviders(options?: UseIntegrationProvidersOptions) {
  return useQuery({
    queryKey: integrationProvidersQueryKey(options),
    enabled: options?.enabled ?? true,
    queryFn: () => fetchIntegrationProviders(options)
  });
}

export type {
  IntegrationCategoryOption,
  ListIntegrationProvidersResponse,
  UseIntegrationProvidersOptions
};
