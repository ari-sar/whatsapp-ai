import axios from 'axios';

const GRAPH_VERSION = 'v17.0';

interface SendArgs {
  phoneNumberId: string;
  to: string;
  token: string;
}

const buildUrl = (phoneNumberId: string) =>
  `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;

const buildHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const post = async (phoneNumberId: string, token: string, payload: any) => {
  try {
    await axios.post(buildUrl(phoneNumberId), payload, { headers: buildHeaders(token) });
  } catch (error: any) {
    console.error('WhatsApp send failed:', error.response?.data || error.message);
    throw error;
  }
};

export const sendTextMessage = async (
  args: SendArgs & { text: string }
) => {
  const { phoneNumberId, to, token, text } = args;
  await post(phoneNumberId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  });
};

export interface ListRow {
  id: string;        // Returned in interactive.list_reply.id
  title: string;     // Max 24 chars (Meta limit)
  description?: string;
}

export interface ListSection {
  title: string;     // Section header
  rows: ListRow[];
}

export const sendInteractiveListMessage = async (
  args: SendArgs & {
    bodyText: string;
    buttonLabel: string;   // The CTA button that opens the list, e.g. "Choose a service"
    sections: ListSection[];
    headerText?: string;
    footerText?: string;
  }
) => {
  const { phoneNumberId, to, token, bodyText, buttonLabel, sections, headerText, footerText } = args;
  await post(phoneNumberId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      ...(headerText && { header: { type: 'text', text: headerText } }),
      body: { text: bodyText },
      ...(footerText && { footer: { text: footerText } }),
      action: { button: buttonLabel, sections },
    },
  });
};

export interface ReplyButton {
  id: string;        // Returned in interactive.button_reply.id
  title: string;     // Max 20 chars (Meta limit)
}

export const sendInteractiveButtonMessage = async (
  args: SendArgs & {
    bodyText: string;
    buttons: ReplyButton[]; // Max 3 buttons per WhatsApp spec
    headerText?: string;
    footerText?: string;
  }
) => {
  const { phoneNumberId, to, token, bodyText, buttons, headerText, footerText } = args;
  await post(phoneNumberId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(headerText && { header: { type: 'text', text: headerText } }),
      body: { text: bodyText },
      ...(footerText && { footer: { text: footerText } }),
      action: {
        buttons: buttons.map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
};

export const sendImageMessage = async (
  args: SendArgs & { imageUrl: string; caption?: string }
) => {
  const { phoneNumberId, to, token, imageUrl, caption } = args;
  await post(phoneNumberId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: { link: imageUrl, ...(caption && { caption }) },
  });
};
