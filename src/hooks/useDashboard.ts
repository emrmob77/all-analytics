'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getDashboardMetrics,
  getDashboardCampaigns,
  getDashboardChartData,
  getDashboardHourlyData,
  getDashboardPlatformSummary,
} from '@/lib/actions/dashboard';
import type { AdPlatform } from '@/types';
import type { DateRange } from '@/components/ui/date-range-picker';

function toISO(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Stale time: 90 seconds (dashboard refreshes ~every 15 min via sync)
const STALE_TIME = 90_000;

// Throw if server action returns an error string so TanStack Query
// sets isError=true and retries correctly instead of treating it as success.
function throwOnError<T>(result: { data: T; error: string | null }): T {
  if (result.error) throw new Error(result.error);
  return result.data;
}

export function useDashboardMetrics(dateRange: DateRange, platform: AdPlatform | 'all') {
  const from = toISO(dateRange.from);
  const to   = toISO(dateRange.to);
  return useQuery({
    queryKey: ['dashboard', 'metrics', from, to, platform],
    queryFn:  () => getDashboardMetrics(from, to, platform).then(throwOnError),
    staleTime: STALE_TIME,
  });
}

export function useDashboardCampaigns(dateRange: DateRange, platform: AdPlatform | 'all') {
  const from = toISO(dateRange.from);
  const to   = toISO(dateRange.to);
  return useQuery({
    queryKey: ['dashboard', 'campaigns', from, to, platform],
    queryFn:  () => getDashboardCampaigns(from, to, platform).then(throwOnError),
    staleTime: STALE_TIME,
  });
}

export function useDashboardChartData(dateRange: DateRange) {
  const from = toISO(dateRange.from);
  const to   = toISO(dateRange.to);
  return useQuery({
    queryKey: ['dashboard', 'chart', from, to],
    queryFn:  () => getDashboardChartData(from, to).then(throwOnError),
    staleTime: STALE_TIME,
  });
}

export function useDashboardHourlyData() {
  return useQuery({
    queryKey: ['dashboard', 'hourly'],
    queryFn:  () => getDashboardHourlyData().then(throwOnError),
    staleTime: STALE_TIME,
  });
}

export function useDashboardPlatformSummary(dateRange: DateRange) {
  const from = toISO(dateRange.from);
  const to   = toISO(dateRange.to);
  return useQuery({
    queryKey: ['dashboard', 'platform-summary', from, to],
    queryFn:  () => getDashboardPlatformSummary(from, to).then(throwOnError),
    staleTime: STALE_TIME,
  });
}
