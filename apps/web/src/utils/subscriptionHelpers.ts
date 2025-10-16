/**
 * Subscription Helper Utilities
 * Provides functions to check subscription limits and features
 */

export interface SubscriptionLimits {
  max_couriers: number | null;
  max_shops: number | null;
  max_orders_per_month: number | null;
  max_team_members: number | null;
  has_api_access: boolean;
  has_advanced_analytics: boolean;
  has_custom_templates: boolean;
  has_white_label: boolean;
  plan_name: string;
  tier: number;
}

export interface SubscriptionUsage {
  couriers_selected: number;
  shops_created: number;
  can_add_courier: boolean;
}

export interface SubscriptionInfo {
  subscription: SubscriptionLimits;
  usage: SubscriptionUsage;
}

/**
 * Subscription tier definitions
 */
export const SUBSCRIPTION_TIERS = {
  FREE: 0,
  STARTER: 1,
  PROFESSIONAL: 2,
  ENTERPRISE: 3,
} as const;

/**
 * Merchant subscription plans
 */
export const MERCHANT_PLANS = {
  FREE: {
    name: 'Free',
    tier: 0,
    max_couriers: 2,
    max_shops: 1,
    max_orders_per_month: 50,
    price_monthly: 0,
  },
  STARTER: {
    name: 'Starter',
    tier: 1,
    max_couriers: 5,
    max_shops: 1,
    max_orders_per_month: 100,
    price_monthly: 29,
  },
  PROFESSIONAL: {
    name: 'Professional',
    tier: 2,
    max_couriers: 20,
    max_shops: 3,
    max_orders_per_month: 500,
    price_monthly: 79,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    tier: 3,
    max_couriers: null, // Unlimited
    max_shops: null, // Unlimited
    max_orders_per_month: null, // Unlimited
    price_monthly: 199,
  },
} as const;

/**
 * Courier subscription plans
 */
export const COURIER_PLANS = {
  FREE: {
    name: 'Free',
    tier: 0,
    max_team_members: 1,
    max_orders_per_month: 25,
    price_monthly: 0,
  },
  INDIVIDUAL: {
    name: 'Individual',
    tier: 1,
    max_team_members: 1,
    max_orders_per_month: 50,
    price_monthly: 19,
  },
  PROFESSIONAL: {
    name: 'Professional',
    tier: 2,
    max_team_members: 3,
    max_orders_per_month: 200,
    price_monthly: 49,
  },
  FLEET: {
    name: 'Fleet',
    tier: 3,
    max_team_members: null, // Unlimited
    max_orders_per_month: null, // Unlimited
    price_monthly: 149,
  },
} as const;

/**
 * Check if user can access a feature based on subscription
 */
export const canAccessFeature = (
  subscriptionInfo: SubscriptionInfo | null,
  feature: keyof SubscriptionLimits
): boolean => {
  if (!subscriptionInfo) return false;
  
  const value = subscriptionInfo.subscription[feature];
  
  // Boolean features
  if (typeof value === 'boolean') {
    return value;
  }
  
  return false;
};

/**
 * Check if user has reached a limit
 */
export const hasReachedLimit = (
  current: number,
  max: number | null
): boolean => {
  if (max === null) return false; // Unlimited
  return current >= max;
};

/**
 * Get usage percentage
 */
export const getUsagePercentage = (
  current: number,
  max: number | null
): number => {
  if (max === null) return 0; // Unlimited
  return Math.min((current / max) * 100, 100);
};

/**
 * Get usage color based on percentage
 */
export const getUsageColor = (
  current: number,
  max: number | null
): 'success' | 'warning' | 'error' => {
  const percentage = getUsagePercentage(current, max);
  
  if (percentage >= 100) return 'error';
  if (percentage >= 80) return 'warning';
  return 'success';
};

/**
 * Format limit display (null = unlimited)
 */
export const formatLimit = (limit: number | null): string => {
  if (limit === null) return 'Unlimited';
  return limit.toString();
};

/**
 * Check if user can add more items
 */
export const canAddMore = (
  current: number,
  max: number | null
): boolean => {
  if (max === null) return true; // Unlimited
  return current < max;
};

/**
 * Get remaining slots
 */
export const getRemainingSlots = (
  current: number,
  max: number | null
): number | null => {
  if (max === null) return null; // Unlimited
  return Math.max(0, max - current);
};

/**
 * Check if subscription is enterprise tier
 */
export const isEnterpriseTier = (tier: number): boolean => {
  return tier >= SUBSCRIPTION_TIERS.ENTERPRISE;
};

/**
 * Check if subscription is professional or higher
 */
export const isProfessionalOrHigher = (tier: number): boolean => {
  return tier >= SUBSCRIPTION_TIERS.PROFESSIONAL;
};

/**
 * Get tier badge color
 */
