import { Router } from 'express';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth';
import { generalRateLimit } from '../middleware/security';
import { validateUUIDParam } from '../middleware/validation';
import {
  generateApiKey,
  getCarrierRatings,
  submitOrder,
  updateOrderStatus,
  getIntegrationAnalytics,
} from '../controllers/integrationController';

const router: Router = Router();

// Public API endpoints (with API key authentication)
router.get('/carriers', generalRateLimit, getCarrierRatings);
router.post('/orders', generalRateLimit, submitOrder);

// Protected endpoints for authenticated users
router.use(authenticateToken);

// Integration management (merchants and admins)
router.post('/api-key', requireRole(['merchant', 'admin']), generateApiKey);
router.get('/analytics', requireRole(['merchant', 'admin']), getIntegrationAnalytics);

// Order status updates (couriers)
router.put('/orders/:order_id/status', 
  requireRole(['courier', 'admin']), 
  validateUUIDParam('order_id'), 
  updateOrderStatus
);

export default router;

