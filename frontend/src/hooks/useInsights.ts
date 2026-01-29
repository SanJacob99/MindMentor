import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useUser } from './useUser';

export const useInsightsSummary = (range: string = '7d') => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['insights', range, user?.id],
    queryFn: async () => {
      const data = await api.get(`/insights/summary?range=${range}`);
      return data;
    },
    enabled: !!user?.id,
  });
};
