import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

//authStore should not become a second source of truth for user profile
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
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('accessToken', token);
      } catch (e) {
        console.error('Local storage not available', e);
      }
    } else {
      await SecureStore.setItemAsync('accessToken', token);
    }
    set({ token });
  },
  logout: async () => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem('accessToken');
      } catch (e) {
         console.error('Local storage not available', e);
      }
    } else {
      await SecureStore.deleteItemAsync('accessToken');
    }
    set({ token: null });
  },
  loadToken: async () => {
    let token = null;
    if (Platform.OS === 'web') {
      try {
        token = localStorage.getItem('accessToken');
      } catch (e) {
         console.error('Local storage not available', e);
      }
    } else {
      token = await SecureStore.getItemAsync('accessToken');
    }
    set({ token, isLoading: false });
  },
}));
