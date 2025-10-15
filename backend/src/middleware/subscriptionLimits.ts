import { Request, Response, NextFunction } from 'express';
import {
  canCreateOrder,
  canSendEmail,
  canSendSMS,
  canAddCourier,
  canAddTeamMember,
} from '../utils/subscriptionLimits';
import logger from '../utils/logger';

/**
 * Middleware to check subscription limits
 */

/**
 * Check if user can create an order
 */
export async function checkOrderLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.user_id;

    if (!userId) {
      return next();
    }

    const check = await canCreateOrder(userId);

    if (!check.allowed) {
      logger.warn('[SubscriptionLimits] Order limit exceeded', { userId });
      res.status(403).json({
        success: false,
        error: 'Subscription Limit Reached',
        message: check.reason,
        code: 'ORDER_LIMIT_EXCEEDED',
        upgradeUrl: '/subscription/plans',
      });
      return;
    }

    // Add remaining count to request for informational purposes
    (req as any).subscriptionRemaining = {
      orders: check.remaining,
    };

    next();
  } catch (error) {
    logger.error('[SubscriptionLimits] Error checking order limit', error);
    next(); // Allow request to proceed on error
  }
}

/**
 * Check if user can send an email
 */
export async function checkEmailLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.user_id;

    if (!userId) {
      return next();
    }

    const check = await canSendEmail(userId);

    if (!check.allowed) {
      logger.warn('[SubscriptionLimits] Email limit exceeded', { userId });
      res.status(403).json({
        success: false,
        error: 'Subscription Limit Reached',
        message: check.reason,
        code: 'EMAIL_LIMIT_EXCEEDED',
        upgradeUrl: '/subscription/plans',
      });
      return;
    }

    (req as any).subscriptionRemaining = {
      emails: check.remaining,
    };

    next();
  } catch (error) {
    logger.error('[SubscriptionLimits] Error checking email limit', error);
    next();
  }
}

/**
 * Check if user can send SMS
 */
export async function checkSMSLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.user_id;

    if (!userId) {
      return next();
    }

    const check = await canSendSMS(userId);

    if (!check.allowed) {
      logger.warn('[SubscriptionLimits] SMS limit exceeded', { userId });
      res.status(403).json({
        success: false,
        error: 'Subscription Limit Reached',
        message: check.reason,
        code: 'SMS_LIMIT_EXCEEDED',
        upgradeUrl: '/subscription/plans',
      });
      return;
    }

    (req as any).subscriptionRemaining = {
      sms: check.remaining,
    };

    next();
  } catch (error) {
    logger.error('[SubscriptionLimits] Error checking SMS limit', error);
    next();
  }
}

/**
 * Check if merchant can add more couriers
 */
export async function checkCourierLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.user_id;

    if (!userId) {
      return next();
    }

    const check = await canAddCourier(userId);

    if (!check.allowed) {
      logger.warn('[SubscriptionLimits] Courier limit exceeded', { userId });
      res.status(403).json({
        success: false,
        error: 'Subscription Limit Reached',
        message: check.reason,
        code: 'COURIER_LIMIT_EXCEEDED',
        upgradeUrl: '/subscription/plans',
      });
      return;
    }

    (req as any).subscriptionRemaining = {
      couriers: check.remaining,
    };

    next();
  } catch (error) {
    logger.error('[SubscriptionLimits] Error checking courier limit', error);
    next();
  }
}

/**
 * Check if courier can add more team members
 */
export async function checkTeamMemberLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.user_id;

    if (!userId) {
      return next();
    }

    const check = await canAddTeamMember(userId);

    if (!check.allowed) {
      logger.warn('[SubscriptionLimits] Team member limit exceeded', { userId });
      res.status(403).json({
        success: false,
        error: 'Subscription Limit Reached',
        message: check.reason,
        code: 'TEAM_MEMBER_LIMIT_EXCEEDED',
        upgradeUrl: '/subscription/plans',
      });
      return;
    }

    (req as any).subscriptionRemaining = {
      teamMembers: check.remaining,
    };

    next();
  } catch (error) {
    logger.error('[SubscriptionLimits] Error checking team member limit', error);
    next();
  }
}

/**
 * Add subscription info to response headers
 */
export function addSubscriptionHeaders(req: Request, res: Response, next: NextFunction): void {
  const remaining = (req as any).subscriptionRemaining;

  if (remaining) {
    if (remaining.orders !== undefined) {
      res.setHeader('X-Orders-Remaining', remaining.orders === -1 ? 'unlimited' : remaining.orders);
    }
    if (remaining.emails !== undefined) {
      res.setHeader('X-Emails-Remaining', remaining.emails === -1 ? 'unlimited' : remaining.emails);
    }
    if (remaining.sms !== undefined) {
      res.setHeader('X-SMS-Remaining', remaining.sms === -1 ? 'unlimited' : remaining.sms);
    }
  }

  next();
}
