import { Request, Response } from 'express';
import prisma from '../config/prisma';

const TAG = '[meServiceAreaController]';

const PINCODE_RE = /^\d{6}$/;

const requireClientId = async (userId: string): Promise<string | null> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.client_id ?? null;
};

const serialize = (row: { id: string; pincode: string; created_at: Date }) => ({
  id: row.id,
  pincode: row.pincode,
  createdAt: row.created_at.toISOString(),
});

export const listServiceAreas = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  console.log(`${TAG}.listServiceAreas entry`, { userId });
  const clientId = await requireClientId(userId);
  if (!clientId) return res.json([]);

  const rows = await prisma.serviceablePincode.findMany({
    where: { client_id: clientId },
    orderBy: { pincode: 'asc' },
  });
  return res.json(rows.map(serialize));
};

export const createServiceArea = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { pincode } = req.body ?? {};
  console.log(`${TAG}.createServiceArea entry`, { userId, pincode });

  if (typeof pincode !== 'string' || !PINCODE_RE.test(pincode.trim())) {
    return res.status(400).json({ error: 'pincode must be 6 digits', code: 'INVALID_PINCODE' });
  }

  const clientId = await requireClientId(userId);
  if (!clientId) {
    return res.status(400).json({ error: 'Complete onboarding first', code: 'NO_CLIENT' });
  }

  try {
    const row = await prisma.serviceablePincode.create({
      data: { client_id: clientId, pincode: pincode.trim() },
    });
    return res.status(201).json(serialize(row));
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'Pincode already added', code: 'DUPLICATE_PINCODE' });
    }
    console.error(`${TAG}.createServiceArea error`, err);
    return res.status(500).json({ error: 'Failed to add pincode' });
  }
};

export const bulkCreateServiceAreas = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { pincodes } = req.body ?? {};
  console.log(`${TAG}.bulkCreateServiceAreas entry`, { userId, count: Array.isArray(pincodes) ? pincodes.length : 0 });

  if (!Array.isArray(pincodes)) {
    return res.status(400).json({ error: 'pincodes must be an array', code: 'INVALID_INPUT' });
  }

  const clientId = await requireClientId(userId);
  if (!clientId) {
    return res.status(400).json({ error: 'Complete onboarding first', code: 'NO_CLIENT' });
  }

  const cleaned = Array.from(
    new Set(
      pincodes
        .map((p: any) => (typeof p === 'string' ? p.trim() : ''))
        .filter((p) => PINCODE_RE.test(p))
    )
  );

  if (cleaned.length === 0) {
    return res.status(400).json({ error: 'No valid 6-digit pincodes provided', code: 'INVALID_INPUT' });
  }

  await prisma.serviceablePincode.createMany({
    data: cleaned.map((pincode) => ({ client_id: clientId, pincode })),
    skipDuplicates: true,
  });

  const rows = await prisma.serviceablePincode.findMany({
    where: { client_id: clientId },
    orderBy: { pincode: 'asc' },
  });
  return res.status(201).json(rows.map(serialize));
};

export const deleteServiceArea = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  console.log(`${TAG}.deleteServiceArea entry`, { userId, id });

  const clientId = await requireClientId(userId);
  if (!clientId) return res.status(404).json({ error: 'Not found' });

  const row = await prisma.serviceablePincode.findUnique({ where: { id: id as string } });
  if (!row || row.client_id !== clientId) {
    return res.status(404).json({ error: 'Pincode not found' });
  }

  await prisma.serviceablePincode.delete({ where: { id: row.id } });
  return res.status(204).send();
};
