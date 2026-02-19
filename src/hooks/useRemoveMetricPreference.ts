"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

type RemoveMetricPreferenceInput =
  | {
      preferenceId: string;
      userId?: string;
      brandId?: string;
      metricId?: string;
    }
  | {
      preferenceId?: string;
      userId: string;
      brandId: string;
      metricId: string;
    };

interface RemoveMetricPreferenceResult {
  preferenceId?: string;
  userId?: string;
  brandId?: string;
  metricId?: string;
}

interface UseRemoveMetricPreferenceOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: RemoveMetricPreferenceResult) => void;
  onError?: (error: Error) => void;
}

async function removeMetricPreference(input: RemoveMetricPreferenceInput): Promise<RemoveMetricPreferenceResult> {
  let query = supabase.from("user_metric_preferences").delete();

  if (input.preferenceId) {
    query = query.eq("id", input.preferenceId);
  } else {
    const userId = input.userId;
    const brandId = input.brandId;
    const metricId = input.metricId;

    if (!userId || !brandId || !metricId) {
      throw new Error("userId, brandId and metricId are required when preferenceId is not provided.");
    }

    query = query.eq("user_id", userId).eq("brand_id", brandId).eq("metric_id", metricId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    preferenceId: input.preferenceId,
    userId: input.userId,
    brandId: input.brandId,
    metricId: input.metricId
  };
}

export function useRemoveMetricPreference(options?: UseRemoveMetricPreferenceOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMetricPreference,
    onSuccess: async (result) => {
      if (result.userId && result.brandId) {
        await queryClient.invalidateQueries({
          queryKey: ["user-metric-preferences", result.userId, result.brandId]
        });
      } else {
        await queryClient.invalidateQueries({ queryKey: ["user-metric-preferences"] });
      }

      toast.success(options?.successMessage ?? "Metric preference removed.");
      options?.onSuccess?.(result);
    },
    onError: (error: Error) => {
      toast.error(options?.errorMessage ?? "Failed to remove metric preference.");
      options?.onError?.(error);
    }
  });
}

export type {
  RemoveMetricPreferenceInput,
  RemoveMetricPreferenceResult,
  UseRemoveMetricPreferenceOptions
};
