import { Request, Response } from 'express';
import prisma from '../config/prisma';
import {
  PHONE_REGEX,
  OTP_TTL_SECONDS,
  generateOtpCode,
  hashOtp,
  compareOtp,
  checkSendRateLimit,
  MAX_OTP_ATTEMPTS,
} from '../utils/otp';
import { signUserToken } from '../utils/jwt';
import { sendOtpSms } from '../services/otpSmsProvider';
import { serializeUser } from '../utils/serializers';

const TAG = '[authController]';

export const sendOtp = async (req: Request, res: Response) => {
  const { phone } = req.body ?? {};
  console.log(`${TAG}.sendOtp entry`, { phone });

  if (typeof phone !== 'string' || !PHONE_REGEX.test(phone)) {
    console.warn(`${TAG}.sendOtp INVALID_PHONE`, { phone });
    return res.status(400).json({ error: 'Invalid phone number', code: 'INVALID_PHONE' });
  }

  const limit = await checkSendRateLimit(phone);
  if (!limit.ok) {
    console.warn(`${TAG}.sendOtp RATE_LIMITED`, { phone, reason: limit.reason });
    return res.status(429).json({ error: limit.reason ?? 'Rate limited', code: 'RATE_LIMITED' });
  }

  const code = generateOtpCode();
  const code_hash = await hashOtp(code);
  const expires_at = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  const otp = await prisma.otpRequest.create({
    data: { phone, code_hash, expires_at },
  });

  await sendOtpSms(phone, code);
  console.log(`${TAG}.sendOtp sent`, { phone, requestId: otp.id, expiresInSeconds: OTP_TTL_SECONDS });

  return res.status(200).json({ requestId: otp.id, expiresInSeconds: OTP_TTL_SECONDS });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body ?? {};
  console.log(`${TAG}.verifyOtp entry`, { phone, otp_len: typeof otp === 'string' ? otp.length : null });

  if (typeof phone !== 'string' || !PHONE_REGEX.test(phone)) {
    console.warn(`${TAG}.verifyOtp INVALID_PHONE`, { phone });
    return res.status(400).json({ error: 'Invalid phone number', code: 'INVALID_PHONE' });
  }
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    console.warn(`${TAG}.verifyOtp INVALID_OTP_FORMAT`, { phone });
    return res.status(400).json({ error: 'Invalid OTP format', code: 'INVALID_OTP' });
  }

  const latest = await prisma.otpRequest.findFirst({
    where: { phone, consumed: false },
    orderBy: { created_at: 'desc' },
  });

  if (!latest) {
    console.warn(`${TAG}.verifyOtp NO_OTP`, { phone });
    return res.status(400).json({ error: 'No active OTP. Request a new code.', code: 'NO_OTP' });
  }

  if (latest.expires_at.getTime() < Date.now()) {
    console.warn(`${TAG}.verifyOtp OTP_EXPIRED`, { phone, requestId: latest.id });
    return res.status(410).json({ error: 'OTP expired', code: 'OTP_EXPIRED' });
  }

  if (latest.attempts >= MAX_OTP_ATTEMPTS) {
    console.warn(`${TAG}.verifyOtp TOO_MANY_ATTEMPTS`, { phone, requestId: latest.id, attempts: latest.attempts });
    return res.status(429).json({ error: 'Too many attempts', code: 'TOO_MANY_ATTEMPTS' });
  }

  const match = await compareOtp(otp, latest.code_hash);
  if (!match) {
    await prisma.otpRequest.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } },
    });
    console.warn(`${TAG}.verifyOtp OTP_MISMATCH`, { phone, requestId: latest.id, attempts: latest.attempts + 1 });
    return res.status(400).json({ error: 'Incorrect OTP', code: 'OTP_MISMATCH' });
  }

  await prisma.otpRequest.update({
    where: { id: latest.id },
    data: { consumed: true },
  });

  const existing = await prisma.user.findUnique({ where: { phone } });
  const user = existing
    ? existing
    : await prisma.user.create({ data: { phone } });

  const { token, expiresAtMs } = signUserToken(user.id, user.phone);
  const isNew = !user.is_onboarded;

  console.log(`${TAG}.verifyOtp success`, { phone, userId: user.id, isNew, expiresAt: new Date(expiresAtMs).toISOString() });

  return res.status(200).json({
    token,
    expiresAt: expiresAtMs,
    isNew,
    user: serializeUser(user),
  });
};
