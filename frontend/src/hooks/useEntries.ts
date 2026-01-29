import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Entry } from '../types/entry';

export interface NewEntry {
  mood: number;
  stress: number;
  energy: number;
  text?: string;
  tags?: string[];
}

export const useEntries = () => {
  return useQuery({
    queryKey: ['entries'],
    queryFn: async () => {
      const data = await api.get('/entries');
      // The API might return { entries: [...] } or just [...]
      // Looking at HistoryScreen.tsx: "data = await api.get('/entries'); ... data || []"
      // It seems it expects an array directly.
      // But let's check HistoryScreen.tsx again.
      return data as Entry[];
    },
  });
};

export const useAddEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newEntry: NewEntry) => {
      return api.post('/entries', newEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};
