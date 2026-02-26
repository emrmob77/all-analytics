import { useQuery } from '@tanstack/react-query';
import { getAdGroups, type GetAdGroupsParams } from '@/lib/actions/adgroups';

export function useAdGroups(params: GetAdGroupsParams) {
    return useQuery({
        queryKey: ['adgroups', params],
        queryFn: async () => {
            const response = await getAdGroups(params);
            if (response.error) {
                throw new Error(response.error);
            }
            return response;
        },
    });
}
