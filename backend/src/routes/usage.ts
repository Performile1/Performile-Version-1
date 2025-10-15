import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getUsageSummary, getUserSubscription } from '../utils/subscriptionLimits';
import { tryCatch, sendSuccessResponse } from '../utils/errorHandler';
import logger from '../utils/logger';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/usage/summary
 * Get current usage and limits for the authenticated user
 */
router.get('/summary', tryCatch(async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;

  logger.info('[Usage] Get summary', { userId });

  const summary = await getUsageSummary(userId);

  sendSuccessResponse(res, summary);
}));

/**
 * GET /api/usage/subscription
 * Get detailed subscription information
 */
router.get('/subscription', tryCatch(async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;

  logger.info('[Usage] Get subscription', { userId });

  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return sendSuccessResponse(res, {
      hasSubscription: false,
      message: 'No active subscription found',
    });
  }

  sendSuccessResponse(res, {
    hasSubscription: true,
    subscription,
  });
}));

/**
 * GET /api/usage/limits
 * Get just the limits (no usage data)
 */
router.get('/limits', tryCatch(async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;

  logger.info('[Usage] Get limits', { userId });

  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return sendSuccessResponse(res, {
      hasSubscription: false,
      limits: null,
    });
  }

  sendSuccessResponse(res, {
    hasSubscription: true,
    limits: subscription.limits,
  });
}));

/**
 * GET /api/usage/check/:resource
 * Check if user can use a specific resource
 */
router.get('/check/:resource', tryCatch(async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;
  const { resource } = req.params;

  logger.info('[Usage] Check resource', { userId, resource });

  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return sendSuccessResponse(res, {
      allowed: true,
      reason: 'No active subscription',
    });
  }

  const { limits, usage } = subscription;

  let result = { allowed: true, remaining: -1, used: 0, limit: null };

  switch (resource) {
    case 'orders':
      result = {
        allowed: limits.max_orders_per_month === null || usage.orders_used_this_month < limits.max_orders_per_month,
        remaining: limits.max_orders_per_month === null ? -1 : limits.max_orders_per_month - usage.orders_used_this_month,
        used: usage.orders_used_this_month,
        limit: limits.max_orders_per_month,
      };
      break;

    case 'emails':
      result = {
        allowed: limits.max_emails_per_month === null || usage.emails_sent_this_month < limits.max_emails_per_month,
        remaining: limits.max_emails_per_month === null ? -1 : limits.max_emails_per_month - usage.emails_sent_this_month,
        used: usage.emails_sent_this_month,
        limit: limits.max_emails_per_month,
      };
      break;

    case 'sms':
      result = {
        allowed: limits.max_sms_per_month === null || usage.sms_sent_this_month < limits.max_sms_per_month,
        remaining: limits.max_sms_per_month === null ? -1 : limits.max_sms_per_month - usage.sms_sent_this_month,
        used: usage.sms_sent_this_month,
        limit: limits.max_sms_per_month,
      };
      break;

    default:
      return sendSuccessResponse(res, {
        error: 'Invalid resource type',
        validResources: ['orders', 'emails', 'sms'],
      });
  }

  sendSuccessResponse(res, result);
}));

export default router;
