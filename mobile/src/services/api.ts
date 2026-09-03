/* global FormData */
import axios, { type AxiosError, type AxiosInstance, type AxiosProgressEvent } from 'axios';
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

export interface UploadFileInput {
  uri: string;
  name: string;
  type: string;
}

export async function uploadFile<T>(
  url: string,
  file: UploadFileInput,
  onProgress?: (progress: number) => void,
): Promise<T> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  const response = await api.post<T>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  return response.data;
}
