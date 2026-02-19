"use client";

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type UserMetricPreferenceRow = Database["public"]["Tables"]["user_metric_preferences"]["Row"];
type MetricRow = Database["public"]["Tables"]["metrics"]["Row"];

interface UserMetricPreference {
  id: string;
  userId: string;
  brandId: string;
  metricId: string;
  position: number;
  createdAt: string | null;
  updatedAt: string | null;
  metric: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    source: string;
    isActive: boolean;
  } | null;
}

interface UseUserMetricPreferencesOptions {
  userId?: string | null;
  brandId?: string | null;
  enabled?: boolean;
}

function userMetricPreferencesQueryKey(options?: UseUserMetricPreferencesOptions) {
  return ["user-metric-preferences", options?.userId ?? "no-user", options?.brandId ?? "all-brands"] as const;
}

function mapPreferenceRows(preferences: UserMetricPreferenceRow[], metrics: MetricRow[]): UserMetricPreference[] {
  const metricById = new Map(metrics.map((metric) => [metric.id, metric]));

  return preferences.map((row) => {
    const metric = metricById.get(row.metric_id);

    return {
      id: row.id,
      userId: row.user_id,
      brandId: row.brand_id,
      metricId: row.metric_id,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metric: metric
        ? {
            id: metric.id,
            name: metric.name,
            description: metric.description,
            category: metric.category,
            source: metric.source,
            isActive: metric.is_active
          }
        : null
    };
  });
}

async function fetchUserMetricPreferences(options?: UseUserMetricPreferencesOptions) {
  if (!options?.userId) {
    return [];
  }

  let preferencesQuery = supabase
    .from("user_metric_preferences")
    .select("id, user_id, brand_id, metric_id, position, created_at, updated_at")
    .eq("user_id", options.userId)
    .order("position", { ascending: true });

  if (options.brandId) {
    preferencesQuery = preferencesQuery.eq("brand_id", options.brandId);
  }

  const [preferencesResult, metricsResult] = await Promise.all([
    preferencesQuery,
    supabase.from("metrics").select("id, name, description, category, source, is_active, created_at, updated_at")
  ]);

  if (preferencesResult.error) {
    throw new Error(preferencesResult.error.message);
  }

  if (metricsResult.error) {
    throw new Error(metricsResult.error.message);
  }

  return mapPreferenceRows(preferencesResult.data ?? [], metricsResult.data ?? []);
}

export function useUserMetricPreferences(options?: UseUserMetricPreferencesOptions) {
  const enabled = options?.enabled ?? Boolean(options?.userId);

  return useQuery({
    queryKey: userMetricPreferencesQueryKey(options),
    enabled,
    queryFn: () => fetchUserMetricPreferences(options)
  });
}

export type { UseUserMetricPreferencesOptions, UserMetricPreference };
