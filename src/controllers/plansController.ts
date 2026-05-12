import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { serializePlan } from '../utils/serializers';

const TAG = '[plansController]';

export const listPlans = async (_req: Request, res: Response) => {
  console.log(`${TAG}.listPlans entry`);
  const plans = await prisma.plan.findMany({
    where: { is_active: true },
    orderBy: { price_in_paise: 'asc' },
  });
  console.log(`${TAG}.listPlans result`, { count: plans.length, ids: plans.map((p) => p.id) });
  return res.json(plans.map(serializePlan));
};
