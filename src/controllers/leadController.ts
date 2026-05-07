import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getLeads = async (req: Request, res: Response) => {
  try {
    const { client_id } = req.query;
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }
    const leads = await prisma.lead.findMany({
      where: { client_id: String(client_id) },
      orderBy: { timestamp: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};
