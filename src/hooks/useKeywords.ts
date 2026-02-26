import { useQuery } from '@tanstack/react-query';
import { getKeywords, type GetKeywordsParams } from '@/lib/actions/keywords';

export function useKeywords(params: GetKeywordsParams) {
  return useQuery({
    queryKey: ['keywords', params],
    queryFn: () => getKeywords(params),
    staleTime: 60 * 1000,
  });
}
