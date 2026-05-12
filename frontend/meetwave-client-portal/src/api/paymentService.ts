import api from './axiosInstance';
import { mockPayments, USE_MOCKS } from '../mocks/handlers';
import { PaymentSuccess, RazorpayOrder, VerifyPaymentResponse } from '../types/payment';

export const createOrder = async (planId: string): Promise<RazorpayOrder> => {
  if (USE_MOCKS) return mockPayments.createOrder(planId);
  const { data } = await api.post<RazorpayOrder>('/api/payments/orders', { planId });
  return data;
};

export const verifyPayment = async (payload: PaymentSuccess): Promise<VerifyPaymentResponse> => {
  if (USE_MOCKS) return mockPayments.verify(payload);
  const { data } = await api.post<VerifyPaymentResponse>('/api/payments/verify', payload);
  return data;
};
