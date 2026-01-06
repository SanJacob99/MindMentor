import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isLoading: true,
  setToken: async (token) => {
    await SecureStore.setItemAsync('accessToken', token);
    set({ token });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    set({ token: null });
  },
  loadToken: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    set({ token, isLoading: false });
  },
}));
