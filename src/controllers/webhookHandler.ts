import { Request, Response } from 'express';
import { processMessage } from '../services/messageProcessor';

export const handleIncomingMessage = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Check if it's a WhatsApp status update or message
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const message = body.entry[0].changes[0].value.messages[0];

        // Only process text messages for now
        if (message.type === 'text') {
          const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
          const from = message.from; // extract the phone number from the webhook payload
          const msgBody = message.text.body; // extract the message text from the webhook payload

          console.log(`Received message from ${from} to ${phoneNumberId}: ${msgBody}`);

          // Let the webhook caller know we got it successfully
          res.sendStatus(200);

          // Core processing logic will be handled here (asynchronously)
          processMessage(phoneNumberId, from, msgBody);
        } else {
          // Handle other message types like image, audio, etc. or ignore them
          console.log(`Received message of type ${message.type}, currently unhandled.`);
          res.sendStatus(200);
        }
      } else {
        res.sendStatus(200); // Send 200 for statuses, acks etc.
      }
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.sendStatus(500);
  }
};
