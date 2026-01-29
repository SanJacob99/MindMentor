import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const useInsightsSummary = (range: string = '7d') => {
  return useQuery({
    queryKey: ['insights', range],
    queryFn: async () => {
      const data = await api.get(`/insights/summary?range=${range}`);
      return data;
    },
  });
};
