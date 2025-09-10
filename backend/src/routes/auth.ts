import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateLogin, validateRegister } from '../middleware/validation';
import { authRateLimit, bruteForceProtection } from '../middleware/security';

const router: ExpressRouter = Router();
const authController = new AuthController();

// Apply rate limiting and brute force protection to auth routes
router.use(authRateLimit);
router.use(bruteForceProtection());

// Public routes
router.post('/register', validateRegister, authController.register.bind(authController));
router.post('/login', validateLogin, authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));

// Protected routes
router.post('/logout', authenticateToken, authController.logout.bind(authController));
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));

export default router;

