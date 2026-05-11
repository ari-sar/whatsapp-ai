import { Request, Response } from 'express';
import { processMessage } from '../services/messageProcessor';
import { IncomingInput } from '../flows/types';

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

    if (!body.object) {
      res.sendStatus(404);
      return;
    }

    const change = body.entry?.[0]?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) {
      res.sendStatus(200); // status updates, acks, etc.
      return;
    }

    const phoneNumberId = change.value.metadata.phone_number_id;
    const from = message.from;
    const input = parseIncomingInput(message);

    if (!input) {
      console.log(`Received unhandled message type "${message.type}" from ${from}.`);
      res.sendStatus(200);
      return;
    }

    console.log(`Received ${input.type} from ${from} to ${phoneNumberId}: ${input.value}`);
    res.sendStatus(200);

    processMessage(phoneNumberId, from, input);
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.sendStatus(500);
  }
};
