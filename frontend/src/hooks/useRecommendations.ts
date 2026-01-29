import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const useRecommendations = () => {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const data = await api.get('/recommendations/today');
      return data.recommendations;
    },
  });
};
