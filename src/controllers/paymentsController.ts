import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { getRazorpay, getRazorpayKeyId } from '../services/razorpayClient';

const TAG = '[paymentsController]';

export const createOrder = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { planId } = req.body ?? {};
  console.log(`${TAG}.createOrder entry`, { userId, planId });

  if (typeof planId !== 'string') {
    console.warn(`${TAG}.createOrder INVALID_PLAN (type)`, { userId, planId });
    return res.status(400).json({ error: 'planId required', code: 'INVALID_PLAN' });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.is_active) {
    console.warn(`${TAG}.createOrder PLAN_NOT_FOUND`, { userId, planId, found: !!plan, active: plan?.is_active });
    return res.status(400).json({ error: 'Plan not found or inactive', code: 'PLAN_NOT_FOUND' });
  }

  const razorpay = getRazorpay();
  const rzpOrder = await razorpay.orders.create({
    amount: plan.price_in_paise,
    currency: plan.currency,
    receipt: `u_${userId.slice(0, 8)}_${Date.now()}`,
  });
  console.log(`${TAG}.createOrder razorpay order`, { userId, planId, orderId: rzpOrder.id, amount: plan.price_in_paise });

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
  console.log(`${TAG}.verifyPayment entry`, {
    userId,
    razorpayPaymentId,
    razorpayOrderId,
    sig_len: typeof razorpaySignature === 'string' ? razorpaySignature.length : null,
  });

  if (
    typeof razorpayPaymentId !== 'string' ||
    typeof razorpayOrderId !== 'string' ||
    typeof razorpaySignature !== 'string'
  ) {
    console.warn(`${TAG}.verifyPayment MISSING_FIELDS`, { userId });
    return res.status(400).json({ verified: false, error: 'Missing fields' });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error(`${TAG}.verifyPayment SERVER_MISCONFIGURED — RAZORPAY_KEY_SECRET missing`);
    return res.status(500).json({ verified: false, error: 'Server misconfigured' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(razorpayOrderId + '|' + razorpayPaymentId)
    .digest('hex');

  const verified = expected === razorpaySignature;
  if (!verified) {
    console.warn(`${TAG}.verifyPayment SIGNATURE_MISMATCH`, { userId, razorpayOrderId });
    return res.status(200).json({ verified: false });
  }

  const order = await prisma.paymentOrder.findUnique({
    where: { razorpay_order_id: razorpayOrderId },
  });
  if (!order || order.user_id !== userId) {
    console.warn(`${TAG}.verifyPayment ORDER_MISMATCH`, { userId, razorpayOrderId, found: !!order, orderUserId: order?.user_id });
    return res.status(200).json({ verified: false });
  }

  await prisma.paymentOrder.update({
    where: { id: order.id },
    data: { status: 'paid', razorpay_payment_id: razorpayPaymentId },
  });
  console.log(`${TAG}.verifyPayment verified`, { userId, razorpayOrderId, razorpayPaymentId });

  return res.status(200).json({ verified: true });
};
