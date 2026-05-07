import { Router } from 'express';
import { verifyWebhook } from '../controllers/webhookController';
import { handleIncomingMessage } from '../controllers/webhookHandler';
import { verifySignature } from '../middleware/verifySignature';

const router = Router();

router.get('/', verifyWebhook);
router.post('/', verifySignature, handleIncomingMessage);

export default router;
