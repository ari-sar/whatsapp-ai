import { Router } from 'express';
import { listPlans } from '../controllers/plansController';

const router = Router();
router.get('/', listPlans);
export default router;
