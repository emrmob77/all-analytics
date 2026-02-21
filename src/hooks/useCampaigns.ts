'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCampaigns,
  bulkUpdateCampaignStatus,
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

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      status,
    }: {
      ids: string[];
      status: CampaignStatus;
    }) =>
      bulkUpdateCampaignStatus(ids, status).then((res) => {
        if (res.error) throw new Error(res.error);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
