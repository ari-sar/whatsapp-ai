type AnyUser = {
  id: string;
  phone: string;
  name: string | null;
  business_name: string | null;
  business_type_id: string | null;
  plan_id: string | null;
  is_onboarded: boolean;
  client_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export const serializeUser = (u: AnyUser) => ({
  id: u.id,
  phone: u.phone,
  name: u.name,
  businessName: u.business_name,
  businessTypeId: u.business_type_id,
  planId: u.plan_id,
  isOnboarded: u.is_onboarded,
  clientId: u.client_id,
  createdAt: u.created_at.toISOString(),
  updatedAt: u.updated_at.toISOString(),
});

type AnyPlan = {
  id: string;
  name: string;
  price_in_paise: number;
  currency: string;
  billing_cycle: string;
  features: string[];
  is_active: boolean;
};

export const serializePlan = (p: AnyPlan) => ({
  id: p.id,
  name: p.name,
  priceInPaise: p.price_in_paise,
  currency: p.currency,
  billingCycle: p.billing_cycle,
  features: p.features,
  isActive: p.is_active,
});

type AnyBusinessFlow = {
  id: string;
  business_type: string;
  name: string;
  description: string;
  step_count: number;
  is_active: boolean;
};

export const serializeBusinessFlow = (f: AnyBusinessFlow) => ({
  id: f.id,
  businessType: f.business_type,
  name: f.name,
  description: f.description,
  stepCount: f.step_count,
});

type AnyUserKeyword = {
  id: string;
  trigger: string;
  response_message: string;
  created_at: Date;
  updated_at: Date;
};

export const serializeUserKeyword = (k: AnyUserKeyword) => ({
  id: k.id,
  trigger: k.trigger,
  responseMessage: k.response_message,
  createdAt: k.created_at.toISOString(),
  updatedAt: k.updated_at.toISOString(),
});
