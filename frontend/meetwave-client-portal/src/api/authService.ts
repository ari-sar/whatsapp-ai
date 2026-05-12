import api from './axiosInstance';
import { mockAuth, USE_MOCKS } from '../mocks/handlers';
import { SendOtpResponse, VerifyOtpResponse } from '../types/auth';

const TAG = '[authService]';

export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  console.log(`${TAG}.sendOtp entry`, { phone, useMocks: USE_MOCKS });
  if (USE_MOCKS) return mockAuth.sendOtp(phone);
  const { data } = await api.post<SendOtpResponse>('/api/auth/otp/send', { phone });
  return data;
};

export const verifyOtp = async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
  console.log(`${TAG}.verifyOtp entry`, { phone, otp_len: otp.length, useMocks: USE_MOCKS });
  if (USE_MOCKS) return mockAuth.verifyOtp(phone, otp);
  const { data } = await api.post<VerifyOtpResponse>('/api/auth/otp/verify', { phone, otp });
  return data;
};
