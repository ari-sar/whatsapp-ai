import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const verifySignature = (req: Request, res: Response, next: NextFunction) => {
  const appSecret = process.env.APP_SECRET;
  if (!appSecret) {
    console.warn('APP_SECRET not set, bypassing signature verification');
    return next();
  }

  const signature = req.headers['x-hub-signature-256'] as string;

  if (!signature) {
    return res.status(403).send('Signature missing');
  }

  const elements = signature.split('=');
  const signatureHash = elements[1];

  // Need raw body for correct hash, usually configured in express.json
  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    console.warn('rawBody not found, bypassing signature verification. Ensure express.json is configured to capture raw body.');
    return next();
  }

  const expectedHash = crypto.createHmac('sha256', appSecret)
                            .update(rawBody)
                            .digest('hex');

  if (signatureHash !== expectedHash) {
    return res.status(403).send('Signature invalid');
  }

  next();
};
