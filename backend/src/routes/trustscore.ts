import { Router } from 'express';
import { TrustScoreController } from '../controllers/trustScoreController';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth';
import { validateTrustScoreQuery, validatePagination, validateUUIDParam } from '../middleware/validation';
import { apiRateLimit } from '../middleware/security';

const router: Router = Router();
const trustScoreController = new TrustScoreController();

// Apply API rate limiting
router.use(apiRateLimit);

// Public routes (with optional authentication for personalization)
router.get(
  '/',
  optionalAuth,
  validateTrustScoreQuery,
  validatePagination,
  trustScoreController.getCourierTrustScores.bind(trustScoreController)
);

router.get(
  '/dashboard',
  optionalAuth,
  validateTrustScoreQuery,
  trustScoreController.getTrustScoreDashboard.bind(trustScoreController)
);

router.get(
  '/:courierId',
  optionalAuth,
  validateUUIDParam('courierId'),
  trustScoreController.getCourierTrustScore.bind(trustScoreController)
);

router.get(
  '/:courierId/trends',
  optionalAuth,
  validateUUIDParam('courierId'),
  trustScoreController.getCourierTrends.bind(trustScoreController)
);

router.post(
  '/compare',
  optionalAuth,
  trustScoreController.compareCouriers.bind(trustScoreController)
);

// Protected routes (require authentication)
router.put(
  '/:courierId/update',
  authenticateToken,
  validateUUIDParam('courierId'),
  trustScoreController.updateCourierTrustScore.bind(trustScoreController)
);

// Admin only routes
router.put(
  '/update-all',
  authenticateToken,
  requireAdmin,
  trustScoreController.updateAllTrustScores.bind(trustScoreController)
);

export default router;

