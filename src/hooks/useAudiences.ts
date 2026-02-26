import { useQuery } from '@tanstack/react-query';
import { getAudiences, type GetAudiencesParams } from '@/lib/actions/audiences';

export function useAudiences(params: GetAudiencesParams) {
    return useQuery({
        queryKey: ['audiences', params],
        queryFn: async () => {
            const response = await getAudiences(params);
            if (response.error) {
                throw new Error(response.error);
            }
            return response;
        },
    });
}
