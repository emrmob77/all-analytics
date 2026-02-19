"use client";

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type MetricRow = Database["public"]["Tables"]["metrics"]["Row"];

interface Metric {
  id: string;
  name: string;
  description: string | null;
  category: string;
  source: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

interface UseMetricsOptions {
  includeInactive?: boolean;
  enabled?: boolean;
}

function metricsQueryKey(options?: UseMetricsOptions) {
  return ["metrics", options?.includeInactive ? "all" : "active-only"] as const;
}

function mapMetricRows(rows: MetricRow[]): Metric[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    source: row.source,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function fetchMetrics(options?: UseMetricsOptions) {
  let query = supabase
    .from("metrics")
    .select("id, name, description, category, source, is_active, created_at, updated_at")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return mapMetricRows(data ?? []);
}

export function useMetrics(options?: UseMetricsOptions) {
  return useQuery({
    queryKey: metricsQueryKey(options),
    enabled: options?.enabled ?? true,
    queryFn: () => fetchMetrics(options)
  });
}

export type { Metric, UseMetricsOptions };
