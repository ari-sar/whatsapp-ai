import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { serializeBusinessFlow } from '../utils/serializers';

const TAG = '[flowsController]';

export const listBusinessFlows = async (_req: Request, res: Response) => {
  console.log(`${TAG}.listBusinessFlows entry`);
  const flows = await prisma.businessFlow.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
  });
  console.log(`${TAG}.listBusinessFlows result`, { count: flows.length, ids: flows.map((f) => f.id) });
  return res.json(flows.map(serializeBusinessFlow));
};
