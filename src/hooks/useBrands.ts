"use client";

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Brand } from "@/types/navigation";

const BRANDS_QUERY_KEY = ["brands"] as const;

const fallbackBrands: Brand[] = [
  { id: "brand-1", name: "Growth Hacking Inc.", avatar: "GH", activeAdmins: 3 },
  { id: "brand-2", name: "Nova Retail Group", avatar: "NR", activeAdmins: 2 },
  { id: "brand-3", name: "Momentum Labs", avatar: "ML", activeAdmins: 5 }
];

interface UseBrandsOptions {
  enabled?: boolean;
  fallbackToMockData?: boolean;
}

function mapBrandRowsToBrands(rows: Array<{ id: string; name: string; avatar: string | null; active_admins: number | null }>) {
  return rows.map((item) => ({
    id: item.id,
    name: item.name,
    avatar: item.avatar ?? item.name.slice(0, 2).toUpperCase(),
    activeAdmins: item.active_admins ?? 0
  }));
}

async function fetchBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, avatar, active_admins")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return fallbackBrands;
  }

  return mapBrandRowsToBrands(data);
}

export function useBrands(options?: UseBrandsOptions) {
  const fallbackToMockData = options?.fallbackToMockData ?? false;

  return useQuery({
    queryKey: BRANDS_QUERY_KEY,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      try {
        return await fetchBrands();
      } catch (error) {
        if (fallbackToMockData) {
          return fallbackBrands;
        }
        throw error;
      }
    }
  });
}

export type { UseBrandsOptions };
