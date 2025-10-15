import { queryOne } from './dbHelpers';
import logger from './logger';

/**
 * Subscription Limits Utility
 * Checks and enforces subscription limits for users
 */

export interface SubscriptionLimits {
  plan_id: number;
  plan_name: string;
  plan_slug: string;
  tier: number;
  max_orders_per_month: number | null;
  max_emails_per_month: number | null;
  max_sms_per_month: number | null;
  max_push_notifications_per_month: number | null;
  max_couriers: number | null;
  max_team_members: number | null;
  max_shops: number | null;
  features: any;
}

export interface SubscriptionUsage {
  subscription_id: number;
  orders_used_this_month: number;
  emails_sent_this_month: number;
  sms_sent_this_month: number;
  push_notifications_sent_this_month: number;
  current_period_start: Date;
  current_period_end: Date;
  status: string;
}

export interface SubscriptionInfo {
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
  hasActiveSubscription: boolean;
}

/**
 * Get user's subscription limits and usage
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
  try {
    const result = await queryOne<any>(`
      SELECT 
        us.subscription_id,
        us.status,
        us.orders_used_this_month,
        us.emails_sent_this_month,
        us.sms_sent_this_month,
        us.push_notifications_sent_this_month,
        us.current_period_start,
        us.current_period_end,
        sp.plan_id,
        sp.plan_name,
        sp.plan_slug,
        sp.tier,
        sp.max_orders_per_month,
        sp.max_emails_per_month,
        sp.max_sms_per_month,
        sp.max_push_notifications_per_month,
        sp.max_couriers,
        sp.max_team_members,
        sp.max_shops,
        sp.features
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.plan_id
      WHERE us.user_id = $1
        AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1
    `, [userId]);

    if (!result) {
      return null;
    }

    return {
      limits: {
        plan_id: result.plan_id,
        plan_name: result.plan_name,
        plan_slug: result.plan_slug,
        tier: result.tier,
        max_orders_per_month: result.max_orders_per_month,
        max_emails_per_month: result.max_emails_per_month,
        max_sms_per_month: result.max_sms_per_month,
        max_push_notifications_per_month: result.max_push_notifications_per_month,
        max_couriers: result.max_couriers,
        max_team_members: result.max_team_members,
        max_shops: result.max_shops,
        features: result.features,
      },
      usage: {
        subscription_id: result.subscription_id,
        orders_used_this_month: result.orders_used_this_month,
        emails_sent_this_month: result.emails_sent_this_month,
        sms_sent_this_month: result.sms_sent_this_month,
        push_notifications_sent_this_month: result.push_notifications_sent_this_month,
        current_period_start: result.current_period_start,
        current_period_end: result.current_period_end,
        status: result.status,
      },
      hasActiveSubscription: true,
    };
  } catch (error) {
    logger.error('[SubscriptionLimits] Error getting subscription', { userId, error });
    return null;
  }
}

/**
 * Check if user can create an order
 */
export async function canCreateOrder(userId: string): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    // No subscription - allow with warning (or enforce based on business rules)
    return { allowed: true, reason: 'No active subscription' };
  }

  const { limits, usage } = subscription;

  // Check if unlimited (null means unlimited)
  if (limits.max_orders_per_month === null) {
    return { allowed: true, remaining: -1 }; // -1 indicates unlimited
  }

  // Check if limit exceeded
  if (usage.orders_used_this_month >= limits.max_orders_per_month) {
    return {
      allowed: false,
      reason: `Order limit reached (${limits.max_orders_per_month}/${limits.max_orders_per_month}). Upgrade your plan to create more orders.`,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: limits.max_orders_per_month - usage.orders_used_this_month,
  };
}

/**
 * Check if user can send an email
 */
export async function canSendEmail(userId: string): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return { allowed: true, reason: 'No active subscription' };
  }

  const { limits, usage } = subscription;

  if (limits.max_emails_per_month === null) {
    return { allowed: true, remaining: -1 };
  }

  if (usage.emails_sent_this_month >= limits.max_emails_per_month) {
    return {
      allowed: false,
      reason: `Email limit reached (${limits.max_emails_per_month}/${limits.max_emails_per_month}). Upgrade your plan to send more emails.`,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: limits.max_emails_per_month - usage.emails_sent_this_month,
  };
}

/**
 * Check if user can send SMS
 */
export async function canSendSMS(userId: string): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return { allowed: true, reason: 'No active subscription' };
  }

  const { limits, usage } = subscription;

  if (limits.max_sms_per_month === null) {
    return { allowed: true, remaining: -1 };
  }

  if (usage.sms_sent_this_month >= limits.max_sms_per_month) {
    return {
      allowed: false,
      reason: `SMS limit reached (${limits.max_sms_per_month}/${limits.max_sms_per_month}). Upgrade your plan to send more SMS.`,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: limits.max_sms_per_month - usage.sms_sent_this_month,
  };
}

