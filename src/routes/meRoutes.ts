import { Router } from 'express';
import { authJwt } from '../middleware/authJwt';
import {
  getMe,
  onboarding,
  getMyFlow,
  setMyFlow,
  listKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  leadStats,
} from '../controllers/meController';

const router = Router();

router.use(authJwt);

router.get('/', getMe);
router.post('/onboarding', onboarding);

router.get('/flow', getMyFlow);
router.put('/flow', setMyFlow);

router.get('/keywords', listKeywords);
router.post('/keywords', createKeyword);
router.put('/keywords/:id', updateKeyword);
router.delete('/keywords/:id', deleteKeyword);

router.get('/leads/stats', leadStats);

export default router;
