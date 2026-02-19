"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import type { Database } from "@/types/supabase";

type UserMetricPreferenceRow = Database["public"]["Tables"]["user_metric_preferences"]["Row"];

interface AddMetricPreferenceInput {
  userId: string;
  brandId: string;
  metricId: string;
  position?: number;
}

interface UseAddMetricPreferenceOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (row: UserMetricPreferenceRow) => void;
  onError?: (error: Error) => void;
}

async function resolveNextPosition(input: AddMetricPreferenceInput) {
  if (typeof input.position === "number") return input.position;

  const { data, error } = await supabase
    .from("user_metric_preferences")
    .select("position")
    .eq("user_id", input.userId)
    .eq("brand_id", input.brandId)
    .order("position", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const currentMax = data?.[0]?.position ?? -1;
  return currentMax + 1;
}

async function addMetricPreference(input: AddMetricPreferenceInput) {
  const position = await resolveNextPosition(input);

  const { data, error } = await supabase
    .from("user_metric_preferences")
    .insert({
      user_id: input.userId,
      brand_id: input.brandId,
      metric_id: input.metricId,
      position
    })
    .select("id, user_id, brand_id, metric_id, position, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function useAddMetricPreference(options?: UseAddMetricPreferenceOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMetricPreference,
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: ["user-metric-preferences", row.user_id, row.brand_id] });
      toast.success(options?.successMessage ?? "Metric preference added.");
      options?.onSuccess?.(row);
    },
    onError: (error: Error) => {
      toast.error(options?.errorMessage ?? "Failed to add metric preference.");
      options?.onError?.(error);
    }
  });
}

export type { AddMetricPreferenceInput, UseAddMetricPreferenceOptions };
