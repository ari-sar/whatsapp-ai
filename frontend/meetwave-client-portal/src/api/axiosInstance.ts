import axios from 'axios';
import { useSettingsStore } from '../store/useSettingsStore';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamically set baseURL from settings or env
api.interceptors.request.use((config) => {
  const { backendUrl, apiKey } = useSettingsStore.getState();
  const baseUrl = backendUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  config.baseURL = baseUrl;

  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }

  return config;
});

export default api;
