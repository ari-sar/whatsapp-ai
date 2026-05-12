import api from './axiosInstance';
import { mockAuth, USE_MOCKS } from '../mocks/handlers';
import { SendOtpResponse, VerifyOtpResponse } from '../types/auth';

export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  if (USE_MOCKS) return mockAuth.sendOtp(phone);
  const { data } = await api.post<SendOtpResponse>('/api/auth/otp/send', { phone });
  return data;
};

export const verifyOtp = async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
  if (USE_MOCKS) return mockAuth.verifyOtp(phone, otp);
  const { data } = await api.post<VerifyOtpResponse>('/api/auth/otp/verify', { phone, otp });
  return data;
};
