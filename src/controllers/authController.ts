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

export const sendOtp = async (req: Request, res: Response) => {
  const { phone } = req.body ?? {};
  if (typeof phone !== 'string' || !PHONE_REGEX.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number', code: 'INVALID_PHONE' });
  }

  const limit = await checkSendRateLimit(phone);
  if (!limit.ok) {
    return res.status(429).json({ error: limit.reason ?? 'Rate limited', code: 'RATE_LIMITED' });
  }

  const code = generateOtpCode();
  const code_hash = await hashOtp(code);
  const expires_at = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  const otp = await prisma.otpRequest.create({
    data: { phone, code_hash, expires_at },
  });

  await sendOtpSms(phone, code);

  return res.status(200).json({ requestId: otp.id, expiresInSeconds: OTP_TTL_SECONDS });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body ?? {};
  if (typeof phone !== 'string' || !PHONE_REGEX.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number', code: 'INVALID_PHONE' });
  }
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'Invalid OTP format', code: 'INVALID_OTP' });
  }

  const latest = await prisma.otpRequest.findFirst({
    where: { phone, consumed: false },
    orderBy: { created_at: 'desc' },
  });

  if (!latest) {
    return res.status(400).json({ error: 'No active OTP. Request a new code.', code: 'NO_OTP' });
  }

  if (latest.expires_at.getTime() < Date.now()) {
    return res.status(410).json({ error: 'OTP expired', code: 'OTP_EXPIRED' });
  }

  if (latest.attempts >= MAX_OTP_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts', code: 'TOO_MANY_ATTEMPTS' });
  }

  const match = await compareOtp(otp, latest.code_hash);
  if (!match) {
    await prisma.otpRequest.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } },
    });
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

  return res.status(200).json({
    token,
    expiresAt: expiresAtMs,
    isNew,
    user: serializeUser(user),
  });
};
