import { Request, Response } from 'express';
import prisma from '../config/prisma';

const TAG = '[keywordController]';

export const createKeyword = async (req: Request, res: Response) => {
  try {
    const { client_id, trigger, response_id, flow_id } = req.body ?? {};
    console.log(`${TAG}.createKeyword entry`, { client_id, trigger, hasResponse: !!response_id, hasFlow: !!flow_id });

    if (typeof client_id !== 'string' || typeof trigger !== 'string') {
      return res.status(400).json({ error: 'client_id and trigger required', code: 'INVALID_INPUT' });
    }
    const hasResponse = typeof response_id === 'string' && response_id;
    const hasFlow = typeof flow_id === 'string' && flow_id;
    if (hasResponse && hasFlow) {
      return res.status(400).json({ error: 'response_id and flow_id are mutually exclusive', code: 'INVALID_INPUT' });
    }
    if (!hasResponse && !hasFlow) {
      return res.status(400).json({ error: 'response_id or flow_id required', code: 'INVALID_INPUT' });
    }
    if (hasFlow) {
      const flow = await prisma.businessFlow.findUnique({ where: { id: flow_id } });
      if (!flow || !flow.is_active) {
        return res.status(400).json({ error: 'Unknown or inactive flow_id', code: 'INVALID_FLOW' });
      }
    }
    if (hasResponse) {
      const response = await prisma.response.findUnique({ where: { id: response_id } });
      if (!response) {
        return res.status(400).json({ error: 'Unknown response_id', code: 'INVALID_RESPONSE' });
      }
    }

    const keyword = await prisma.keyword.create({
      data: {
        client_id,
        trigger: trigger.toLowerCase(),
        response_id: hasResponse ? response_id : null,
        flow_id: hasFlow ? flow_id : null,
      },
    });
    res.status(201).json(keyword);
  } catch (error) {
    console.error(`${TAG}.createKeyword error`, error);
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
