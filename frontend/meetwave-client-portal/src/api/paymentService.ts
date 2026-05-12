import api from './axiosInstance';
import { mockPayments, USE_MOCKS, USE_MOCK_PAYMENT } from '../mocks/handlers';
import { PaymentSuccess, RazorpayOrder, VerifyPaymentResponse } from '../types/payment';

const TAG = '[paymentService]';

export const createOrder = async (planId: string): Promise<RazorpayOrder> => {
  console.log(`${TAG}.createOrder entry`, { planId, useMocks: USE_MOCKS, useMockPayment: USE_MOCK_PAYMENT });
  if (USE_MOCKS || USE_MOCK_PAYMENT) return mockPayments.createOrder(planId);
  const { data } = await api.post<RazorpayOrder>('/api/payments/orders', { planId });
  return data;
};

export const verifyPayment = async (payload: PaymentSuccess): Promise<VerifyPaymentResponse> => {
  console.log(`${TAG}.verifyPayment entry`, {
    razorpayOrderId: payload.razorpayOrderId,
    razorpayPaymentId: payload.razorpayPaymentId,
    useMocks: USE_MOCKS,
    useMockPayment: USE_MOCK_PAYMENT,
  });
  if (USE_MOCKS || USE_MOCK_PAYMENT) return mockPayments.verify(payload);
  const { data } = await api.post<VerifyPaymentResponse>('/api/payments/verify', payload);
  return data;
};
