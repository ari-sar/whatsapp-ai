import api from './axiosInstance';
import { mockKeywords, USE_MOCKS } from '../mocks/handlers';
import { Keyword, KeywordInput } from '../types/keyword';
import { useAuthStore } from '../store/useAuthStore';

const TAG = '[keywordsService]';

const requireUserId = (): string => {
  const id = useAuthStore.getState().user?.id;
  if (!id) throw new Error('No authenticated user');
  return id;
};

export const listKeywords = async (): Promise<Keyword[]> => {
  console.log(`${TAG}.listKeywords entry`, { useMocks: USE_MOCKS });
  if (USE_MOCKS) return mockKeywords.list(requireUserId());
  const { data } = await api.get<Keyword[]>('/api/me/keywords');
  return data;
};

export const createKeyword = async (input: KeywordInput): Promise<Keyword> => {
  console.log(`${TAG}.createKeyword entry`, { trigger: input.trigger, useMocks: USE_MOCKS });
  if (USE_MOCKS) return mockKeywords.create(requireUserId(), input);
  const { data } = await api.post<Keyword>('/api/me/keywords', input);
  return data;
};

export const updateKeyword = async (id: string, input: KeywordInput): Promise<Keyword> => {
  console.log(`${TAG}.updateKeyword entry`, { id, trigger: input.trigger, useMocks: USE_MOCKS });
  if (USE_MOCKS) return mockKeywords.update(requireUserId(), id, input);
  const { data } = await api.put<Keyword>(`/api/me/keywords/${id}`, input);
  return data;
};

export const deleteKeyword = async (id: string): Promise<void> => {
  console.log(`${TAG}.deleteKeyword entry`, { id, useMocks: USE_MOCKS });
  if (USE_MOCKS) return mockKeywords.remove(requireUserId(), id);
  await api.delete(`/api/me/keywords/${id}`);
};
