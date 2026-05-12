import api from './axiosInstance';
import { AdminInfo } from '../store/useAdminAuthStore';

export interface SendOtpResponse {
  requestId: string;
  expiresInSeconds: number;
}

export interface VerifyOtpResponse {
  token: string;
  expiresAt: number;
  admin: AdminInfo;
}

export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  const { data } = await api.post<SendOtpResponse>('/api/admin/auth/otp/send', { phone });
  return data;
};

export const verifyOtp = async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
  const { data } = await api.post<VerifyOtpResponse>('/api/admin/auth/otp/verify', { phone, otp });
  return data;
};

export const logout = async (): Promise<void> => {
  await api.post('/api/admin/auth/logout').catch(() => undefined);
};

export const getMe = async (): Promise<AdminInfo> => {
  const { data } = await api.get<AdminInfo>('/api/admin/auth/me');
  return data;
};
