import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const TAG = '[axios]';

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`${TAG} →`, config.method?.toUpperCase(), `${config.baseURL}${config.url}`, {
    hasToken: !!token,
    body: config.data,
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`${TAG} ←`, response.status, response.config.method?.toUpperCase(), response.config.url, {
      body: response.data,
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    console.error(`${TAG} ✗`, status, method, url, {
      body: error.response?.data,
      message: error.message,
    });
    if (status === 401) {
      console.warn(`${TAG} 401 — clearing session`);
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
