import { Router } from 'express';
import { createClient, getClients, getClient, updateClient, deleteClient } from '../controllers/clientController';
import { createResponse, getResponses, updateResponse, deleteResponse } from '../controllers/responseController';
import { createKeyword, getKeywords, deleteKeyword } from '../controllers/keywordController';
import { getLeads } from '../controllers/leadController';

const router = Router();

// Client routes
router.post('/clients', createClient);
router.get('/clients', getClients);
router.get('/clients/:id', getClient);
router.put('/clients/:id', updateClient);
router.delete('/clients/:id', deleteClient);

// Response routes
router.post('/responses', createResponse);
router.get('/responses', getResponses);
router.put('/responses/:id', updateResponse);
router.delete('/responses/:id', deleteResponse);

// Keyword routes
router.post('/keywords', createKeyword);
router.get('/keywords', getKeywords);
router.delete('/keywords/:id', deleteKeyword);

// Lead routes
router.get('/leads', getLeads);

export default router;
