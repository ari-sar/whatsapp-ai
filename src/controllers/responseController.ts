import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createResponse = async (req: Request, res: Response) => {
  try {
    const { message, media_url } = req.body;
    const responseRecord = await prisma.response.create({
      data: {
        message,
        media_url
      }
    });
    res.status(201).json(responseRecord);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create response' });
  }
};

export const getResponses = async (req: Request, res: Response) => {
  try {
    const responses = await prisma.response.findMany();
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
};

export const updateResponse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const responseRecord = await prisma.response.update({
      where: { id: id as string },
      data
    });
    res.json(responseRecord);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update response' });
  }
};

export const deleteResponse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.response.delete({ where: { id: id as string } });
    res.json({ message: 'Response deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete response' });
  }
};
