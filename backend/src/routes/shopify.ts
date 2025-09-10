import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { generalRateLimit } from '../middleware/security';
import {
  handleFulfillmentCreated,
  handleFulfillmentUpdated,
  registerShopifyStore,
  getShopifyAnalytics,
} from '../controllers/shopifyController';

const router: Router = Router();

// Webhook endpoints (no auth required - verified by signature)
router.post('/webhooks/fulfillments/create', 
  generalRateLimit, 
  handleFulfillmentCreated
);

router.post('/webhooks/fulfillments/update', 
  generalRateLimit, 
  handleFulfillmentUpdated
);

// Protected endpoints for authenticated users
router.use(authenticateToken);

// Store registration and management
router.post('/register', 
  requireRole(['merchant', 'admin']), 
  generalRateLimit,
  registerShopifyStore
);

router.get('/analytics', 
  requireRole(['merchant', 'admin']), 
  generalRateLimit,
  getShopifyAnalytics
);

export default router;

