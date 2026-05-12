import api from './axiosInstance';

export interface FlowSummary {
  id: string;
  businessType: string;
  name: string;
  description: string;
  stepCount: number;
  initialStepId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlowStepDto {
  stepId: string;
  type: string;
  config: Record<string, any>;
  transitions: Array<{ to: string; condition?: any }>;
  positionX: number;
  positionY: number;
}

export interface FlowDetail extends FlowSummary {
  steps: FlowStepDto[];
}

export interface FlowStepInput {
  step_id: string;
  type: string;
  config?: Record<string, any>;
  transitions?: Array<{ to: string; condition?: any }>;
  position_x?: number;
  position_y?: number;
}

export interface FlowUpsertInput {
  id?: string;
  businessType: string;
  name: string;
  description?: string;
  initialStepId?: string | null;
  isActive?: boolean;
  steps?: FlowStepInput[];
}

export const listFlows = async (): Promise<FlowSummary[]> => {
  const { data } = await api.get<FlowSummary[]>('/api/admin/panel/flows');
  return data;
};

export const getFlow = async (id: string): Promise<FlowDetail> => {
  const { data } = await api.get<FlowDetail>(`/api/admin/panel/flows/${id}`);
  return data;
};

export const createFlow = async (input: FlowUpsertInput): Promise<{ id: string }> => {
  const { data } = await api.post<{ id: string }>('/api/admin/panel/flows', input);
  return data;
};

export const updateFlow = async (id: string, input: Partial<FlowUpsertInput>): Promise<{ id: string }> => {
  const { data } = await api.put<{ id: string }>(`/api/admin/panel/flows/${id}`, input);
  return data;
};

export const deleteFlow = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/panel/flows/${id}`);
};
