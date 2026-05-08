import api from '@/lib/axios';

export interface Client {
  id: string;
  name: string;
  phone_number_id: string;
  access_token: string;
  created_at: string;
}

export const getClients = async (): Promise<Client[]> => {
  const { data } = await api.get<Client[]>('/api/admin/clients');
  return data;
};

export const getClient = async (id: string): Promise<Client> => {
  const { data } = await api.get<Client>(`/api/admin/clients/${id}`);
  return data;
};

export const createClient = async (payload: Omit<Client, 'id' | 'created_at'>): Promise<Client> => {
  const { data } = await api.post<Client>('/api/admin/clients', payload);
  return data;
};

export const updateClient = async (id: string, payload: Partial<Client>): Promise<Client> => {
  const { data } = await api.put<Client>(`/api/admin/clients/${id}`, payload);
  return data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/clients/${id}`);
};
