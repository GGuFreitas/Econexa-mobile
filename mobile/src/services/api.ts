import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { store } from '@store/store';
import type { RootState } from '@store/store';

const baseURL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? 'http://localhost:5000/api';

export const api: AxiosInstance = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = (store.getState() as RootState).auth.token;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ notification?: { msg?: string } }>) => {
    const msg =
      error.response?.data?.notification?.msg ?? error.message ?? 'Erro de conexão.';
    return Promise.reject(new Error(msg));
  },
);
