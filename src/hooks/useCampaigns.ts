"use client";

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignStatus = CampaignRow["status"] | "all";

interface Campaign {
  id: string;
  brandId: string;
  name: string;
  platformId: string;
  status: CampaignRow["status"];
  budgetUsed: number;
  budgetLimit: number;
  roas: number;
  roasTrend: CampaignRow["roas_trend"];
  createdAt: string | null;
  updatedAt: string | null;
}

interface UseCampaignsOptions {
  brandId?: string | null;
  filter?: CampaignStatus;
  enabled?: boolean;
}

function campaignsQueryKey(options?: UseCampaignsOptions) {
  return ["campaigns", options?.brandId ?? "all-brands", options?.filter ?? "all"] as const;
}

function mapCampaignRows(rows: CampaignRow[]): Campaign[] {
  return rows.map((row) => ({
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
  }));
}

async function fetchCampaigns(options?: UseCampaignsOptions) {
  let query = supabase
    .from("campaigns")
    .select("id, brand_id, name, platform_id, status, budget_used, budget_limit, roas, roas_trend, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (options?.brandId) {
    query = query.eq("brand_id", options.brandId);
  }

  if (options?.filter && options.filter !== "all") {
    query = query.eq("status", options.filter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return mapCampaignRows(data ?? []);
}

export function useCampaigns(options?: UseCampaignsOptions) {
  return useQuery({
    queryKey: campaignsQueryKey(options),
    enabled: options?.enabled ?? true,
    queryFn: () => fetchCampaigns(options)
  });
}

export type { Campaign, CampaignStatus, UseCampaignsOptions };
