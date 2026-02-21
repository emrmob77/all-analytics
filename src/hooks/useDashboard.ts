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
  return d.toISOString().slice(0, 10);
}

// Stale time: 90 seconds (dashboard refreshes ~every 15 min via sync)
const STALE_TIME = 90_000;

export function useDashboardMetrics(dateRange: DateRange, platform: AdPlatform | 'all') {
  const from = toISO(dateRange.from);
  const to   = toISO(dateRange.to);
  return useQuery({
    queryKey: ['dashboard', 'metrics', from, to, platform],
    queryFn:  () => getDashboardMetrics(from, to, platform),
    staleTime: STALE_TIME,
  });
}

export function useDashboardCampaigns(dateRange: DateRange, platform: AdPlatform | 'all') {
  const from = toISO(dateRange.from);
  const to   = toISO(dateRange.to);
  return useQuery({
    queryKey: ['dashboard', 'campaigns', from, to, platform],
    queryFn:  () => getDashboardCampaigns(from, to, platform),
    staleTime: STALE_TIME,
  });
}

export function useDashboardChartData(dateRange: DateRange) {
  const from = toISO(dateRange.from);
  const to   = toISO(dateRange.to);
  return useQuery({
    queryKey: ['dashboard', 'chart', from, to],
    queryFn:  () => getDashboardChartData(from, to),
    staleTime: STALE_TIME,
  });
}

export function useDashboardHourlyData() {
  return useQuery({
    queryKey: ['dashboard', 'hourly'],
    queryFn:  () => getDashboardHourlyData(),
    staleTime: STALE_TIME,
  });
}

export function useDashboardPlatformSummary(dateRange: DateRange) {
  const from = toISO(dateRange.from);
  const to   = toISO(dateRange.to);
  return useQuery({
    queryKey: ['dashboard', 'platform-summary', from, to],
    queryFn:  () => getDashboardPlatformSummary(from, to),
    staleTime: STALE_TIME,
  });
}
