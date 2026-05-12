import { Request, Response } from 'express';
import { processMessage } from '../services/messageProcessor';
import { IncomingInput } from '../flows/types';

const TAG = '[webhookHandler]';

const parseIncomingInput = (message: any): IncomingInput | null => {
  if (message.type === 'text') {
    return { type: 'text', value: message.text.body };
  }
  if (message.type === 'interactive') {
    const interactive = message.interactive;
    if (interactive?.type === 'list_reply' && interactive.list_reply?.id) {
      return { type: 'list', value: interactive.list_reply.id };
    }
    if (interactive?.type === 'button_reply' && interactive.button_reply?.id) {
      return { type: 'button', value: interactive.button_reply.id };
    }
  }
  return null;
};

export const handleIncomingMessage = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    console.log(`${TAG} incoming`, { object: body?.object, hasEntry: !!body?.entry });

    if (!body.object) {
      console.warn(`${TAG} no object — 404`);
      res.sendStatus(404);
      return;
    }

    const change = body.entry?.[0]?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) {
      console.log(`${TAG} no message (status/ack/etc.) — 200`);
      res.sendStatus(200);
      return;
    }

    const phoneNumberId = change.value.metadata.phone_number_id;
    const from = message.from;
    const input = parseIncomingInput(message);

    if (!input) {
      console.log(`${TAG} unhandled message type "${message.type}" from ${from}`);
      res.sendStatus(200);
      return;
    }

    console.log(`${TAG} parsed`, { phoneNumberId, from, type: input.type, value: input.value });
    res.sendStatus(200);

    processMessage(phoneNumberId, from, input);
  } catch (error) {
    console.error(`${TAG} error`, error);
    res.sendStatus(500);
  }
};
