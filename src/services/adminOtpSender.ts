import { sendTextMessage } from './whatsappApi';

const TAG = '[adminOtpSender]';

export const sendAdminOtpViaWhatsApp = async (phone: string, code: string): Promise<void> => {
  const token = process.env.ADMIN_WA_TOKEN;
  const phoneNumberId = process.env.ADMIN_WA_PHONE_ID;

  if (!token || !phoneNumberId) {
    console.log(`${TAG} ${phone} -> ${code} (dev mode: ADMIN_WA_TOKEN/ADMIN_WA_PHONE_ID not set)`);
    return;
  }

  const to = phone.startsWith('91') ? phone : `91${phone}`;
  const text = `Your Meetwave admin login code is ${code}. It expires in 5 minutes.`;
  await sendTextMessage({ phoneNumberId, to, token, text });
  console.log(`${TAG} sent OTP to +${to}`);
};
