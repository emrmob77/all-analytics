"use client";

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type PlatformRow = Database["public"]["Tables"]["platforms"]["Row"];

interface Platform {
  id: string;
  key: string;
  name: string;
  logoKey: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UsePlatformsOptions {
  enabled?: boolean;
}

function platformsQueryKey() {
  return ["platforms"] as const;
}

function mapPlatformRows(rows: PlatformRow[]): Platform[] {
  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    logoKey: row.logo_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function fetchPlatforms() {
  const { data, error } = await supabase
    .from("platforms")
    .select("id, key, name, logo_key, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return mapPlatformRows(data ?? []);
}

export function usePlatforms(options?: UsePlatformsOptions) {
  return useQuery({
    queryKey: platformsQueryKey(),
    enabled: options?.enabled ?? true,
    queryFn: fetchPlatforms
  });
}

export type { Platform, UsePlatformsOptions };
