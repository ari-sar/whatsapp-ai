import { Router } from 'express';
import { verifyAdminSession } from '../middleware/verifyAdminSession';
import {
  listAdminFlows,
  getAdminFlow,
  createAdminFlow,
  updateAdminFlow,
  deleteAdminFlow,
} from '../controllers/adminFlowsController';
import {
  listAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
} from '../controllers/adminPlansController';
import { listAdminUsers, getAdminUser } from '../controllers/adminUsersController';

const router = Router();

router.use(verifyAdminSession);

router.get('/flows', listAdminFlows);
router.get('/flows/:id', getAdminFlow);
router.post('/flows', createAdminFlow);
router.put('/flows/:id', updateAdminFlow);
router.delete('/flows/:id', deleteAdminFlow);

router.get('/plans', listAdminPlans);
router.post('/plans', createAdminPlan);
router.put('/plans/:id', updateAdminPlan);
router.delete('/plans/:id', deleteAdminPlan);

router.get('/users', listAdminUsers);
router.get('/users/:id', getAdminUser);

export default router;
