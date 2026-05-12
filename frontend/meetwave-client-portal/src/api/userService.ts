import api from './axiosInstance';
import { mockUser, USE_MOCKS } from '../mocks/handlers';
import { AuthUser } from '../types/auth';
import { CompleteOnboardingPayload } from '../types/user';
import { useAuthStore } from '../store/useAuthStore';

export const getMe = async (): Promise<AuthUser> => {
  if (USE_MOCKS) {
    const phone = useAuthStore.getState().user?.phone;
    if (!phone) throw new Error('No authenticated user');
    return mockUser.getMe(phone);
  }
  const { data } = await api.get<AuthUser>('/api/me');
  return data;
};

export const completeOnboarding = async (payload: CompleteOnboardingPayload): Promise<AuthUser> => {
  if (USE_MOCKS) {
    const phone = useAuthStore.getState().user?.phone;
    if (!phone) throw new Error('No authenticated user');
    return mockUser.completeOnboarding(phone, payload);
  }
  const { data } = await api.post<AuthUser>('/api/me/onboarding', payload);
  return data;
};
