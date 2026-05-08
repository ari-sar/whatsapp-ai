import api from '@/lib/axios';
import type { ResponseRecord } from './responseService';

export interface Keyword {
  id: string;
  client_id: string;
  trigger: string;
  response_id: string;
  response?: ResponseRecord;
}

export const getKeywords = async (clientId?: string): Promise<Keyword[]> => {
  const params = clientId ? { client_id: clientId } : {};
  const { data } = await api.get<Keyword[]>('/api/admin/keywords', { params });
  return data;
};

export const createKeyword = async (payload: {
  client_id: string;
  trigger: string;
  response_id: string;
}): Promise<Keyword> => {
  const { data } = await api.post<Keyword>('/api/admin/keywords', payload);
  return data;
};

export const deleteKeyword = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/keywords/${id}`);
};
