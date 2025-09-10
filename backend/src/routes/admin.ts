import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { apiRateLimit } from '../middleware/security';
import { AppError } from '../types';
import logger from '../utils/logger';
import { Request, Response, NextFunction } from 'express';
import { User } from '../types';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: User;
}

const router: ExpressRouter = Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));
router.use(apiRateLimit);

// Placeholder admin routes - implement controllers as needed
router.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Admin routes accessible' });
});

// TODO: Implement carrier and store management routes when controllers are available
// router.get('/carriers', getCarriers);
// router.post('/carriers', createCarrier);
// router.put('/carriers/:id', updateCarrier);
// router.delete('/carriers/:id', deleteCarrier);

// router.get('/stores', getStores);
// router.post('/stores', createStore);
// router.put('/stores/:id', updateStore);
// router.delete('/stores/:id', deleteStore);

export default router;

