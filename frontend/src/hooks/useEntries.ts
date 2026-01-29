import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Entry } from '../types/entry';
import { useUser } from './useUser';

export interface NewEntry {
  mood: number;
  stress: number;
  energy: number;
  text?: string;
  tags?: string[];
}

export const useEntries = () => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['entries', user?.id],
    queryFn: async () => {
      const data = await api.get('/entries');
      return data as Entry[];
    },
    enabled: !!user?.id,
  });
};

export const useAddEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newEntry: NewEntry) => {
      return api.post('/entries', newEntry);
    },
    onSuccess: () => {
      // Invalidate queries starting with these keys
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};
