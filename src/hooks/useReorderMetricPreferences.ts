"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

interface ReorderMetricPreferenceItem {
  preferenceId: string;
  position: number;
}

interface ReorderMetricPreferencesInput {
  userId: string;
  brandId: string;
  items: ReorderMetricPreferenceItem[];
}

interface UseReorderMetricPreferencesOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (input: ReorderMetricPreferencesInput) => void;
  onError?: (error: Error) => void;
}

async function reorderMetricPreferences(input: ReorderMetricPreferencesInput) {
  if (input.items.length === 0) {
    return input;
  }

  const updateResults = await Promise.all(
    input.items.map(async (item) => {
      const { error } = await supabase
        .from("user_metric_preferences")
        .update({ position: item.position })
        .eq("id", item.preferenceId)
        .eq("user_id", input.userId)
        .eq("brand_id", input.brandId);

      if (error) {
        throw new Error(error.message);
      }
    })
  );

  void updateResults;
  return input;
}

export function useReorderMetricPreferences(options?: UseReorderMetricPreferencesOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderMetricPreferences,
    onSuccess: async (input) => {
      await queryClient.invalidateQueries({
        queryKey: ["user-metric-preferences", input.userId, input.brandId]
      });

      toast.success(options?.successMessage ?? "Metric preferences reordered.");
      options?.onSuccess?.(input);
    },
    onError: (error: Error) => {
      toast.error(options?.errorMessage ?? "Failed to reorder metric preferences.");
      options?.onError?.(error);
    }
  });
}

export type {
  ReorderMetricPreferenceItem,
  ReorderMetricPreferencesInput,
  UseReorderMetricPreferencesOptions
};
