import api from '@/lib/axios';

export interface ResponseRecord {
  id: string;
  message: string;
  media_url?: string;
}

export const getResponses = async (): Promise<ResponseRecord[]> => {
  const { data } = await api.get<ResponseRecord[]>('/api/admin/responses');
  return data;
};

export const createResponse = async (payload: { message: string; media_url?: string }): Promise<ResponseRecord> => {
  const { data } = await api.post<ResponseRecord>('/api/admin/responses', payload);
  return data;
};

export const updateResponse = async (id: string, payload: Partial<ResponseRecord>): Promise<ResponseRecord> => {
  const { data } = await api.put<ResponseRecord>(`/api/admin/responses/${id}`, payload);
  return data;
};

export const deleteResponse = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/responses/${id}`);
};
