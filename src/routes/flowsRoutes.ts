import { Router } from 'express';
import { listBusinessFlows } from '../controllers/flowsController';

const router = Router();
router.get('/', listBusinessFlows);
export default router;
