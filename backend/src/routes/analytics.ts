import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { apiRateLimit } from '../middleware/security';

const router: ExpressRouter = Router();
const analyticsController = new AnalyticsController();

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(apiRateLimit);

// Performance analytics routes
router.get('/performance', analyticsController.getPerformanceAnalytics.bind(analyticsController));
router.get('/competitor/:marketId', analyticsController.getCompetitorAnalysis.bind(analyticsController));
router.get('/markets', analyticsController.getAvailableMarkets.bind(analyticsController));

// Marketplace routes
router.get('/marketplace/couriers/:marketId', analyticsController.getCourierMarketplace.bind(analyticsController));
router.get('/marketplace/leads', analyticsController.getMerchantLeads.bind(analyticsController));
router.post('/marketplace/leads/:leadId/purchase', analyticsController.purchaseLead.bind(analyticsController));

// Subscription and premium features
router.get('/subscription/status', analyticsController.getSubscriptionStatus.bind(analyticsController));
router.post('/premium/:featureId/purchase', analyticsController.purchasePremiumFeature.bind(analyticsController));

export default router;
