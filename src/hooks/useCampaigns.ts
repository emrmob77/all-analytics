'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCampaigns,
  bulkUpdateCampaignStatus,
  updateCampaignStatus,
  updateCampaignBudget,
} from '@/lib/actions/campaigns';
import type { GetCampaignsParams, SortableCampaignColumn } from '@/lib/actions/campaigns';
import type { CampaignStatus } from '@/types';

const STALE_TIME = 60_000;

export function useCampaigns(params: GetCampaignsParams) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () =>
      getCampaigns(params).then((res) => {
        if (res.error) throw new Error(res.error);
        return res;
      }),
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      updateCampaignStatus(id, status).then((res) => {
        if (res.error) throw new Error(res.error);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaignBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, budget }: { id: string; budget: number }) =>
      updateCampaignBudget(id, budget).then((res) => {
        if (res.error) throw new Error(res.error);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: CampaignStatus }) =>
      bulkUpdateCampaignStatus(ids, status).then((res) => {
        if (res.error) throw new Error(res.error);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
