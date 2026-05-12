import api from './axiosInstance';

const TAG = '[serviceAreasService]';

export interface ServiceArea {
  id: string;
  pincode: string;
  createdAt: string;
}

export const listServiceAreas = async (): Promise<ServiceArea[]> => {
  console.log(`${TAG}.list entry`);
  const { data } = await api.get<ServiceArea[]>('/api/me/service-areas');
  return data;
};

export const createServiceArea = async (pincode: string): Promise<ServiceArea> => {
  console.log(`${TAG}.create entry`, { pincode });
  const { data } = await api.post<ServiceArea>('/api/me/service-areas', { pincode });
  return data;
};

export const bulkCreateServiceAreas = async (pincodes: string[]): Promise<ServiceArea[]> => {
  console.log(`${TAG}.bulkCreate entry`, { count: pincodes.length });
  const { data } = await api.post<ServiceArea[]>('/api/me/service-areas/bulk', { pincodes });
  return data;
};

export const deleteServiceArea = async (id: string): Promise<void> => {
  console.log(`${TAG}.delete entry`, { id });
  await api.delete(`/api/me/service-areas/${id}`);
};
