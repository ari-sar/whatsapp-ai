import { Request, Response, NextFunction } from 'express';
import { verifyUserToken, JwtPayload } from '../utils/jwt';

const TAG = '[authJwt]';

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
    console.warn(`${TAG} UNAUTHORIZED (missing/invalid header)`, { path: req.path, hasHeader: !!header });
    return res.status(401).json({ error: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' });
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload: JwtPayload = verifyUserToken(token);
    req.user = { id: payload.sub, phone: payload.phone };
    console.log(`${TAG} ok`, { path: req.path, userId: payload.sub });
    return next();
  } catch (err: any) {
    console.warn(`${TAG} UNAUTHORIZED (verify failed)`, { path: req.path, err: err?.message });
    return res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }
};
