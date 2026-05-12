import api from './axiosInstance';

export interface FlowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: Record<string, any>;
  initialStep: string;
  createdAt: string;
  updatedAt: string;
}

export const getFlows = async (): Promise<FlowDefinition[]> => {
  const { data } = await api.get<FlowDefinition[]>('/api/admin/flows');
  return data;
};

export const getFlow = async (flowId: string): Promise<FlowDefinition> => {
  const { data } = await api.get<FlowDefinition>(`/api/admin/flows/${flowId}`);
  return data;
};

export const createFlow = async (payload: Omit<FlowDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<FlowDefinition> => {
  const { data } = await api.post<FlowDefinition>('/api/admin/flows', payload);
  return data;
};

export const updateFlow = async (flowId: string, payload: Partial<FlowDefinition>): Promise<FlowDefinition> => {
  const { data } = await api.put<FlowDefinition>(`/api/admin/flows/${flowId}`, payload);
  return data;
};

export const deleteFlow = async (flowId: string): Promise<void> => {
  await api.delete(`/api/admin/flows/${flowId}`);
};
