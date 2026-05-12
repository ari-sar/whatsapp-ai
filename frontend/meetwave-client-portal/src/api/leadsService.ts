import api from './axiosInstance';
import { mockLeads, USE_MOCKS } from '../mocks/handlers';
import { LeadStats } from '../types/lead';
import { useAuthStore } from '../store/useAuthStore';

export const getLeadStats = async (): Promise<LeadStats> => {
  if (USE_MOCKS) {
    const id = useAuthStore.getState().user?.id;
    if (!id) throw new Error('No authenticated user');
    return mockLeads.getStats(id);
  }
  const { data } = await api.get<LeadStats>('/api/me/leads/stats');
  return data;
};
