import api from './axiosInstance';

export type UserFilter = 'all' | 'no_plan' | 'expired' | 'inactive';

export interface AdminUser {
  id: string;
  phone: string;
  name: string | null;
  businessName: string | null;
  businessTypeId: string | null;
  isOnboarded: boolean;
  clientId: string | null;
  planId: string | null;
  planName: string | null;
  planStartedAt: string | null;
  planExpiresAt: string | null;
  isExpired: boolean;
  hasPlan: boolean;
  createdAt: string;
  updatedAt: string;
}

export const listUsers = async (filter: UserFilter = 'all'): Promise<AdminUser[]> => {
  const { data } = await api.get<AdminUser[]>('/api/admin/panel/users', { params: { filter } });
  return data;
};
