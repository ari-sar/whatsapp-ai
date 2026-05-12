import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export interface JwtPayload {
  sub: string;
  phone: string;
  iat: number;
  exp: number;
}

export const signUserToken = (userId: string, phone: string): { token: string; expiresAtMs: number } => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + THIRTY_DAYS_SECONDS;
  const token = jwt.sign({ sub: userId, phone, iat, exp }, SECRET, { algorithm: 'HS256' });
  return { token, expiresAtMs: exp * 1000 };
};

export const verifyUserToken = (token: string): JwtPayload => {
  return jwt.verify(token, SECRET) as JwtPayload;
};
