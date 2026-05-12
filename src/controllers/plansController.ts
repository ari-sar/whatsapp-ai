import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { serializePlan } from '../utils/serializers';

export const listPlans = async (_req: Request, res: Response) => {
  const plans = await prisma.plan.findMany({
    where: { is_active: true },
    orderBy: { price_in_paise: 'asc' },
  });
  return res.json(plans.map(serializePlan));
};