/**
 * Check if merchant can add more couriers
 */
export async function canAddCourier(userId: string): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return { allowed: true, reason: 'No active subscription' };
  }

  const { limits } = subscription;

  if (limits.max_couriers === null) {
    return { allowed: true, remaining: -1 };
  }

  // Get current courier count
  const courierCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM couriers WHERE user_id = $1',
    [userId]
  );

  const currentCount = parseInt(courierCount?.count || '0', 10);

  if (currentCount >= limits.max_couriers) {
    return {
      allowed: false,
      reason: `Courier limit reached (${currentCount}/${limits.max_couriers}). Upgrade your plan to add more couriers.`,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: limits.max_couriers - currentCount,
  };
}

/**
 * Check if courier can add more team members
 */
export async function canAddTeamMember(userId: string): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return { allowed: true, reason: 'No active subscription' };
  }

  const { limits } = subscription;

  if (limits.max_team_members === null) {
    return { allowed: true, remaining: -1 };
  }

  // Get current team member count
  const teamCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM team_members WHERE user_id = $1',
    [userId]
  );

  const currentCount = parseInt(teamCount?.count || '0', 10);

  if (currentCount >= limits.max_team_members) {
    return {
      allowed: false,
      reason: `Team member limit reached (${currentCount}/${limits.max_team_members}). Upgrade your plan to add more team members.`,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: limits.max_team_members - currentCount,
  };
}

/**
 * Increment order usage counter
 */
export async function incrementOrderUsage(userId: string): Promise<void> {
  try {
    await queryOne(`
      UPDATE user_subscriptions
      SET orders_used_this_month = orders_used_this_month + 1,
          updated_at = NOW()
      WHERE user_id = $1
        AND status = 'active'
    `, [userId]);

    logger.info('[SubscriptionLimits] Order usage incremented', { userId });
  } catch (error) {
    logger.error('[SubscriptionLimits] Error incrementing order usage', { userId, error });
  }
}

/**
 * Increment email usage counter
 */
export async function incrementEmailUsage(userId: string, count: number = 1): Promise<void> {
  try {
    await queryOne(`
      UPDATE user_subscriptions
      SET emails_sent_this_month = emails_sent_this_month + $2,
          updated_at = NOW()
      WHERE user_id = $1
        AND status = 'active'
    `, [userId, count]);

    logger.info('[SubscriptionLimits] Email usage incremented', { userId, count });
  } catch (error) {
    logger.error('[SubscriptionLimits] Error incrementing email usage', { userId, error });
  }
}

/**
 * Increment SMS usage counter
 */
export async function incrementSMSUsage(userId: string, count: number = 1): Promise<void> {
  try {
    await queryOne(`
      UPDATE user_subscriptions
      SET sms_sent_this_month = sms_sent_this_month + $2,
          updated_at = NOW()
      WHERE user_id = $1
        AND status = 'active'
    `, [userId, count]);

    logger.info('[SubscriptionLimits] SMS usage incremented', { userId, count });
  } catch (error) {
    logger.error('[SubscriptionLimits] Error incrementing SMS usage', { userId, error });
  }
}

/**
 * Get usage summary for dashboard
 */
export async function getUsageSummary(userId: string) {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return {
      hasSubscription: false,
      message: 'No active subscription',
    };
  }

  const { limits, usage } = subscription;

  return {
    hasSubscription: true,
    plan: {
      name: limits.plan_name,
      tier: limits.tier,
    },
    period: {
      start: usage.current_period_start,
      end: usage.current_period_end,
    },
    usage: {
      orders: {
        used: usage.orders_used_this_month,
        limit: limits.max_orders_per_month,
        percentage: limits.max_orders_per_month
          ? Math.round((usage.orders_used_this_month / limits.max_orders_per_month) * 100)
          : 0,
        unlimited: limits.max_orders_per_month === null,
      },
      emails: {
        used: usage.emails_sent_this_month,
        limit: limits.max_emails_per_month,
        percentage: limits.max_emails_per_month
          ? Math.round((usage.emails_sent_this_month / limits.max_emails_per_month) * 100)
          : 0,
        unlimited: limits.max_emails_per_month === null,
      },
      sms: {
        used: usage.sms_sent_this_month,
        limit: limits.max_sms_per_month,
        percentage: limits.max_sms_per_month
          ? Math.round((usage.sms_sent_this_month / limits.max_sms_per_month) * 100)
          : 0,
        unlimited: limits.max_sms_per_month === null,
      },
    },
    features: limits.features,
  };
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(userId: string, featureName: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  const { limits } = subscription;
  return limits.features?.[featureName] === true;
}
