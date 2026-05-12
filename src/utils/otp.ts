import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';

export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const OTP_TTL_SECONDS = 300;
const COOLDOWN_SECONDS = 30;
const HOURLY_LIMIT = 5;
const MAX_VERIFY_ATTEMPTS = 5;

export const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOtp = (code: string) => bcrypt.hash(code, 10);
export const compareOtp = (code: string, hash: string) => bcrypt.compare(code, hash);

export interface RateLimitCheck {
  ok: boolean;
  reason?: string;
}

export const checkSendRateLimit = async (phone: string): Promise<RateLimitCheck> => {
  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - COOLDOWN_SECONDS * 1000);
  const hourCutoff = new Date(now.getTime() - 60 * 60 * 1000);

  const last = await prisma.otpRequest.findFirst({
    where: { phone, created_at: { gte: cooldownCutoff } },
    orderBy: { created_at: 'desc' },
  });
  if (last) return { ok: false, reason: 'Please wait before requesting another code.' };

  const hourCount = await prisma.otpRequest.count({
    where: { phone, created_at: { gte: hourCutoff } },
  });
  if (hourCount >= HOURLY_LIMIT) return { ok: false, reason: 'Too many requests. Try again later.' };

  return { ok: true };
};

export const MAX_OTP_ATTEMPTS = MAX_VERIFY_ATTEMPTS;
