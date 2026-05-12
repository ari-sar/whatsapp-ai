import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { getRazorpay, getRazorpayKeyId } from '../services/razorpayClient';

export const createOrder = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { planId } = req.body ?? {};
  if (typeof planId !== 'string') {
    return res.status(400).json({ error: 'planId required', code: 'INVALID_PLAN' });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.is_active) {
    return res.status(400).json({ error: 'Plan not found or inactive', code: 'PLAN_NOT_FOUND' });
  }

  const razorpay = getRazorpay();
  const rzpOrder = await razorpay.orders.create({
    amount: plan.price_in_paise,
    currency: plan.currency,
    receipt: `u_${userId.slice(0, 8)}_${Date.now()}`,
  });

  await prisma.paymentOrder.create({
    data: {
      user_id: userId,
      plan_id: plan.id,
      razorpay_order_id: rzpOrder.id,
      amount: plan.price_in_paise,
      currency: plan.currency,
      status: 'created',
    },
  });

  return res.json({
    orderId: rzpOrder.id,
    amount: plan.price_in_paise,
    currency: plan.currency,
    keyId: getRazorpayKeyId(),
  });
};

export const verifyPayment = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body ?? {};

  if (
    typeof razorpayPaymentId !== 'string' ||
    typeof razorpayOrderId !== 'string' ||
    typeof razorpaySignature !== 'string'
  ) {
    return res.status(400).json({ verified: false, error: 'Missing fields' });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return res.status(500).json({ verified: false, error: 'Server misconfigured' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(razorpayOrderId + '|' + razorpayPaymentId)
    .digest('hex');

  const verified = expected === razorpaySignature;
  if (!verified) {
    return res.status(200).json({ verified: false });
  }

  const order = await prisma.paymentOrder.findUnique({
    where: { razorpay_order_id: razorpayOrderId },
  });
  if (!order || order.user_id !== userId) {
    return res.status(200).json({ verified: false });
  }

  await prisma.paymentOrder.update({
    where: { id: order.id },
    data: { status: 'paid', razorpay_payment_id: razorpayPaymentId },
  });

  return res.status(200).json({ verified: true });
};
