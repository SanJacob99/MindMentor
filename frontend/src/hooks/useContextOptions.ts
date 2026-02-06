import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useUser } from './useUser';

const DEFAULT_OPTIONS = ['Sleep', 'Movement', 'Social', 'Workload', 'Outdoors'];

interface TagFrequencies {
  [tag: string]: number;
}

export const useContextOptions = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useUser();

  // Fetch tag frequencies
  const { data: frequencies = {} } = useQuery<TagFrequencies>({
    queryKey: ['tagFrequencies'],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      return api.request('GET', '/users/tag-frequencies');
    },
    enabled: !!token,
    retry: false,
  });

  // Get custom options from user preferences
  const customOptions: string[] = (user?.preferences as any)?.contextOptions || [];

  // Merge default + custom options, removing duplicates
  const allOptions = [...new Set([...DEFAULT_OPTIONS, ...customOptions])];

  // Sort by frequency (most used first), with unused tags at the end
  const sortedOptions = allOptions.sort((a, b) => {
    const freqA = frequencies[a] || 0;
    const freqB = frequencies[b] || 0;
    return freqB - freqA;
  });

  // Mutation to add a new context option
  const addContextOptionMutation = useMutation({
    mutationFn: async (newOption: string) => {
      // Prevent adding tags before user data is loaded to avoid overwriting server-side tags
      if (isUserLoading) throw new Error('Please wait, loading your data...');

      const trimmed = newOption.trim();
      if (!trimmed) throw new Error('Tag name cannot be empty');
      if (trimmed.length > 30) throw new Error('Tag name is too long');
      if (allOptions.includes(trimmed)) throw new Error('Tag already exists');

      const updatedOptions = [...customOptions, trimmed.charAt(0).toUpperCase() + trimmed.slice(1)];
      return api.request('POST', '/users/preferences', {
        contextOptions: updatedOptions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    options: sortedOptions,
    customOptions,
    frequencies,
    addContextOption: addContextOptionMutation.mutateAsync,
    isAddingOption: addContextOptionMutation.isPending,
    isLoading: isUserLoading,
  };
};
