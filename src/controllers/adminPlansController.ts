import { Request, Response } from 'express';
import prisma from '../config/prisma';

const TAG = '[adminPlansController]';

const serialize = (p: any) => ({
  id: p.id,
  name: p.name,
  priceInPaise: p.price_in_paise,
  currency: p.currency,
  billingCycle: p.billing_cycle,
  durationDays: p.duration_days,
  description: p.description,
  discountAmount: p.discount_amount,
  discountDays: p.discount_days,
  features: p.features,
  isActive: p.is_active,
  createdAt: p.created_at.toISOString(),
  updatedAt: p.updated_at.toISOString(),
});

export const listAdminPlans = async (_req: Request, res: Response) => {
  console.log(`${TAG}.listAdminPlans entry`);
  const plans = await prisma.plan.findMany({ orderBy: { price_in_paise: 'asc' } });
  return res.json(plans.map(serialize));
};

export const createAdminPlan = async (req: Request, res: Response) => {
  const {
    name,
    priceInPaise,
    currency,
    billingCycle,
    durationDays,
    description,
    discountAmount,
    discountDays,
    features,
    isActive,
  } = req.body ?? {};
  console.log(`${TAG}.createAdminPlan entry`, { name, priceInPaise, durationDays });

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name required', code: 'INVALID_INPUT' });
  }
  if (typeof priceInPaise !== 'number' || priceInPaise < 0) {
    return res.status(400).json({ error: 'priceInPaise required (non-negative number)', code: 'INVALID_INPUT' });
  }

  const plan = await prisma.plan.create({
    data: {
      name,
      price_in_paise: priceInPaise,
      currency: typeof currency === 'string' && currency ? currency : 'INR',
      billing_cycle: typeof billingCycle === 'string' && billingCycle ? billingCycle : 'monthly',
      duration_days: typeof durationDays === 'number' ? durationDays : null,
      description: typeof description === 'string' ? description : null,
      discount_amount: typeof discountAmount === 'number' ? discountAmount : null,
      discount_days: typeof discountDays === 'number' ? discountDays : null,
      features: Array.isArray(features) ? features.filter((f) => typeof f === 'string') : [],
      is_active: isActive !== false,
    },
  });
  return res.status(201).json(serialize(plan));
};

export const updateAdminPlan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    priceInPaise,
    currency,
    billingCycle,
    durationDays,
    description,
    discountAmount,
    discountDays,
    features,
    isActive,
  } = req.body ?? {};
  console.log(`${TAG}.updateAdminPlan entry`, { id });

  const existing = await prisma.plan.findUnique({ where: { id: id as string } });
  if (!existing) return res.status(404).json({ error: 'Plan not found' });

  const updated = await prisma.plan.update({
    where: { id: existing.id },
    data: {
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof priceInPaise === 'number' ? { price_in_paise: priceInPaise } : {}),
      ...(typeof currency === 'string' ? { currency } : {}),
      ...(typeof billingCycle === 'string' ? { billing_cycle: billingCycle } : {}),
      ...(durationDays === null || typeof durationDays === 'number' ? { duration_days: durationDays } : {}),
      ...(description === null || typeof description === 'string' ? { description } : {}),
      ...(discountAmount === null || typeof discountAmount === 'number' ? { discount_amount: discountAmount } : {}),
      ...(discountDays === null || typeof discountDays === 'number' ? { discount_days: discountDays } : {}),
      ...(Array.isArray(features) ? { features: features.filter((f) => typeof f === 'string') } : {}),
      ...(typeof isActive === 'boolean' ? { is_active: isActive } : {}),
    },
  });
  return res.json(serialize(updated));
};

export const deleteAdminPlan = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`${TAG}.deleteAdminPlan entry`, { id });
  const existing = await prisma.plan.findUnique({ where: { id: id as string } });
  if (!existing) return res.status(404).json({ error: 'Plan not found' });
  await prisma.plan.delete({ where: { id: existing.id } });
  return res.status(204).send();
};
