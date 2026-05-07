import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createKeyword = async (req: Request, res: Response) => {
  try {
    const { client_id, trigger, response_id } = req.body;
    const keyword = await prisma.keyword.create({
      data: {
        client_id,
        trigger: trigger.toLowerCase(),
        response_id
      }
    });
    res.status(201).json(keyword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create keyword' });
  }
};

export const getKeywords = async (req: Request, res: Response) => {
  try {
    const { client_id } = req.query;
    const where = client_id ? { client_id: String(client_id) } : {};
    const keywords = await prisma.keyword.findMany({ where, include: { response: true } });
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
};

export const deleteKeyword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.keyword.delete({ where: { id: id as string } });
    res.json({ message: 'Keyword deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete keyword' });
  }
};
