import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useAuthStore } from '../store/authStore';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000'; // Fallback for local dev

export const api = {
  async request(method: string, endpoint: string, body?: unknown) {
    // If we are mostly testing UI, we might accept missing API_URL, but let's try to keep it.
    if (!API_URL) {
       console.warn('API_URL is not configured');
    }
   
    let token = null;
    if (Platform.OS === 'web') {
        token = localStorage.getItem('accessToken');
    } else {
        token = await SecureStore.getItemAsync('accessToken');
    }

    const headers: HeadersInit & Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 401) {
            useAuthStore.getState().logout();
        }

        const data = await response.json();
        if (!response.ok) {
            // For UI verification purposes, if backend is down, we might want to suppress errors or return mock data?
            // But let's throw for now.
             const error = new Error(data.error || JSON.stringify(data) || 'API Request Failed');
             //any is used to access the status property of the error object
             (error as any).status = response.status;
             throw error;
        }
        return data;
    } catch (e) {
        console.error('API Request Error:', e);
        // If we are just testing UI and backend is not reachable, maybe we can mock?
        // For now let's just rethrow or return empty object if we want to survive.
        throw e;
    }
  },

  get: (endpoint: string) => api.request('GET', endpoint),
  post: (endpoint: string, body: unknown) => api.request('POST', endpoint, body),
};
