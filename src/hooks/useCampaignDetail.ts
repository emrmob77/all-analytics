'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getCampaignDetail,
  getCampaignDailyMetrics,
  getCampaignHourlyMetrics,
} from '@/lib/actions/campaign-detail';

const STALE_TIME = 60_000;

export function useCampaignDetail(campaignId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['campaign-detail', campaignId, from, to],
    queryFn: () =>
      getCampaignDetail(campaignId, from, to).then((res) => {
        if (res.error) throw new Error(res.error);
        return res.data;
      }),
    staleTime: STALE_TIME,
    enabled: !!campaignId,
  });
}

export function useCampaignDailyMetrics(campaignId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['campaign-daily', campaignId, from, to],
    queryFn: () =>
      getCampaignDailyMetrics(campaignId, from, to).then((res) => {
        if (res.error) throw new Error(res.error);
        return res.data;
      }),
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
    enabled: !!campaignId,
  });
}

export function useCampaignHourlyMetrics(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-hourly', campaignId],
    queryFn: () =>
      getCampaignHourlyMetrics(campaignId).then((res) => {
        if (res.error) throw new Error(res.error);
        return res.data;
      }),
    staleTime: STALE_TIME,
    enabled: !!campaignId,
  });
}
