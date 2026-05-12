import { Router } from 'express';
import { sendAdminOtp, verifyAdminOtp, logoutAdmin, getAdminMe } from '../controllers/adminAuthController';
import { verifyAdminSession } from '../middleware/verifyAdminSession';

const router = Router();

router.post('/otp/send', sendAdminOtp);
router.post('/otp/verify', verifyAdminOtp);
router.post('/logout', verifyAdminSession, logoutAdmin);
router.get('/me', verifyAdminSession, getAdminMe);

export default router;
