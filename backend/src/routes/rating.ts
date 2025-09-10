import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { RatingController } from '../controllers/ratingController';
import { authenticateToken } from '../middleware/auth';
import { validateCreateReview } from '../middleware/validation';
import { apiRateLimit } from '../middleware/security';

const router: ExpressRouter = Router();
const ratingController = new RatingController();

// Protected routes (require authentication)
router.post('/request', authenticateToken, apiRateLimit, ratingController.sendRatingRequest);
router.get('/analytics', authenticateToken, apiRateLimit, ratingController.getRatingAnalytics);
router.get('/services/:courierId', authenticateToken, apiRateLimit, ratingController.getCourierServices);
router.put('/services', authenticateToken, apiRateLimit, ratingController.updateCourierServices);
router.post('/process-non-responses', authenticateToken, apiRateLimit, ratingController.processNonResponses);

// Public routes (no authentication required)
router.post('/submit', apiRateLimit, validateCreateReview, ratingController.submitRating);

export default router;
