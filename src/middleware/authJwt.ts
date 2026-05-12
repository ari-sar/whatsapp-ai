import { Request, Response, NextFunction } from 'express';
import { verifyUserToken, JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; phone: string };
    }
  }
}

export const authJwt = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' });
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload: JwtPayload = verifyUserToken(token);
    req.user = { id: payload.sub, phone: payload.phone };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }
};