export const getTierBadgeColor = (tier: number): string => {
  switch (tier) {
    case SUBSCRIPTION_TIERS.FREE:
      return '#9e9e9e';
    case SUBSCRIPTION_TIERS.STARTER:
      return '#2196f3';
    case SUBSCRIPTION_TIERS.PROFESSIONAL:
      return '#9c27b0';
    case SUBSCRIPTION_TIERS.ENTERPRISE:
      return '#ff9800';
    default:
      return '#9e9e9e';
  }
};

/**
 * Get tier display name
 */
export const getTierDisplayName = (tier: number): string => {
  switch (tier) {
    case SUBSCRIPTION_TIERS.FREE:
      return 'Free';
    case SUBSCRIPTION_TIERS.STARTER:
      return 'Starter';
    case SUBSCRIPTION_TIERS.PROFESSIONAL:
      return 'Professional';
    case SUBSCRIPTION_TIERS.ENTERPRISE:
      return 'Enterprise';
    default:
      return 'Unknown';
  }
};

/**
 * Get upgrade message based on limit type
 */
export const getUpgradeMessage = (limitType: string): string => {
  const messages: Record<string, string> = {
    couriers: 'Upgrade your plan to add more couriers to your checkout',
    shops: 'Upgrade your plan to manage multiple shops',
    orders: 'Upgrade your plan to process more orders per month',
    team_members: 'Upgrade your plan to add more team members',
    api_access: 'Upgrade to Professional or Enterprise for API access',
    advanced_analytics: 'Upgrade to Professional or Enterprise for advanced analytics',
    custom_templates: 'Upgrade to Professional or Enterprise for custom templates',
    white_label: 'Upgrade to Enterprise for white-label features',
  };
  
  return messages[limitType] || 'Upgrade your plan to unlock this feature';
};

/**
 * Filter data based on subscription limits
 * Used to hide/show data based on user's subscription tier
 */
export const filterDataBySubscription = <T>(
  data: T[],
  subscriptionInfo: SubscriptionInfo | null,
  filterType: 'basic' | 'advanced' | 'premium'
): T[] => {
  if (!subscriptionInfo) {
    return filterType === 'basic' ? data : [];
  }
  
  const { tier } = subscriptionInfo.subscription;
  
  switch (filterType) {
    case 'basic':
      return data; // All tiers can see basic data
    case 'advanced':
      return tier >= SUBSCRIPTION_TIERS.PROFESSIONAL ? data : [];
    case 'premium':
      return tier >= SUBSCRIPTION_TIERS.ENTERPRISE ? data : [];
    default:
      return data;
  }
};

/**
 * Check if user should see upgrade prompts
 */
export const shouldShowUpgradePrompt = (
  subscriptionInfo: SubscriptionInfo | null,
  feature: string
): boolean => {
  if (!subscriptionInfo) return true;
  
  const { tier } = subscriptionInfo.subscription;
  
  // Free tier users see all upgrade prompts
  if (tier === SUBSCRIPTION_TIERS.FREE) return true;
  
  // Starter tier users see prompts for professional+ features
  if (tier === SUBSCRIPTION_TIERS.STARTER) {
    return ['advanced_analytics', 'api_access', 'white_label'].includes(feature);
  }
  
  // Professional tier users only see prompts for enterprise features
  if (tier === SUBSCRIPTION_TIERS.PROFESSIONAL) {
    return ['white_label', 'dedicated_manager'].includes(feature);
  }
  
  // Enterprise users don't see upgrade prompts
  return false;
};

/**
 * Get recommended plan based on usage
 */
export const getRecommendedPlan = (
  userRole: 'merchant' | 'courier',
  currentUsage: {
    couriers?: number;
    shops?: number;
    orders?: number;
    team_members?: number;
  }
): string => {
  if (userRole === 'merchant') {
    const { couriers = 0, shops = 0, orders = 0 } = currentUsage;
    
    if (couriers > 20 || shops > 3 || orders > 500) {
      return 'Enterprise';
    }
    if (couriers > 5 || shops > 1 || orders > 100) {
      return 'Professional';
    }
    if (couriers > 2 || orders > 50) {
      return 'Starter';
    }
    return 'Free';
  } else {
    const { team_members = 0, orders = 0 } = currentUsage;
    
    if (team_members > 3 || orders > 200) {
      return 'Fleet';
    }
    if (team_members > 1 || orders > 50) {
      return 'Professional';
    }
    if (orders > 25) {
      return 'Individual';
    }
    return 'Free';
  }
};

export default {
  canAccessFeature,
  hasReachedLimit,
  getUsagePercentage,
  getUsageColor,
  formatLimit,
  canAddMore,
  getRemainingSlots,
  isEnterpriseTier,
  isProfessionalOrHigher,
  getTierBadgeColor,
  getTierDisplayName,
  getUpgradeMessage,
  filterDataBySubscription,
  shouldShowUpgradePrompt,
  getRecommendedPlan,
};
