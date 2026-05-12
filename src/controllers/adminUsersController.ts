import { Request, Response } from 'express';
import prisma from '../config/prisma';

const TAG = '[adminUsersController]';

type Filter = 'all' | 'no_plan' | 'expired' | 'inactive';

const isExpired = (u: { plan_id: string | null; plan_expires_at: Date | null }, now: Date): boolean => {
  if (!u.plan_id) return false;
  if (!u.plan_expires_at) return false;
  return u.plan_expires_at.getTime() < now.getTime();
};

export const listAdminUsers = async (req: Request, res: Response) => {
  const filter = ((req.query.filter as string) ?? 'all') as Filter;
  console.log(`${TAG}.listAdminUsers entry`, { filter });

  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
  });

  const planIds = Array.from(
    new Set(users.map((u) => u.plan_id).filter((p): p is string => typeof p === 'string'))
  );
  const plans = planIds.length
    ? await prisma.plan.findMany({ where: { id: { in: planIds } } })
    : [];
  const planById = new Map(plans.map((p) => [p.id, p]));

  const now = new Date();
  let filtered = users;
  if (filter === 'no_plan') {
    filtered = users.filter((u) => !u.plan_id);
  } else if (filter === 'expired') {
    filtered = users.filter((u) => isExpired(u, now));
  } else if (filter === 'inactive') {
    filtered = users.filter((u) => !u.plan_id || isExpired(u, now));
  }

  return res.json(
    filtered.map((u) => {
      const plan = u.plan_id ? planById.get(u.plan_id) : null;
      return {
        id: u.id,
        phone: u.phone,
        name: u.name,
        businessName: u.business_name,
        businessTypeId: u.business_type_id,
        isOnboarded: u.is_onboarded,
        clientId: u.client_id,
        planId: u.plan_id,
        planName: plan?.name ?? null,
        planStartedAt: u.plan_started_at ? u.plan_started_at.toISOString() : null,
        planExpiresAt: u.plan_expires_at ? u.plan_expires_at.toISOString() : null,
        isExpired: isExpired(u, now),
        hasPlan: !!u.plan_id,
        createdAt: u.created_at.toISOString(),
        updatedAt: u.updated_at.toISOString(),
      };
    })
  );
};

export const getAdminUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`${TAG}.getAdminUser entry`, { id });
  const u = await prisma.user.findUnique({ where: { id: id as string } });
  if (!u) return res.status(404).json({ error: 'User not found' });
  const plan = u.plan_id ? await prisma.plan.findUnique({ where: { id: u.plan_id } }) : null;
  return res.json({
    id: u.id,
    phone: u.phone,
    name: u.name,
    businessName: u.business_name,
    businessTypeId: u.business_type_id,
    isOnboarded: u.is_onboarded,
    clientId: u.client_id,
    planId: u.plan_id,
    planName: plan?.name ?? null,
    planStartedAt: u.plan_started_at ? u.plan_started_at.toISOString() : null,
    planExpiresAt: u.plan_expires_at ? u.plan_expires_at.toISOString() : null,
    createdAt: u.created_at.toISOString(),
    updatedAt: u.updated_at.toISOString(),
  });
};
