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

export const usePatterns = (range: '30d' | '90d' = '30d') => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['patterns', range, user?.id],
    queryFn: () => api.get(`/insights/patterns?range=${range}`),
    enabled: !!user?.id,
  });
};

export const useTagAnalysis = (range: '30d' | '90d' = '30d') => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['tagAnalysis', range, user?.id],
    queryFn: () => api.get(`/insights/tags?range=${range}`),
    enabled: !!user?.id,
  });
};

export const useTextAnalysis = (range: '30d' | '90d' = '30d') => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['textAnalysis', range, user?.id],
    queryFn: () => api.get(`/insights/text-analysis?range=${range}`),
    enabled: !!user?.id,
  });
};
