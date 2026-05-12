import api from './axiosInstance';
import { mockFlows, USE_MOCKS } from '../mocks/handlers';
import { BusinessFlow } from '../types/flow';
import { useAuthStore } from '../store/useAuthStore';

export const listFlows = async (): Promise<BusinessFlow[]> => {
  if (USE_MOCKS) return mockFlows.list();
  const { data } = await api.get<BusinessFlow[]>('/api/flows');
  return data;
};

export const getMyFlow = async (): Promise<string | null> => {
  if (USE_MOCKS) {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;
    return mockFlows.getMine(userId);
  }
  const { data } = await api.get<{ flowId: string | null }>('/api/me/flow');
  return data.flowId;
};

export const setMyFlow = async (flowId: string): Promise<{ flowId: string }> => {
  if (USE_MOCKS) {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('No authenticated user');
    return mockFlows.setMine(userId, flowId);
  }
  const { data } = await api.put<{ flowId: string }>('/api/me/flow', { flowId });
  return data;
};
