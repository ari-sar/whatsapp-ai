export interface Plan {
  id: string;
  name: string;
  priceInPaise: number;
  currency: 'INR';
  billingCycle: 'monthly' | 'yearly' | 'one-time';
  features: string[];
  isActive: boolean;
}
