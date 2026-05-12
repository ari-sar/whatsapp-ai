import { RazorpayOrder, PaymentSuccess } from '../types/payment';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise: Promise<void> | null = null;

const loadScript = (): Promise<void> => {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay script failed to load'));
    document.body.appendChild(script);
  });
  return scriptPromise;
};

export interface OpenCheckoutArgs {
  order: RazorpayOrder;
  prefill: { name?: string; contact?: string; email?: string };
  notes?: Record<string, string>;
  description?: string;
}

export const openRazorpayCheckout = async (args: OpenCheckoutArgs): Promise<PaymentSuccess> => {
  await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: args.order.keyId,
      amount: args.order.amount,
      currency: args.order.currency,
      order_id: args.order.orderId,
      name: 'Meetwave',
      description: args.description ?? 'Plan subscription',
      prefill: args.prefill,
      notes: args.notes,
      handler: (response: any) => {
        resolve({
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });
    rzp.on('payment.failed', (resp: any) => reject(new Error(resp.error?.description ?? 'Payment failed')));
    rzp.open();
  });
};
