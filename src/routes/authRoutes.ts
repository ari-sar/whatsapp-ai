import { Router } from 'express';
import { sendOtp, verifyOtp } from '../controllers/authController';

const router = Router();

router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

export default router;
