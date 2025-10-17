/**
 * WEEK 3: INTEGRATIONS API ROUTES
 * Purpose: Route definitions for all Week 3 integration endpoints
 */

import express from 'express';
import { requireAuth } from '../middleware/auth';

// Import controllers
import {
  createCourierCredentials,
  getCourierCredentials,
  updateCourierCredentials,
  deleteCourierCredentials,
  testCourierCredentials
} from './courier-credentials';

import {
  createWebhook,
  getWebhooks,
  updateWebhook,
  deleteWebhook,
  receiveWebhook
} from './webhooks';

import {
  createApiKey,
  getApiKeys,
  updateApiKey,
  deleteApiKey,
  regenerateApiKey,
  authenticateApiKey
} from './api-keys';

const router = express.Router();

// ============================================================================
// COURIER CREDENTIALS ROUTES
// ============================================================================

router.post('/courier-credentials', requireAuth, createCourierCredentials);
router.get('/courier-credentials', requireAuth, getCourierCredentials);
router.put('/courier-credentials/:id', requireAuth, updateCourierCredentials);
router.delete('/courier-credentials/:id', requireAuth, deleteCourierCredentials);
router.post('/courier-credentials/:id/test', requireAuth, testCourierCredentials);

// ============================================================================
// WEBHOOK ROUTES
// ============================================================================

router.post('/webhooks', requireAuth, createWebhook);
router.get('/webhooks', requireAuth, getWebhooks);
router.put('/webhooks/:id', requireAuth, updateWebhook);
router.delete('/webhooks/:id', requireAuth, deleteWebhook);

// Public webhook receiver (no auth - verified by signature)
router.post('/webhooks/receive/:courier_name', receiveWebhook);

// ============================================================================
// API KEYS ROUTES
// ============================================================================

router.post('/api-keys', requireAuth, createApiKey);
router.get('/api-keys', requireAuth, getApiKeys);
router.put('/api-keys/:id', requireAuth, updateApiKey);
router.delete('/api-keys/:id', requireAuth, deleteApiKey);
router.post('/api-keys/:id/regenerate', requireAuth, regenerateApiKey);

// ============================================================================
// EXPORT
// ============================================================================

export default router;
export { authenticateApiKey };
