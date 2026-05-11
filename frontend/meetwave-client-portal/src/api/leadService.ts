import api from './axiosInstance';

export interface Lead {
  id: string;
  client_id: string;
  user_phone: string;
  last_message: string;
  current_flow_id?: string;
  current_step?: string;
  collected_data?: Record<string, any>;
  timestamp: string;
}

export interface Keyword {
  id: string;
  client_id: string;
  trigger: string;
  response_id?: string;
  flow_id?: string;
}

export const getLeads = async (clientId?: string): Promise<Lead[]> => {
  const params = clientId ? { client_id: clientId } : {};
  const { data } = await api.get<Lead[]>('/api/admin/leads', { params });
  return data;
};

export const getLead = async (leadId: string): Promise<Lead> => {
  const { data } = await api.get<Lead>(`/api/admin/leads/${leadId}`);
  return data;
};

export const getKeywords = async (clientId?: string): Promise<Keyword[]> => {
  const params = clientId ? { client_id: clientId } : {};
  const { data } = await api.get<Keyword[]>('/api/admin/keywords', { params });
  return data;
};

export const createKeyword = async (payload: Omit<Keyword, 'id'>): Promise<Keyword> => {
  const { data } = await api.post<Keyword>('/api/admin/keywords', payload);
  return data;
};

export const deleteKeyword = async (keywordId: string): Promise<void> => {
  await api.delete(`/api/admin/keywords/${keywordId}`);
};
