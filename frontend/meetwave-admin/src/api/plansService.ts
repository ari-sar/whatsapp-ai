import api from './axiosInstance';

export interface Plan {
  id: string;
  name: string;
  priceInPaise: number;
  currency: string;
  billingCycle: string;
  durationDays: number | null;
  description: string | null;
  discountAmount: number | null;
  discountDays: number | null;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanInput {
  name: string;
  priceInPaise: number;
  currency?: string;
  billingCycle?: string;
  durationDays?: number | null;
  description?: string | null;
  discountAmount?: number | null;
  discountDays?: number | null;
  features?: string[];
  isActive?: boolean;
}

export const listPlans = async (): Promise<Plan[]> => {
  const { data } = await api.get<Plan[]>('/api/admin/panel/plans');
  return data;
};

export const createPlan = async (input: PlanInput): Promise<Plan> => {
  const { data } = await api.post<Plan>('/api/admin/panel/plans', input);
  return data;
};

export const updatePlan = async (id: string, input: Partial<PlanInput>): Promise<Plan> => {
  const { data } = await api.put<Plan>(`/api/admin/panel/plans/${id}`, input);
  return data;
};

export const deletePlan = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/panel/plans/${id}`);
};
