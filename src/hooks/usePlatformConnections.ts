"use client";

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type PlatformConnectionRow = Database["public"]["Tables"]["platform_connections"]["Row"];
type PlatformRow = Database["public"]["Tables"]["platforms"]["Row"];

interface PlatformConnection {
  id: string;
  brandId: string;
  platformId: string;
  isActive: boolean;
  spend: number;
  spendLimit: number;
  createdAt: string | null;
  updatedAt: string | null;
  platform: {
    id: string;
    key: string;
    name: string;
    logoKey: string | null;
  } | null;
}

interface UsePlatformConnectionsOptions {
  brandId?: string | null;
  enabled?: boolean;
}

function platformConnectionsQueryKey(options?: UsePlatformConnectionsOptions) {
  return ["platform-connections", options?.brandId ?? "all-brands"] as const;
}

function mapConnectionRows(connections: PlatformConnectionRow[], platforms: PlatformRow[]): PlatformConnection[] {
  const platformById = new Map(platforms.map((platform) => [platform.id, platform]));

  return connections.map((connection) => {
    const platform = platformById.get(connection.platform_id);

    return {
      id: connection.id,
      brandId: connection.brand_id,
      platformId: connection.platform_id,
      isActive: connection.is_active,
      spend: connection.spend,
      spendLimit: connection.spend_limit,
      createdAt: connection.created_at,
      updatedAt: connection.updated_at,
      platform: platform
        ? {
            id: platform.id,
            key: platform.key,
            name: platform.name,
            logoKey: platform.logo_key
          }
        : null
    };
  });
}

async function fetchPlatformConnections(options?: UsePlatformConnectionsOptions) {
  let connectionQuery = supabase
    .from("platform_connections")
    .select("id, brand_id, platform_id, is_active, spend, spend_limit, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (options?.brandId) {
    connectionQuery = connectionQuery.eq("brand_id", options.brandId);
  }

  const [connectionsResult, platformsResult] = await Promise.all([
    connectionQuery,
    supabase.from("platforms").select("id, key, name, logo_key, created_at, updated_at")
  ]);

  if (connectionsResult.error) {
    throw new Error(connectionsResult.error.message);
  }

  if (platformsResult.error) {
    throw new Error(platformsResult.error.message);
  }

  return mapConnectionRows(connectionsResult.data ?? [], platformsResult.data ?? []);
}

export function usePlatformConnections(options?: UsePlatformConnectionsOptions) {
  return useQuery({
    queryKey: platformConnectionsQueryKey(options),
    enabled: options?.enabled ?? true,
    queryFn: () => fetchPlatformConnections(options)
  });
}

export type { PlatformConnection, UsePlatformConnectionsOptions };
