import api from '@/lib/axios';

export interface Lead {
  id: string;
  client_id: string;
  phone_number: string;
  last_message: string;
  timestamp: string;
}

export const getLeads = async (clientId?: string): Promise<Lead[]> => {
  const params = clientId ? { client_id: clientId } : {};
  const { data } = await api.get<Lead[]>('/api/admin/leads', { params });
  return data;
};
