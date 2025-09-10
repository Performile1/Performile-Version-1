import { Request, Response } from 'express';
import { Pool } from 'pg';
import { AuthenticatedRequest, StrictAuthenticatedRequest } from '../types';
import pool from '../config/database';
import { AppError } from '../types';
import { validationResult } from 'express-validator';
import Joi from 'joi';
import logger from '../utils/logger';


// Validation schemas
const analyticsFiltersSchema = Joi.object({
  timeRange: Joi.string().valid('day', 'week', 'month', '6months', 'year', 'custom').required(),
  customStartDate: Joi.date().when('timeRange', { is: 'custom', then: Joi.required() }),
  customEndDate: Joi.date().when('timeRange', { is: 'custom', then: Joi.required() }),
  city: Joi.string().optional(),
  postalCode: Joi.string().optional(),
  country: Joi.string().optional(),
  courierIds: Joi.array().items(Joi.string().uuid()).optional(),
  storeIds: Joi.array().items(Joi.string().uuid()).optional()
});

export class AnalyticsController {
  // Get performance analytics data
  async getPerformanceAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, value } = analyticsFiltersSchema.validate(req.query);
      if (error) {
        res.status(400).json({ error: error.details[0]?.message || 'Validation error' });
        return;
      }

      const { timeRange, customStartDate, customEndDate, city, country } = value;
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Build date filter
      let dateFilter = '';
      switch (timeRange) {
        case 'day':
          dateFilter = "AND o.created_at >= CURRENT_DATE";
          break;
        case 'week':
          dateFilter = "AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case 'month':
          dateFilter = "AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        case '6months':
          dateFilter = "AND o.created_at >= CURRENT_DATE - INTERVAL '6 months'";
          break;
        case 'year':
          dateFilter = "AND o.created_at >= CURRENT_DATE - INTERVAL '1 year'";
          break;
        case 'custom':
          dateFilter = `AND o.created_at BETWEEN '${customStartDate}' AND '${customEndDate}'`;
          break;
      }

      // Geographic filters
      let geoFilter = '';
      if (city) geoFilter += ` AND o.delivery_city ILIKE '%${city}%'`;
      if (country) geoFilter += ` AND o.delivery_country ILIKE '%${country}%'`;

      const query = `
        SELECT 
          DATE_TRUNC('${timeRange === 'year' ? 'month' : 'day'}', o.created_at) as date,
          COUNT(o.order_id) as order_volume,
          AVG(r.rating) as avg_rating,
          COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) * 100.0 / COUNT(o.order_id) as completion_rate,
          COUNT(CASE WHEN o.delivered_at <= o.expected_delivery_time THEN 1 END) * 100.0 / 
            COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as on_time_rate,
          AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at))/60) as avg_delivery_time,
          SUM(o.total_amount) as revenue
        FROM Orders o
        LEFT JOIN Reviews r ON o.order_id = r.order_id
        WHERE (o.courier_id = $1 OR o.merchant_id = $1)
        ${dateFilter}
        ${geoFilter}
        GROUP BY DATE_TRUNC('${timeRange === 'year' ? 'month' : 'day'}', o.created_at)
        ORDER BY date ASC
      `;

      const result = await pool.query(query, [userId]);
      
      res.json({
        success: true,
        data: result.rows,
        filters: value
      });

    } catch (error) {
      logger.error('Error fetching performance analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  }

  // Get competitor analysis (subscription-gated)
  async getCompetitorAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const { marketId } = req.params;

      // Check subscription tier and feature access
      const subscriptionCheck = await pool.query(`
        SELECT u.subscription_tier, 
               EXISTS(
                 SELECT 1 FROM UserPremiumFeatures upf 
                 JOIN PremiumFeatures pf ON upf.feature_id = pf.feature_id
                 WHERE upf.user_id = $1 AND pf.feature_name = 'Market Intelligence Pro'
                 AND upf.is_active = true AND upf.expires_at > CURRENT_TIMESTAMP
               ) as has_competitor_access
        FROM Users u WHERE u.user_id = $1
      `, [userId]);

      const { subscription_tier, has_competitor_access } = subscriptionCheck.rows[0];

      if (subscription_tier === 'tier1' && !has_competitor_access) {
        res.status(403).json({ 
          error: 'Competitor analysis requires Tier 2+ subscription or Market Intelligence Pro feature',
          upgrade_required: true 
        });
        return;
      }

      // Get competitor data
      const competitorQuery = `
        SELECT 
          ca.anonymized_courier_id,
          ca.trust_score,
          ca.completion_rate,
          ca.on_time_rate,
          ca.avg_delivery_time,
          ca.customer_satisfaction,
          ca.market_share,
          ca.price_range_min,
          ca.price_range_max,
          ca.price_range_avg,
          false as is_unlocked,
          99.00 as unlock_price
        FROM CompetitorAnalysis ca
        WHERE ca.market_id = $1
        ORDER BY ca.trust_score DESC
        LIMIT 10
      `;

      const competitors = await pool.query(competitorQuery, [marketId]);
      
      res.json({
        success: true,
        data: competitors.rows,
        subscription_tier,
        has_premium_access: has_competitor_access
      });

    } catch (error) {
      logger.error('Error fetching competitor analysis:', error);
      res.status(500).json({ error: 'Failed to fetch competitor data' });
    }
  }

  // Get available markets based on subscription
  async getAvailableMarkets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check subscription limits
      const limitsCheck = await pool.query(`
        SELECT check_subscription_limits($1, 'markets') as available_markets,
               u.subscription_tier
        FROM Users u WHERE u.user_id = $1
      `, [userId]);

      const { available_markets, subscription_tier } = limitsCheck.rows[0];

      // Get accessible markets
      const marketsQuery = `
        SELECT m.*, 
               EXISTS(SELECT 1 FROM UserMarketAccess uma 
                     WHERE uma.user_id = $1 AND uma.market_id = m.market_id) as has_access
        FROM Markets m
        WHERE m.is_active = true
        ORDER BY m.market_name
      `;

      const markets = await pool.query(marketsQuery, [userId]);

      res.json({
        success: true,
        data: markets.rows,
        subscription_tier,
        available_markets,
        limits: {
          tier1: 1,
          tier2: 3,
          tier3: 8
        }
      });

    } catch (error) {
      logger.error('Error fetching available markets:', error);
      res.status(500).json({ error: 'Failed to fetch markets data' });
    }
  }

  // Merchant: Get courier marketplace
  async getCourierMarketplace(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const { marketId } = req.params;

      if (req.user!.user_role !== 'merchant') {
        res.status(403).json({ error: 'Access denied: Merchants only' });
        return;
      }

      // Get available couriers in market (anonymized)
      const couriersQuery = `
        SELECT 
          'ANON_' || substr(md5(u.user_id::text || $2::text), 1, 8) as anonymized_id,
          ts.trust_score,
          COUNT(o.order_id) as total_orders,
          AVG(CASE WHEN o.order_status = 'delivered' THEN 100.0 ELSE 0.0 END) as completion_rate,
          AVG(r.rating) as avg_rating,
          false as is_unlocked,
          29.00 as unlock_price
        FROM Users u
        JOIN TrustScoreCache ts ON u.user_id = ts.user_id
        LEFT JOIN Orders o ON u.user_id = o.courier_id
        LEFT JOIN Reviews r ON o.order_id = r.order_id
        WHERE u.user_role = 'courier'
        AND u.user_id != $1
        AND EXISTS(
          SELECT 1 FROM Orders sub_o 
          WHERE sub_o.courier_id = u.user_id 
          AND sub_o.delivery_city IN (
            SELECT unnest(postal_codes) FROM Markets WHERE market_id = $2
          )
        )
        GROUP BY u.user_id, ts.trust_score
        HAVING COUNT(o.order_id) > 5
        ORDER BY ts.trust_score DESC
        LIMIT 20
      `;

      const couriers = await pool.query(couriersQuery, [userId, marketId]);

      res.json({
        success: true,
        data: couriers.rows,
        marketplace_access: true
      });

    } catch (error) {
      logger.error('Error fetching courier marketplace:', error);
      res.status(500).json({ error: 'Failed to fetch courier marketplace' });
    }
  }

  // Courier: Get merchant leads with order statistics and dynamic pricing
  async getMerchantLeads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (req.user!.user_role !== 'courier') {
        res.status(403).json({ error: 'Access denied: Couriers only' });
        return;
      }

      const leadsQuery = `
        SELECT 
          cl.lead_id,
          CASE 
            WHEN cl.is_anonymized THEN 'Anonymous Merchant'
            ELSE u.company_name 
          END as merchant_name,
          cl.estimated_order_volume,
          cl.avg_order_value,
          cl.delivery_areas,
          cl.budget_min,
          cl.budget_max,
          cl.unlock_price,
          cl.is_anonymized,
          cl.created_at,
          cl.expires_at,
          -- Order statistics from merchant's historical data
          COALESCE(order_stats.total_orders, 0) as total_orders,
          COALESCE(order_stats.monthly_orders, cl.estimated_order_volume) as monthly_orders,
          COALESCE(order_stats.avg_orders_per_day, ROUND(cl.estimated_order_volume / 30.0)) as avg_orders_per_day,
          COALESCE(order_stats.growth_rate, 0) as order_growth_rate,
          -- Dynamic pricing calculation
          CASE 
            WHEN cl.estimated_order_volume < 100 THEN cl.unlock_price * 0.8
            WHEN cl.estimated_order_volume < 500 THEN cl.unlock_price * 1.0
            WHEN cl.estimated_order_volume < 1000 THEN cl.unlock_price * 1.3
            WHEN cl.estimated_order_volume < 2000 THEN cl.unlock_price * 1.6
            ELSE cl.unlock_price * 2.0
          END as dynamic_price,
          EXISTS(SELECT 1 FROM LeadPurchases lp WHERE lp.lead_id = cl.lead_id AND lp.courier_id = $1) as is_purchased
        FROM CourierLeads cl
        JOIN Users u ON cl.merchant_id = u.user_id
        LEFT JOIN (
          SELECT 
            merchant_id,
            COUNT(order_id) as total_orders,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as monthly_orders,
            ROUND(COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) / 30.0) as avg_orders_per_day,
            CASE 
              WHEN COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) > 0
              THEN ROUND(
                ((COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::FLOAT / 
                  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END)) - 1) * 100, 1
              )
              ELSE 0
            END as growth_rate
          FROM Orders
          WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
          GROUP BY merchant_id
        ) order_stats ON cl.merchant_id = order_stats.merchant_id
        WHERE cl.status = 'active'
        AND cl.expires_at > CURRENT_TIMESTAMP
        ORDER BY cl.created_at DESC
        LIMIT 50
      `;

      const leads = await pool.query(leadsQuery, [userId]);

      // Format the response with order statistics and pricing
      const formattedLeads = leads.rows.map((lead: any) => ({
        ...lead,
        orderStatistics: {
          totalOrders: lead.total_orders,
          monthlyOrders: lead.monthly_orders,
          avgOrdersPerDay: lead.avg_orders_per_day,
          peakOrderHours: ['11:00-13:00', '17:00-20:00'], // Would be calculated from actual data
          orderGrowthRate: lead.order_growth_rate
        },
        dynamicPricing: {
          basePrice: lead.unlock_price,
          volumeMultiplier: lead.estimated_order_volume >= 1000 ? 1.6 : 1.0,
          finalPrice: Math.round(lead.dynamic_price)
        }
      }));

      res.json({
        success: true,
        data: formattedLeads
      });

    } catch (error) {
      logger.error('Error fetching merchant leads:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  }

  // Purchase lead unlock
  async purchaseLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const { leadId } = req.params;

      if (req.user!.user_role !== 'courier') {
        res.status(403).json({ error: 'Access denied: Couriers only' });
        return;
      }

      // Check if already purchased
      const existingPurchase = await pool.query(
        'SELECT * FROM LeadPurchases WHERE lead_id = $1 AND courier_id = $2',
        [leadId, userId]
      );

      if (existingPurchase.rows.length > 0) {
        res.status(400).json({ error: 'Lead already purchased' });
        return;
      }

      // Get lead details and price
      const leadQuery = await pool.query(`
        SELECT cl.*, u.company_name, u.email, u.phone
        FROM CourierLeads cl
        JOIN Users u ON cl.merchant_id = u.user_id
        WHERE cl.lead_id = $1 AND cl.status = 'active'
      `, [leadId]);

      if (leadQuery.rows.length === 0) {
        res.status(404).json({ error: 'Lead not found or expired' });
        return;
      }

      const lead = leadQuery.rows[0];

      // Record purchase
      await pool.query(`
        INSERT INTO LeadPurchases (lead_id, courier_id, amount_paid)
        VALUES ($1, $2, $3)
      `, [leadId, userId, lead.unlock_price]);

      // Return unlocked lead data
      res.json({
        success: true,
        data: {
          ...lead,
          is_unlocked: true,
          merchant_contact: {
            company_name: lead.company_name,
            email: lead.email,
            phone: lead.phone
          }
        }
      });

      logger.info(`Lead purchased: ${leadId} by courier ${userId}`);

    } catch (error) {
      logger.error('Error purchasing lead:', error);
      res.status(500).json({ error: 'Failed to purchase lead' });
    }
  }

  // Get subscription limits and usage
  async getSubscriptionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const statusQuery = await pool.query(`
        SELECT 
          u.subscription_tier,
          u.subscription_expires_at,
          check_subscription_limits(u.user_id, 'markets') as available_markets,
          check_subscription_limits(u.user_id, 'couriers') as available_couriers,
          COUNT(DISTINCT uma.market_id) as current_markets,
          COUNT(DISTINCT upf.feature_id) as active_premium_features
        FROM Users u
        LEFT JOIN UserMarketAccess uma ON u.user_id = uma.user_id 
          AND (uma.expires_at IS NULL OR uma.expires_at > CURRENT_TIMESTAMP)
        LEFT JOIN UserPremiumFeatures upf ON u.user_id = upf.user_id 
          AND upf.is_active = true AND upf.expires_at > CURRENT_TIMESTAMP
        WHERE u.user_id = $1
        GROUP BY u.user_id, u.subscription_tier, u.subscription_expires_at
      `, [userId]);

      const premiumFeaturesQuery = await pool.query(`
        SELECT pf.*, upf.purchased_at, upf.expires_at, upf.is_active
        FROM PremiumFeatures pf
        LEFT JOIN UserPremiumFeatures upf ON pf.feature_id = upf.feature_id AND upf.user_id = $1
        WHERE pf.is_active = true
        ORDER BY pf.category, pf.price
      `, [userId]);

      res.json({
        success: true,
        subscription: statusQuery.rows[0],
        premium_features: premiumFeaturesQuery.rows,
        limits: {
          tier1: { markets: 1, couriers: 1 },
          tier2: { markets: 3, couriers: 3 },
          tier3: { markets: 8, couriers: 8 }
        } as const
      });

    } catch (error) {
      logger.error('Error fetching subscription status:', error);
      res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
  }

  // Purchase premium feature
  async purchasePremiumFeature(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const { featureId } = req.params;

      // Check if feature exists and user meets requirements
      const featureQuery = await pool.query(`
        SELECT pf.*, u.subscription_tier
        FROM PremiumFeatures pf, Users u
        WHERE pf.feature_id = $1 AND u.user_id = $2 AND pf.is_active = true
      `, [featureId, userId]);

      if (featureQuery.rows.length === 0) {
        res.status(404).json({ error: 'Feature not found' });
        return;
      }

      const feature = featureQuery.rows[0];

      // Check tier requirements
      const tierOrder: { [key: string]: number } = { tier1: 1, tier2: 2, tier3: 3 };
      const userTier = feature.subscription_tier || 'tier1';
      const requiredTier = feature.required_tier || 'tier1';
      if ((tierOrder[userTier] || 1) > (tierOrder[requiredTier] || 1)) {
        res.status(403).json({ 
          error: `This feature requires ${feature.required_tier} subscription or higher`,
          upgrade_required: true 
        });
        return;
      }

      // Check if already purchased
      const existingPurchase = await pool.query(
        'SELECT * FROM UserPremiumFeatures WHERE user_id = $1 AND feature_id = $2',
        [userId, featureId]
      );

      if (existingPurchase.rows.length > 0) {
        res.status(400).json({ error: 'Feature already purchased' });
        return;
      }

      // Record purchase
      const expiresAt = feature.billing_cycle === 'yearly' 
        ? 'CURRENT_TIMESTAMP + INTERVAL \'1 year\''
        : 'CURRENT_TIMESTAMP + INTERVAL \'1 month\'';

      await pool.query(`
        INSERT INTO UserPremiumFeatures (user_id, feature_id, expires_at)
        VALUES ($1, $2, ${expiresAt})
      `, [userId, featureId]);

      res.json({
        success: true,
        message: 'Premium feature purchased successfully',
        feature: feature.feature_name
      });

      logger.info(`Premium feature purchased: ${feature.feature_name} by user ${userId}`);

    } catch (error) {
      logger.error('Error purchasing premium feature:', error);
      res.status(500).json({ error: 'Failed to purchase premium feature' });
    }
  }
}
