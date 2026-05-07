import prisma from '../config/prisma';
import axios from 'axios';

export const processMessage = async (phoneNumberId: string, from: string, msgBody: string) => {
  try {
    // 1. Identify the client by phone_number_id
    const client = await prisma.client.findUnique({
      where: { phone_number_id: phoneNumberId }
    });

    if (!client) {
      console.warn(`No client found for phone_number_id: ${phoneNumberId}`);
      return;
    }

    // 2. Upsert the customer in the Leads table
    await prisma.lead.upsert({
      where: {
        client_id_user_phone: {
          client_id: client.id,
          user_phone: from
        }
      },
      update: {
        last_message: msgBody,
        timestamp: new Date()
      },
      create: {
        client_id: client.id,
        user_phone: from,
        last_message: msgBody
      }
    });

    // 3. Match keyword
    const lowerCaseMsg = msgBody.toLowerCase().trim();

    const keywordMatch = await prisma.keyword.findFirst({
      where: {
        client_id: client.id,
        trigger: lowerCaseMsg
      },
      include: {
        response: true
      }
    });

    let replyMessage = "Sorry, I didn't understand that. How can we help you today?";
    let replyMediaUrl = null;

    if (keywordMatch && keywordMatch.response) {
      replyMessage = keywordMatch.response.message;
      replyMediaUrl = keywordMatch.response.media_url;
    } else {
      // Look for a fallback keyword (optional feature, if a trigger like 'default_fallback' exists)
      const fallbackMatch = await prisma.keyword.findFirst({
         where: { client_id: client.id, trigger: 'default_fallback' },
         include: { response: true }
      });
      if (fallbackMatch && fallbackMatch.response) {
          replyMessage = fallbackMatch.response.message;
          replyMediaUrl = fallbackMatch.response.media_url;
      }
    }

    // 4. Send reply via Meta WhatsApp API
    await sendWhatsAppMessage(phoneNumberId, from, replyMessage, client.access_token);

  } catch (error) {
    console.error('Error processing message:', error);
  }
};

const sendWhatsAppMessage = async (phoneNumberId: string, to: string, text: string, token: string) => {
  const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: {
      body: text
    }
  };

  try {
    await axios.post(url, payload, { headers });
    console.log(`Message sent to ${to} successfully`);
  } catch (error: any) {
    console.error(`Failed to send message to ${to}:`, error.response?.data || error.message);
  }
};
