import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  backendUrl: string;
  apiKey: string;
  setBackendUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  clearCredentials: () => void;
  isConfigured: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      backendUrl: '',
      apiKey: '',
      setBackendUrl: (url) => set({ backendUrl: url }),
      setApiKey: (key) => set({ apiKey: key }),
      clearCredentials: () => set({ backendUrl: '', apiKey: '' }),
      isConfigured: () => !!get().apiKey && !!get().backendUrl,
    }),
    { name: 'meetwave-settings' }
  )
);
