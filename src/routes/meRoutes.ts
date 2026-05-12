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
import {
  listServiceAreas,
  createServiceArea,
  bulkCreateServiceAreas,
  deleteServiceArea,
} from '../controllers/meServiceAreaController';

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

router.get('/service-areas', listServiceAreas);
router.post('/service-areas', createServiceArea);
router.post('/service-areas/bulk', bulkCreateServiceAreas);
router.delete('/service-areas/:id', deleteServiceArea);

router.get('/leads/stats', leadStats);

export default router;
