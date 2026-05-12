import { Request, Response } from 'express';
import prisma from '../config/prisma';
import {
  ADMIN_PHONE_REGEX,
  ADMIN_OTP_TTL_SECONDS,
  generateAdminOtpCode,
  hashAdminOtp,
  compareAdminOtp,
  checkAdminSendRateLimit,
  MAX_ADMIN_OTP_ATTEMPTS,
  generateSessionToken,
  sessionExpiryFromNow,
} from '../utils/adminOtp';
import { sendAdminOtpViaWhatsApp } from '../services/adminOtpSender';

const TAG = '[adminAuthController]';

export const sendAdminOtp = async (req: Request, res: Response) => {
  const { phone } = req.body ?? {};
  console.log(`${TAG}.sendAdminOtp entry`, { phone });

  if (typeof phone !== 'string' || !ADMIN_PHONE_REGEX.test(phone)) {
    console.warn(`${TAG}.sendAdminOtp INVALID_PHONE`, { phone });
    return res.status(400).json({ error: 'Invalid phone number', code: 'INVALID_PHONE' });
  }

  const adminPhone = await prisma.adminPhone.findUnique({ where: { phone } });
  if (!adminPhone || !adminPhone.is_active) {
    console.warn(`${TAG}.sendAdminOtp NOT_ALLOWLISTED`, { phone, found: !!adminPhone });
    return res.status(403).json({ error: 'This number is not authorized for admin access', code: 'NOT_ALLOWLISTED' });
  }

  const limit = await checkAdminSendRateLimit(phone);
  if (!limit.ok) {
    console.warn(`${TAG}.sendAdminOtp RATE_LIMITED`, { phone, reason: limit.reason });
    return res.status(429).json({ error: limit.reason ?? 'Rate limited', code: 'RATE_LIMITED' });
  }

  const code = generateAdminOtpCode();
  const code_hash = await hashAdminOtp(code);
  const expires_at = new Date(Date.now() + ADMIN_OTP_TTL_SECONDS * 1000);

  const otp = await prisma.adminOtpRequest.create({
    data: { phone, code_hash, expires_at },
  });

  await sendAdminOtpViaWhatsApp(phone, code);
  console.log(`${TAG}.sendAdminOtp sent`, { phone, requestId: otp.id });

  return res.status(200).json({ requestId: otp.id, expiresInSeconds: ADMIN_OTP_TTL_SECONDS });
};

export const verifyAdminOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body ?? {};
  console.log(`${TAG}.verifyAdminOtp entry`, { phone, otp_len: typeof otp === 'string' ? otp.length : null });

  if (typeof phone !== 'string' || !ADMIN_PHONE_REGEX.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number', code: 'INVALID_PHONE' });
  }
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'Invalid OTP format', code: 'INVALID_OTP' });
  }

  const adminPhone = await prisma.adminPhone.findUnique({ where: { phone } });
  if (!adminPhone || !adminPhone.is_active) {
    return res.status(403).json({ error: 'This number is not authorized for admin access', code: 'NOT_ALLOWLISTED' });
  }

  const latest = await prisma.adminOtpRequest.findFirst({
    where: { phone, consumed: false },
    orderBy: { created_at: 'desc' },
  });
  if (!latest) {
    return res.status(400).json({ error: 'No active OTP. Request a new code.', code: 'NO_OTP' });
  }
  if (latest.expires_at.getTime() < Date.now()) {
    return res.status(410).json({ error: 'OTP expired', code: 'OTP_EXPIRED' });
  }
  if (latest.attempts >= MAX_ADMIN_OTP_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts', code: 'TOO_MANY_ATTEMPTS' });
  }

  const match = await compareAdminOtp(otp, latest.code_hash);
  if (!match) {
    await prisma.adminOtpRequest.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } },
    });
    return res.status(400).json({ error: 'Incorrect OTP', code: 'OTP_MISMATCH' });
  }

  await prisma.adminOtpRequest.update({
    where: { id: latest.id },
    data: { consumed: true },
  });

  const token = generateSessionToken();
  const expires_at = sessionExpiryFromNow();
  const session = await prisma.adminSession.create({
    data: { token, admin_phone_id: adminPhone.id, expires_at },
  });

  console.log(`${TAG}.verifyAdminOtp success`, { phone, adminPhoneId: adminPhone.id, sessionId: session.id });

  return res.status(200).json({
    token,
    expiresAt: expires_at.getTime(),
    admin: {
      id: adminPhone.id,
      phone: adminPhone.phone,
      name: adminPhone.name,
    },
  });
};

export const logoutAdmin = async (req: Request, res: Response) => {
  if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
  await prisma.adminSession.delete({ where: { id: req.admin.sessionId } }).catch(() => undefined);
  return res.status(204).send();
};

export const getAdminMe = async (req: Request, res: Response) => {
  if (!req.admin) return res.status(401).json({ error: 'Unauthorized' });
  const adminPhone = await prisma.adminPhone.findUnique({ where: { id: req.admin.adminPhoneId } });
  if (!adminPhone) return res.status(404).json({ error: 'Admin not found' });
  return res.json({
    id: adminPhone.id,
    phone: adminPhone.phone,
    name: adminPhone.name,
  });
};
