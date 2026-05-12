import api from './axiosInstance';
import { mockPlans, USE_MOCKS } from '../mocks/handlers';
import { Plan } from '../types/plan';

const TAG = '[plansService]';

export const listPlans = async (): Promise<Plan[]> => {
  console.log(`${TAG}.listPlans entry`, { useMocks: USE_MOCKS });
  if (USE_MOCKS) return mockPlans.list();
  const { data } = await api.get<Plan[]>('/api/plans');
  return data;
};
