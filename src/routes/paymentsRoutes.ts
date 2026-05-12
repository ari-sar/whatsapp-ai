import { Router } from 'express';
import { authJwt } from '../middleware/authJwt';
import { createOrder, verifyPayment } from '../controllers/paymentsController';

const router = Router();
router.use(authJwt);

router.post('/orders', createOrder);
router.post('/verify', verifyPayment);

export default router;
