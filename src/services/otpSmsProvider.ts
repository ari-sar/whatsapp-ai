export const sendOtpSms = async (phone: string, code: string): Promise<void> => {
  const providerUrl = process.env.OTP_SMS_PROVIDER_URL;
  const apiKey = process.env.OTP_SMS_API_KEY;

  if (!providerUrl || !apiKey) {
    console.log(`[OTP] ${phone} -> ${code} (dev mode: no SMS provider configured)`);
    return;
  }

  console.log(`[OTP] Sending code to +91${phone} via ${providerUrl}`);
};
