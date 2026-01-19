import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

export interface UserDTO {
  id: string;
  email: string;
  hasCompletedOnboarding: boolean;
  preferences?: {
    reminderTime?: string;
    timezone?: string;
    [key: string]: any;
  };
}

export const useUser = () => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['user'],
    queryFn: async (): Promise<UserDTO> => {
      if (!token) throw new Error('No token');
      return api.request('GET', '/users/me');
    },
    enabled: !!token,
    retry: false,
  });
};
