import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma';

export const ADMIN_PHONE_REGEX = /^[6-9]\d{9}$/;
export const ADMIN_OTP_TTL_SECONDS = 300;
const COOLDOWN_SECONDS = 30;
const HOURLY_LIMIT = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const SESSION_DAYS = parseInt(process.env.ADMIN_SESSION_DAYS || '30', 10);

export const generateAdminOtpCode = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const hashAdminOtp = (code: string) => bcrypt.hash(code, 10);
export const compareAdminOtp = (code: string, hash: string) => bcrypt.compare(code, hash);

export interface RateLimitCheck {
  ok: boolean;
  reason?: string;
}

export const checkAdminSendRateLimit = async (phone: string): Promise<RateLimitCheck> => {
  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - COOLDOWN_SECONDS * 1000);
  const hourCutoff = new Date(now.getTime() - 60 * 60 * 1000);

  const last = await prisma.adminOtpRequest.findFirst({
    where: { phone, created_at: { gte: cooldownCutoff } },
    orderBy: { created_at: 'desc' },
  });
  if (last) return { ok: false, reason: 'Please wait before requesting another code.' };

  const hourCount = await prisma.adminOtpRequest.count({
    where: { phone, created_at: { gte: hourCutoff } },
  });
  if (hourCount >= HOURLY_LIMIT) return { ok: false, reason: 'Too many requests. Try again later.' };

  return { ok: true };
};

export const MAX_ADMIN_OTP_ATTEMPTS = MAX_VERIFY_ATTEMPTS;

export const generateSessionToken = (): string =>
  crypto.randomBytes(48).toString('base64url');

export const sessionExpiryFromNow = (): Date =>
  new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

export const SESSION_TTL_DAYS = SESSION_DAYS;
