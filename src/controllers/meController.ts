import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getFlow } from '../flows';
import { serializeUser, serializeUserKeyword } from '../utils/serializers';
import {
  syncUserKeywordCreate,
  syncUserKeywordUpdate,
  syncUserKeywordDelete,
} from '../services/keywordSync';

export const getMe = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(serializeUser(user));
};

export const onboarding = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, businessName, businessTypeId, planId, paymentId, orderId } = req.body ?? {};

  if (
    typeof name !== 'string' ||
    typeof businessName !== 'string' ||
    typeof businessTypeId !== 'string' ||
    typeof planId !== 'string' ||
    typeof paymentId !== 'string' ||
    typeof orderId !== 'string'
  ) {
    return res.status(400).json({ error: 'Missing required fields', code: 'INVALID_INPUT' });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return res.status(400).json({ error: 'Unknown plan', code: 'INVALID_PLAN' });

  const bizFlow = await prisma.businessFlow.findUnique({ where: { id: businessTypeId } });
  if (!bizFlow) return res.status(400).json({ error: 'Unknown business type', code: 'INVALID_BUSINESS_TYPE' });

  if (process.env.MOCK_PAYMENTS !== 'true') {
    const order = await prisma.paymentOrder.findUnique({ where: { razorpay_order_id: orderId } });
    if (
      !order ||
      order.user_id !== userId ||
      order.plan_id !== planId ||
      order.status !== 'paid' ||
      order.razorpay_payment_id !== paymentId
    ) {
      return res.status(402).json({ error: 'Payment not verified', code: 'PAYMENT_NOT_VERIFIED' });
    }
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) return res.status(404).json({ error: 'User not found' });

  let clientId = existing.client_id;
  if (!clientId) {
    const client = await prisma.client.create({
      data: {
        shop_name: businessName,
        phone_number_id: `pending_${userId}`,
        access_token: null,
        plan: plan.name.toLowerCase(),
      },
    });
    clientId = client.id;
  } else {
    await prisma.client.update({
      where: { id: clientId },
      data: { shop_name: businessName, plan: plan.name.toLowerCase() },
    });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      business_name: businessName,
      business_type_id: businessTypeId,
      plan_id: planId,
      client_id: clientId,
      is_onboarded: true,
    },
  });

  return res.json(serializeUser(updated));
};

export const getMyFlow = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  return res.json({ flowId: user?.business_type_id ?? null });
};

export const setMyFlow = async (req: Request, res: Response) => {
  const { flowId } = req.body ?? {};
  if (typeof flowId !== 'string') {
    return res.status(400).json({ error: 'flowId required', code: 'INVALID_FLOW' });
  }
  const bizFlow = await prisma.businessFlow.findUnique({ where: { id: flowId } });
  if (!bizFlow || !bizFlow.is_active) {
    return res.status(400).json({ error: 'Unknown flowId', code: 'INVALID_FLOW' });
  }
  if (!getFlow(flowId)) {
    return res.status(400).json({ error: 'Flow not registered in engine', code: 'INVALID_FLOW' });
  }

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { business_type_id: flowId },
  });
  return res.json({ flowId });
};

export const listKeywords = async (req: Request, res: Response) => {
  const rows = await prisma.userKeyword.findMany({
    where: { user_id: req.user!.id },
    orderBy: { created_at: 'desc' },
  });
  return res.json(rows.map(serializeUserKeyword));
};

export const createKeyword = async (req: Request, res: Response) => {
  const { trigger, responseMessage } = req.body ?? {};
  if (typeof trigger !== 'string' || typeof responseMessage !== 'string') {
    return res.status(400).json({ error: 'trigger and responseMessage required', code: 'INVALID_INPUT' });
  }
  const t = trigger.toLowerCase().trim();
  if (!t) return res.status(400).json({ error: 'trigger cannot be empty', code: 'INVALID_INPUT' });

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const dup = await prisma.userKeyword.findUnique({
    where: { user_id_trigger: { user_id: user.id, trigger: t } },
  });
  if (dup) return res.status(409).json({ error: 'Trigger already exists', code: 'DUPLICATE_TRIGGER' });

  const created = await prisma.userKeyword.create({
    data: { user_id: user.id, trigger: t, response_message: responseMessage },
  });

  if (user.client_id) {
    try {
      await syncUserKeywordCreate(user.client_id, t, responseMessage);
    } catch (err) {
      console.error('keyword sync (create) failed:', err);
    }
  }

  return res.status(201).json(serializeUserKeyword(created));
};

export const updateKeyword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { trigger, responseMessage } = req.body ?? {};
  if (typeof trigger !== 'string' || typeof responseMessage !== 'string') {
    return res.status(400).json({ error: 'trigger and responseMessage required', code: 'INVALID_INPUT' });
  }
  const t = trigger.toLowerCase().trim();
  if (!t) return res.status(400).json({ error: 'trigger cannot be empty', code: 'INVALID_INPUT' });

  const existing = await prisma.userKeyword.findUnique({ where: { id: id as string } });
  if (!existing || existing.user_id !== req.user!.id) {
    return res.status(404).json({ error: 'Keyword not found' });
  }

  if (t !== existing.trigger) {
    const dup = await prisma.userKeyword.findUnique({
      where: { user_id_trigger: { user_id: req.user!.id, trigger: t } },
    });
    if (dup) return res.status(409).json({ error: 'Trigger already exists', code: 'DUPLICATE_TRIGGER' });
  }

  const updated = await prisma.userKeyword.update({
    where: { id: existing.id },
    data: { trigger: t, response_message: responseMessage },
  });

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (user?.client_id) {
    try {
      await syncUserKeywordUpdate(user.client_id, existing.trigger, t, responseMessage);
    } catch (err) {
      console.error('keyword sync (update) failed:', err);
    }
  }

  return res.json(serializeUserKeyword(updated));
};

export const deleteKeyword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.userKeyword.findUnique({ where: { id: id as string } });
  if (!existing || existing.user_id !== req.user!.id) {
    return res.status(404).json({ error: 'Keyword not found' });
  }

  await prisma.userKeyword.delete({ where: { id: existing.id } });

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (user?.client_id) {
    try {
      await syncUserKeywordDelete(user.client_id, existing.trigger);
    } catch (err) {
      console.error('keyword sync (delete) failed:', err);
    }
  }

  return res.status(204).send();
};

export const leadStats = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !user.client_id) {
    return res.json({ total: 0, monthly: buildEmptyMonths() });
  }

  const total = await prisma.lead.count({ where: { client_id: user.client_id } });

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const leads = await prisma.lead.findMany({
    where: { client_id: user.client_id, created_at: { gte: sixMonthsAgo } },
    select: { created_at: true },
  });

  const buckets = buildEmptyMonths();
  const indexByKey = new Map(buckets.map((b, i) => [b.key, i]));
  for (const l of leads) {
    const key = monthKey(l.created_at);
    const i = indexByKey.get(key);
    if (i !== undefined) buckets[i]!.count += 1;
  }

  return res.json({
    total,
    monthly: buckets.map((b) => ({ month: b.label, count: b.count })),
  });
};

const MONTH_LABEL_FMT = new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' });

const monthKey = (d: Date): string => `${d.getFullYear()}-${d.getMonth()}`;

const buildEmptyMonths = (): Array<{ key: string; label: string; count: number }> => {
  const now = new Date();
  const out: Array<{ key: string; label: string; count: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTH_LABEL_FMT.format(d),
      count: 0,
    });
  }
  return out;
};
