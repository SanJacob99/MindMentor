import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useUser } from './useUser';

export const useRecommendations = () => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async () => {
      const data = await api.get('/recommendations/today');
      return data.recommendations;
    },
    enabled: !!user?.id,
  });
};
