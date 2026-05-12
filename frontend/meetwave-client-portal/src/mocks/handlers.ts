import { AuthUser, SendOtpResponse, VerifyOtpResponse } from '../types/auth';
import { Plan } from '../types/plan';
import { BusinessFlow } from '../types/flow';
import { Keyword, KeywordInput } from '../types/keyword';
import { LeadStats } from '../types/lead';
import { PaymentSuccess, RazorpayOrder, VerifyPaymentResponse } from '../types/payment';
import { CompleteOnboardingPayload } from '../types/user';

export const USE_MOCKS = false;
export const USE_MOCK_PAYMENT = true;
const ACCEPTED_OTP = '123456';
const DELAY_MS = 400;

const delay = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));

const fakeJwt = (sub: string, phone: string): { token: string; exp: number } => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 30;
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub, phone, iat, exp }));
  return { token: `${header}.${payload}.mock`, exp };
};

const db = {
  users: new Map<string, AuthUser>(),
  plans: [
    {
      id: 'plan_starter',
      name: 'Starter',
      priceInPaise: 49900,
      currency: 'INR' as const,
      billingCycle: 'monthly' as const,
      features: ['1 active flow', '50 keywords', 'Up to 200 leads/month'],
      isActive: true,
    },
    {
      id: 'plan_growth',
      name: 'Growth',
      priceInPaise: 149900,
      currency: 'INR' as const,
      billingCycle: 'monthly' as const,
      features: ['3 active flows', 'Unlimited keywords', 'Up to 2,000 leads/month', 'Priority support'],
      isActive: true,
    },
    {
      id: 'plan_business',
      name: 'Business',
      priceInPaise: 399900,
      currency: 'INR' as const,
      billingCycle: 'monthly' as const,
      features: ['Unlimited flows', 'Unlimited keywords', 'Unlimited leads', 'Dedicated support'],
      isActive: true,
    },
  ] as Plan[],
  flows: [
    { id: 'rental_booking', businessType: 'Appliance Rental', name: 'Rental Booking', description: 'Pincode → service selection → confirm booking.', stepCount: 3 },
    { id: 'restaurant_order', businessType: 'Restaurant', name: 'Restaurant Ordering', description: 'Menu browse → cart → order placement.', stepCount: 4 },
    { id: 'salon_booking', businessType: 'Salon & Spa', name: 'Salon Booking', description: 'Service → stylist → time slot.', stepCount: 4 },
    { id: 'real_estate_inquiry', businessType: 'Real Estate', name: 'Property Inquiry', description: 'Location → budget → property type → callback.', stepCount: 5 },
  ] as BusinessFlow[],
  keywordsByUser: new Map<string, Keyword[]>(),
  myFlowByUser: new Map<string, string>(),
};

export const mockAuth = {
  sendOtp: async (_phone: string): Promise<SendOtpResponse> => {
    return delay({ requestId: `req_${Date.now()}`, expiresInSeconds: 300 });
  },

  verifyOtp: async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
    if (otp !== ACCEPTED_OTP) throw new Error('Invalid OTP');
    let user = db.users.get(phone);
    const isNew = !user;
    if (!user) {
      user = {
        id: `user_${Date.now()}`,
        phone,
        isOnboarded: false,
        createdAt: new Date().toISOString(),
      };
      db.users.set(phone, user);
    }
    const { token, exp } = fakeJwt(user.id, phone);
    return delay({ token, expiresAt: exp * 1000, isNew, user });
  },
};

export const mockUser = {
  getMe: async (phone: string): Promise<AuthUser> => {
    const user = db.users.get(phone);
    if (!user) throw new Error('User not found');
    return delay(user);
  },
  completeOnboarding: async (phone: string, payload: CompleteOnboardingPayload): Promise<AuthUser> => {
    const user = db.users.get(phone);
    if (!user) throw new Error('User not found');
    const updated: AuthUser = {
      ...user,
      name: payload.name,
      businessName: payload.businessName,
      businessTypeId: payload.businessTypeId,
      planId: payload.planId,
      isOnboarded: true,
    };
    db.users.set(phone, updated);
    db.myFlowByUser.set(updated.id, payload.businessTypeId);
    return delay(updated);
  },
};

export const mockPlans = {
  list: async (): Promise<Plan[]> => delay(db.plans.filter((p) => p.isActive)),
};

export const mockFlows = {
  list: async (): Promise<BusinessFlow[]> => delay(db.flows),
  getMine: async (userId: string): Promise<string | null> => delay(db.myFlowByUser.get(userId) ?? null),
  setMine: async (userId: string, flowId: string): Promise<{ flowId: string }> => {
    db.myFlowByUser.set(userId, flowId);
    return delay({ flowId });
  },
};

export const mockKeywords = {
  list: async (userId: string): Promise<Keyword[]> => delay(db.keywordsByUser.get(userId) ?? []),
  create: async (userId: string, input: KeywordInput): Promise<Keyword> => {
    const now = new Date().toISOString();
    const kw: Keyword = { id: `kw_${Date.now()}`, ...input, createdAt: now, updatedAt: now };
    const list = db.keywordsByUser.get(userId) ?? [];
    db.keywordsByUser.set(userId, [...list, kw]);
    return delay(kw);
  },
  update: async (userId: string, id: string, input: KeywordInput): Promise<Keyword> => {
    const list = db.keywordsByUser.get(userId) ?? [];
    const idx = list.findIndex((k) => k.id === id);
    if (idx === -1) throw new Error('Keyword not found');
    const updated: Keyword = { ...list[idx], ...input, updatedAt: new Date().toISOString() };
    const next = [...list];
    next[idx] = updated;
    db.keywordsByUser.set(userId, next);
    return delay(updated);
  },
  remove: async (userId: string, id: string): Promise<void> => {
    const list = db.keywordsByUser.get(userId) ?? [];
    db.keywordsByUser.set(userId, list.filter((k) => k.id !== id));
    return delay(undefined);
  },
};

export const mockLeads = {
  getStats: async (_userId: string): Promise<LeadStats> => {
    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        count: Math.floor(Math.random() * 40) + 5,
      };
    });
    const total = monthly.reduce((acc, m) => acc + m.count, 0);
    return delay({ total, monthly });
  },
};

export const mockPayments = {
  createOrder: async (_planId: string): Promise<RazorpayOrder> => {
    return delay({
      orderId: `mock_order_${Date.now()}`,
      amount: 0,
      currency: 'INR',
      keyId: 'rzp_test_mock_key',
    });
  },
  verify: async (_payload: PaymentSuccess): Promise<VerifyPaymentResponse> => delay({ verified: true }),
};
