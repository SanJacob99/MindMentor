import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export const api = {
  async request(method: string, endpoint: string, body?: any) {
    if (!API_URL) {
      throw new Error('API_URL is not configured');
    }
   
    const token = await SecureStore.getItemAsync('accessToken');
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status === 401) {
      // Handle logout or throw
      await SecureStore.deleteItemAsync('accessToken');
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || JSON.stringify(data) || 'API Request Failed');
    }
    return data;
  },

  get: (endpoint: string) => api.request('GET', endpoint),
  post: (endpoint: string, body: any) => api.request('POST', endpoint, body),
};
