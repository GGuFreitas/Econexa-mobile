import axios, { type AxiosInstance } from 'axios';

export const baseURL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? 'http://localhost:5000/api';

export const apiSemInterceptores: AxiosInstance = axios.create({ baseURL });
