import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

const TAG = '[verifyAdminSession]';

declare global {
  namespace Express {
    interface Request {
      admin?: { sessionId: string; adminPhoneId: string; phone: string };
    }
  }
}

export const verifyAdminSession = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    console.warn(`${TAG} UNAUTHORIZED (missing/invalid header)`, { path: req.path });
    return res.status(401).json({ error: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' });
  }
  const token = header.slice('Bearer '.length).trim();
  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { admin_phone: true },
  });
  if (!session) {
    console.warn(`${TAG} UNAUTHORIZED (no session)`, { path: req.path });
    return res.status(401).json({ error: 'Invalid session', code: 'UNAUTHORIZED' });
  }
  if (session.expires_at.getTime() < Date.now()) {
    console.warn(`${TAG} EXPIRED`, { path: req.path, sessionId: session.id });
    return res.status(401).json({ error: 'Session expired', code: 'SESSION_EXPIRED' });
  }
  if (!session.admin_phone.is_active) {
    console.warn(`${TAG} INACTIVE_ADMIN`, { path: req.path, adminPhoneId: session.admin_phone_id });
    return res.status(403).json({ error: 'Admin disabled', code: 'ADMIN_INACTIVE' });
  }

  await prisma.adminSession.update({
    where: { id: session.id },
    data: { last_seen_at: new Date() },
  });

  req.admin = {
    sessionId: session.id,
    adminPhoneId: session.admin_phone_id,
    phone: session.admin_phone.phone,
  };
  return next();
};
