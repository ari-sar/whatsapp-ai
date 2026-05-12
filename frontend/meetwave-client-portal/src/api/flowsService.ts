import api from './axiosInstance';
import { mockFlows, USE_MOCKS } from '../mocks/handlers';
import { BusinessFlow } from '../types/flow';
import { useAuthStore } from '../store/useAuthStore';

const TAG = '[flowsService]';

export const listFlows = async (): Promise<BusinessFlow[]> => {
  console.log(`${TAG}.listFlows entry`, { useMocks: USE_MOCKS });
  if (USE_MOCKS) return mockFlows.list();
  const { data } = await api.get<BusinessFlow[]>('/api/flows');
  return data;
};

export const getMyFlow = async (): Promise<string | null> => {
  console.log(`${TAG}.getMyFlow entry`, { useMocks: USE_MOCKS });
  if (USE_MOCKS) {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;
    return mockFlows.getMine(userId);
  }
  const { data } = await api.get<{ flowId: string | null }>('/api/me/flow');
  return data.flowId;
};

export const setMyFlow = async (flowId: string): Promise<{ flowId: string }> => {
  console.log(`${TAG}.setMyFlow entry`, { flowId, useMocks: USE_MOCKS });
  if (USE_MOCKS) {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('No authenticated user');
    return mockFlows.setMine(userId, flowId);
  }
  const { data } = await api.put<{ flowId: string }>('/api/me/flow', { flowId });
  return data;
};
