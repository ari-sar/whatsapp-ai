import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { serializeBusinessFlow } from '../utils/serializers';

export const listBusinessFlows = async (_req: Request, res: Response) => {
  const flows = await prisma.businessFlow.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
  });
  return res.json(flows.map(serializeBusinessFlow));
};
