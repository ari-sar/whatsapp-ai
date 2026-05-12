import Razorpay from 'razorpay';

let instance: Razorpay | null = null;

export const getRazorpay = (): Razorpay => {
  if (instance) return instance;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
  }
  instance = new Razorpay({ key_id, key_secret });
  return instance;
};

export const getRazorpayKeyId = (): string => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  if (!key_id) throw new Error('RAZORPAY_KEY_ID must be set');
  return key_id;
};
