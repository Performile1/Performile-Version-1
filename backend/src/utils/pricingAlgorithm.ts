// Dynamic pricing algorithm for lead generation based on order volume
export interface PricingFactors {
  basePrice: number;
  orderVolume: number;
  orderGrowthRate: number;
  avgOrderValue: number;
  marketDemand: 'low' | 'medium' | 'high';
  merchantTier: 'startup' | 'established' | 'enterprise';
}

export interface DynamicPricing {
  basePrice: number;
  volumeMultiplier: number;
  growthMultiplier: number;
  demandMultiplier: number;
  tierMultiplier: number;
  finalPrice: number;
  breakdown: {
    volumeAdjustment: number;
    growthAdjustment: number;
    demandAdjustment: number;
    tierAdjustment: number;
  };
}

export class LeadPricingAlgorithm {
  private static readonly BASE_PRICE = 50;
  private static readonly MAX_PRICE = 299;
  private static readonly MIN_PRICE = 29;

  /**
   * Calculate dynamic pricing for leads based on merchant order volume and characteristics
   */
  static calculateLeadPrice(factors: PricingFactors): DynamicPricing {
    const { basePrice, orderVolume, orderGrowthRate, avgOrderValue, marketDemand, merchantTier } = factors;

    // Volume-based multiplier (higher volume = higher price)
    const volumeMultiplier = this.calculateVolumeMultiplier(orderVolume);
    
    // Growth rate multiplier (growing businesses are more valuable)
    const growthMultiplier = this.calculateGrowthMultiplier(orderGrowthRate);
    
    // Market demand multiplier
    const demandMultiplier = this.calculateDemandMultiplier(marketDemand);
    
    // Merchant tier multiplier (enterprise clients pay more)
    const tierMultiplier = this.calculateTierMultiplier(merchantTier);

    // Calculate adjustments
    const volumeAdjustment = (volumeMultiplier - 1) * basePrice;
    const growthAdjustment = (growthMultiplier - 1) * basePrice;
    const demandAdjustment = (demandMultiplier - 1) * basePrice;
    const tierAdjustment = (tierMultiplier - 1) * basePrice;

    // Calculate final price
    let finalPrice = basePrice * volumeMultiplier * growthMultiplier * demandMultiplier * tierMultiplier;
    
    // Apply bounds
    finalPrice = Math.max(this.MIN_PRICE, Math.min(this.MAX_PRICE, finalPrice));
    
    // Round to nearest $5
    finalPrice = Math.round(finalPrice / 5) * 5;

    return {
      basePrice,
      volumeMultiplier,
      growthMultiplier,
      demandMultiplier,
      tierMultiplier,
      finalPrice,
      breakdown: {
        volumeAdjustment,
        growthAdjustment,
        demandAdjustment,
        tierAdjustment
      }
    };
  }

  /**
   * Volume-based pricing multiplier
   * 0-100 orders/month: 0.8x
   * 100-500 orders/month: 1.0x
   * 500-1000 orders/month: 1.3x
   * 1000-2000 orders/month: 1.6x
   * 2000+ orders/month: 2.0x
   */
  private static calculateVolumeMultiplier(monthlyOrders: number): number {
    if (monthlyOrders < 100) return 0.8;
    if (monthlyOrders < 500) return 1.0;
    if (monthlyOrders < 1000) return 1.3;
    if (monthlyOrders < 2000) return 1.6;
    return 2.0;
  }

  /**
   * Growth rate multiplier
   * Negative growth: 0.7x
   * 0-5% growth: 1.0x
   * 5-15% growth: 1.2x
   * 15-30% growth: 1.4x
   * 30%+ growth: 1.6x
   */
  private static calculateGrowthMultiplier(growthRate: number): number {
    if (growthRate < 0) return 0.7;
    if (growthRate < 5) return 1.0;
    if (growthRate < 15) return 1.2;
    if (growthRate < 30) return 1.4;
    return 1.6;
  }

  /**
   * Market demand multiplier
   */
  private static calculateDemandMultiplier(demand: string): number {
    switch (demand) {
      case 'low': return 0.9;
      case 'medium': return 1.0;
      case 'high': return 1.3;
      default: return 1.0;
    }
  }

  /**
   * Merchant tier multiplier
   */
  private static calculateTierMultiplier(tier: string): number {
    switch (tier) {
      case 'startup': return 0.9;
      case 'established': return 1.0;
      case 'enterprise': return 1.4;
      default: return 1.0;
    }
  }

  /**
   * Get pricing tier description for UI display
   */
  static getPricingTierDescription(monthlyOrders: number): string {
    if (monthlyOrders < 100) return 'Small Business';
    if (monthlyOrders < 500) return 'Growing Business';
    if (monthlyOrders < 1000) return 'Established Business';
    if (monthlyOrders < 2000) return 'Large Business';
    return 'Enterprise Client';
  }

  /**
   * Calculate potential revenue for courier from lead
   */
  static calculatePotentialRevenue(
    monthlyOrders: number, 
    avgOrderValue: number, 
    deliveryFeePercentage: number = 0.15
  ): number {
    return monthlyOrders * avgOrderValue * deliveryFeePercentage;
  }
}
