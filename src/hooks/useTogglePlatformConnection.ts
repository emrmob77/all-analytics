"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import type { Database } from "@/types/supabase";

type PlatformConnectionRow = Database["public"]["Tables"]["platform_connections"]["Row"];

interface TogglePlatformConnectionInput {
  connectionId: string;
  isActive: boolean;
}

interface UseTogglePlatformConnectionOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (row: PlatformConnectionRow) => void;
  onError?: (error: Error) => void;
}

async function togglePlatformConnection(input: TogglePlatformConnectionInput) {
  const { data, error } = await supabase
    .from("platform_connections")
    .update({ is_active: input.isActive })
    .eq("id", input.connectionId)
    .select("id, brand_id, platform_id, is_active, spend, spend_limit, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function useTogglePlatformConnection(options?: UseTogglePlatformConnectionOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePlatformConnection,
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: ["platform-connections"] });
      toast.success(options?.successMessage ?? "Platform connection updated.");
      options?.onSuccess?.(row);
    },
    onError: (error: Error) => {
      toast.error(options?.errorMessage ?? "Failed to update platform connection.");
      options?.onError?.(error);
    }
  });
}

export type { TogglePlatformConnectionInput, UseTogglePlatformConnectionOptions };
