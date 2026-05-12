import axios from 'axios';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

const TAG = '[admin-axios]';

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const token = useAdminAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`${TAG} →`, config.method?.toUpperCase(), `${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`${TAG} ←`, response.status, response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    console.error(`${TAG} ✗`, status, method, url, error.response?.data);
    if (status === 401) {
      console.warn(`${TAG} 401 — clearing session`);
      useAdminAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
