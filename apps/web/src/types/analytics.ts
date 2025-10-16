// Analytics and marketplace types
export type TimeFilter = 'day' | 'week' | 'month' | '6months' | 'year' | 'custom';
export type SubscriptionTier = 'tier1' | 'tier2' | 'tier3';

export interface AnalyticsFilters {
  timeRange: TimeFilter;
  customStartDate?: string;
  customEndDate?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  courierIds?: string[];
  storeIds?: string[];
}

export interface TrustScoreMetrics {
  avgRating: number;
  completionRate: number;
  onTimeRate: number;
  responseTime: number;
  customerSatisfaction: number;
  issueResolutionRate: number;
  deliveryAttempts: number;
  lastMilePerformance: number;
  overallTrustScore: number;
}

export interface PerformanceData {
  date: string;
  metrics: TrustScoreMetrics;
  orderVolume: number;
  revenue?: number;
}

export interface CompetitorData {
  anonymizedId: string;
  trustScore: number;
  completionRate: number;
  onTimeRate: number;
  avgDeliveryTime: number;
  customerSatisfaction: number;
  marketShare: number;
  priceRange: {
    min: number;
    max: number;
    avg: number;
  };
  isUnlocked: boolean;
  unlockPrice: number;
}

export interface MarketAnalysis {
  marketId: string;
  marketName: string;
  city: string;
  country: string;
  totalCouriers: number;
  avgTrustScore: number;
  avgDeliveryTime: number;
  avgPrice: number;
  demandLevel: 'low' | 'medium' | 'high';
  competitorData: CompetitorData[];
}

export interface CourierLead {
  leadId: string;
  merchantId: string;
  merchantName: string;
  estimatedOrderVolume: number;
  avgOrderValue: number;
  deliveryAreas: string[];
  requirements: string[];
  budget: {
    min: number;
    max: number;
  };
  orderStatistics: {
    totalOrders: number;
    monthlyOrders: number;
    avgOrdersPerDay: number;
    peakOrderHours: string[];
    orderGrowthRate: number;
  };
  isAnonymized: boolean;
  unlockPrice: number;
  dynamicPricing: {
    basePrice: number;
    volumeMultiplier: number;
    finalPrice: number;
  };
  createdAt: string;
}

export interface SubscriptionLimits {
  tier: SubscriptionTier;
  maxMarkets: number;
  maxCouriers: number;
  competitorAnalysis: boolean;
  advancedAnalytics: boolean;
  leadGeneration: boolean;
  customReports: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface PremiumFeature {
  featureId: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  category: 'analytics' | 'marketplace' | 'insights' | 'automation';
  requiredTier: SubscriptionTier;
  isActive: boolean;
}
