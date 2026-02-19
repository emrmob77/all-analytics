"use client";

import { QueryCache, QueryClient } from "@tanstack/react-query";

import { toast } from "@/lib/toast";

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("timeout") ||
    message.includes("connection")
  );
}

/**
 * Shared React Query client with retry and user friendly error notifications.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(toErrorMessage(error, "Data could not be loaded. Please try again."));
    }
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (isNetworkError(error)) return failureCount < 2;
        return failureCount < 1;
      }
    },
    mutations: {
      retry: (failureCount, error) => {
        if (isNetworkError(error)) return failureCount < 1;
        return false;
      }
    }
  }
});
