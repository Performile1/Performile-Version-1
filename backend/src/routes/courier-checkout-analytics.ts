import { Router, Request, Response } from 'express';
import database from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/courier/checkout-analytics
 * Get courier's checkout position analytics with subscription limits
 */
router.get(
  '/',
  authenticateToken,
  requireRole(['courier', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.user_id;
      const userRole = (req as any).user?.user_role;
      const { timeRange = '30d', merchantId } = req.query;

      logger.info('[Checkout Analytics] Request', { userId, userRole, timeRange });

      // Get courier_id from user_id
      const courierResult = await database.query(
        'SELECT courier_id FROM couriers WHERE user_id = $1',
        [userId]
      );

      if (courierResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Courier profile not found'
        });
      }

      const courierId = courierResult.rows[0].courier_id;

      // Get subscription limits
      let subscriptionLimits = {
        tier: 0,
        maxMerchants: 999,
        maxDays: 90
      };

      if (userRole !== 'admin') {
        try {
          const subResult = await database.query(
            `SELECT tier, max_merchants_analytics, data_retention_days
             FROM user_subscriptions 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [userId]
          );

          if (subResult.rows.length > 0) {
            subscriptionLimits = {
              tier: subResult.rows[0].tier || 1,
              maxMerchants: subResult.rows[0].max_merchants_analytics || 3,
              maxDays: subResult.rows[0].data_retention_days || 7
            };
          } else {
            // Default Tier 1 limits
            subscriptionLimits = {
              tier: 1,
              maxMerchants: 3,
              maxDays: 7
            };
          }
        } catch (subError) {
          logger.warn('[Checkout Analytics] Subscription query failed', { error: subError });
          // Use default Tier 1 limits
          subscriptionLimits = {
            tier: 1,
            maxMerchants: 3,
            maxDays: 7
          };
        }
      }

      // Calculate date range based on subscription
      const daysMap: { [key: string]: number } = { '7d': 7, '30d': 30, '90d': 90 };
      const requestedDays = daysMap[timeRange as string] || 30;
      const allowedDays = Math.min(requestedDays, subscriptionLimits.maxDays);

      logger.info('[Checkout Analytics] Limits applied', {
        tier: subscriptionLimits.tier,
        requestedDays,
        allowedDays,
        maxMerchants: subscriptionLimits.maxMerchants
      });

      // Get overall statistics
      const statsResult = await database.query(
        `SELECT 
           ROUND(AVG(position_shown), 1) as avg_position,
           COUNT(*) as total_appearances,
           COUNT(CASE WHEN was_selected THEN 1 END) as times_selected,
           ROUND(
             COUNT(CASE WHEN was_selected THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(*), 0) * 100, 
             1
           ) as selection_rate,
           ROUND(AVG(trust_score_at_time), 1) as avg_trust_score,
           ROUND(AVG(price_at_time), 2) as avg_price
         FROM courier_checkout_positions
         WHERE courier_id = $1
         AND created_at >= NOW() - INTERVAL '${allowedDays} days'`,
        [courierId]
      );

      // Get position distribution
      const distributionResult = await database.query(
        `SELECT 
           position_shown,
           COUNT(*) as count,
           ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER() * 100, 1) as percentage
         FROM courier_checkout_positions
         WHERE courier_id = $1
         AND created_at >= NOW() - INTERVAL '${allowedDays} days'
         GROUP BY position_shown
         ORDER BY position_shown`,
        [courierId]
      );

      // Get top merchants (limited by subscription)
      const merchantsResult = await database.query(
        `SELECT 
           ccp.merchant_id,
           u.first_name || ' ' || u.last_name as merchant_name,
           s.store_name,
           ROUND(AVG(ccp.position_shown), 1) as avg_position,
           COUNT(*) as appearances,
           COUNT(CASE WHEN ccp.was_selected THEN 1 END) as selections,
           ROUND(
             COUNT(CASE WHEN ccp.was_selected THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(*), 0) * 100, 
             1
           ) as selection_rate
         FROM courier_checkout_positions ccp
         JOIN users u ON ccp.merchant_id = u.user_id
         LEFT JOIN stores s ON s.owner_user_id = u.user_id
         WHERE ccp.courier_id = $1
         AND ccp.created_at >= NOW() - INTERVAL '${allowedDays} days'
         GROUP BY ccp.merchant_id, u.first_name, u.last_name, s.store_name
         ORDER BY appearances DESC
         LIMIT $2`,
        [courierId, subscriptionLimits.maxMerchants]
      );

      // Get trend data (last 7 days within allowed range)
      const trendDays = Math.min(7, allowedDays);
      const trendResult = await database.query(
        `SELECT 
           DATE(created_at) as date,
           ROUND(AVG(position_shown), 1) as avg_position,
           COUNT(*) as appearances,
           COUNT(CASE WHEN was_selected THEN 1 END) as selections
         FROM courier_checkout_positions
         WHERE courier_id = $1
         AND created_at >= NOW() - INTERVAL '${trendDays} days'
         GROUP BY DATE(created_at)
         ORDER BY date`,
        [courierId]
      );

      // Check if there's more data available with upgrade
      const totalMerchantsResult = await database.query(
        `SELECT COUNT(DISTINCT merchant_id) as total
         FROM courier_checkout_positions
         WHERE courier_id = $1
         AND created_at >= NOW() - INTERVAL '${allowedDays} days'`,
        [courierId]
      );

      const totalMerchants = parseInt(totalMerchantsResult.rows[0]?.total || '0');
      const isLimited = totalMerchants > subscriptionLimits.maxMerchants;

      res.json({
        success: true,
        data: {
          summary: statsResult.rows[0] || {
            avg_position: 0,
            total_appearances: 0,
            times_selected: 0,
            selection_rate: 0,
            avg_trust_score: 0,
            avg_price: 0
          },
          distribution: distributionResult.rows,
          topMerchants: merchantsResult.rows,
          trend: trendResult.rows,
          subscription: {
            tier: subscriptionLimits.tier,
            maxMerchants: subscriptionLimits.maxMerchants,
            maxDays: allowedDays,
            isLimited,
            hiddenMerchants: isLimited ? totalMerchants - subscriptionLimits.maxMerchants : 0,
            upgradeMessage: isLimited
              ? `Upgrade to see all ${totalMerchants} merchants`
              : null
          }
        },
        message: 'Checkout analytics retrieved successfully'
      });
    } catch (error) {
      logger.error('[Checkout Analytics] Error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch checkout analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/courier/checkout-analytics/merchant/:merchantId
 * Get detailed analytics for a specific merchant (premium feature)
 */
router.get(
  '/merchant/:merchantId',
  authenticateToken,
  requireRole(['courier', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.user_id;
      const userRole = (req as any).user?.user_role;
      const { merchantId } = req.params;

      logger.info('[Merchant Insights] Request', { userId, merchantId });

      // Admin bypass premium check
      if (userRole !== 'admin') {
        // Check if user has purchased this merchant's insights
        const accessResult = await database.query(
          `SELECT * FROM courier_premium_access
           WHERE courier_user_id = $1
           AND merchant_id = $2
           AND access_type = 'merchant_insights'
           AND is_active = TRUE
           AND (expires_at IS NULL OR expires_at > NOW())`,
          [userId, merchantId]
        );

        if (accessResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Premium access required',
            message: 'Purchase detailed insights for this merchant to unlock',
            premium: {
              feature: 'Merchant Insights',
              price: 49.0,
              currency: 'USD',
              billing: 'monthly',
              benefits: [
                'Detailed ranking factors',
                'Competitor analysis (anonymized)',
                'Position improvement recommendations',
                'Historical trends',
                'Real-time alerts'
              ],
              purchaseUrl: `/api/courier/premium/purchase/merchant/${merchantId}`
            }
          });
        }
      }

      // Get courier_id
      const courierResult = await database.query(
        'SELECT courier_id FROM couriers WHERE user_id = $1',
        [userId]
      );

      if (courierResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Courier profile not found'
        });
      }

      const courierId = courierResult.rows[0].courier_id;

      // Get detailed merchant statistics
      const detailedStats = await database.query(
        `SELECT 
           ROUND(AVG(position_shown), 1) as avg_position,
           COUNT(*) as total_appearances,
           COUNT(CASE WHEN was_selected THEN 1 END) as times_selected,
           ROUND(
             COUNT(CASE WHEN was_selected THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(*), 0) * 100, 
             1
           ) as selection_rate,
           ROUND(AVG(trust_score_at_time), 1) as avg_trust_score,
           ROUND(AVG(price_at_time), 2) as avg_price,
           ROUND(AVG(delivery_time_estimate), 0) as avg_delivery_time,
           ROUND(AVG(distance_km), 1) as avg_distance,
           MIN(position_shown) as best_position,
           MAX(position_shown) as worst_position
         FROM courier_checkout_positions
         WHERE courier_id = $1
         AND merchant_id = $2
         AND created_at >= NOW() - INTERVAL '90 days'`,
        [courierId, merchantId]
      );

      // Get ranking factor breakdown
      const factorAnalysis = await database.query(
        `SELECT 
           CASE 
             WHEN position_shown = 1 THEN 'Position 1'
             WHEN position_shown = 2 THEN 'Position 2'
             WHEN position_shown = 3 THEN 'Position 3'
             ELSE 'Position 4+'
           END as position_group,
           ROUND(AVG(trust_score_at_time), 1) as avg_trust_score,
           ROUND(AVG(price_at_time), 2) as avg_price,
           ROUND(AVG(delivery_time_estimate), 0) as avg_delivery_time,
           ROUND(AVG(distance_km), 1) as avg_distance,
           COUNT(*) as occurrences
         FROM courier_checkout_positions
         WHERE courier_id = $1
         AND merchant_id = $2
         AND created_at >= NOW() - INTERVAL '90 days'
         GROUP BY position_group
         ORDER BY 
           CASE position_group
             WHEN 'Position 1' THEN 1
             WHEN 'Position 2' THEN 2
             WHEN 'Position 3' THEN 3
             ELSE 4
           END`,
        [courierId, merchantId]
      );

      // Get historical trend (last 30 days)
      const historicalTrend = await database.query(
        `SELECT 
           DATE(created_at) as date,
           ROUND(AVG(position_shown), 1) as avg_position,
           COUNT(*) as appearances,
           COUNT(CASE WHEN was_selected THEN 1 END) as selections,
           ROUND(AVG(trust_score_at_time), 1) as avg_trust_score,
           ROUND(AVG(price_at_time), 2) as avg_price
         FROM courier_checkout_positions
         WHERE courier_id = $1
         AND merchant_id = $2
         AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date`,
        [courierId, merchantId]
      );

      // Get merchant info
      const merchantInfo = await database.query(
        `SELECT 
           u.user_id,
           u.first_name || ' ' || u.last_name as merchant_name,
           s.store_name,
           s.city,
           s.postal_code
         FROM users u
         LEFT JOIN stores s ON s.owner_user_id = u.user_id
         WHERE u.user_id = $1`,
        [merchantId]
      );

      res.json({
        success: true,
        data: {
          merchant: merchantInfo.rows[0],
          statistics: detailedStats.rows[0],
          factorAnalysis: factorAnalysis.rows,
          historicalTrend: historicalTrend.rows,
          recommendations: generateRecommendations(detailedStats.rows[0], factorAnalysis.rows)
        },
        message: 'Detailed merchant insights retrieved successfully'
      });
    } catch (error) {
      logger.error('[Merchant Insights] Error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch merchant insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/courier/checkout-analytics/track
 * Track a checkout position (called by e-commerce plugins)
 * PUBLIC ENDPOINT - No authentication required (called from checkout)
 */
router.post(
  '/track',
  async (req: Request, res: Response) => {
    try {
      const {
        merchantId,
        courierId,
        checkoutSessionId,
        positionShown,
        totalCouriersShown,
        wasSelected,
        trustScoreAtTime,
        priceAtTime,
        deliveryTimeEstimate,
        distanceKm,
        orderValue,
        itemsCount,
        packageWeightKg,
        deliveryPostalCode,
        deliveryCity,
        deliveryCountry
      } = req.body;

      // Validate required fields
      if (!merchantId || !courierId || !positionShown) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: merchantId, courierId, positionShown'
        });
      }

      // Insert tracking data
      const result = await database.query(
        `INSERT INTO courier_checkout_positions (
          merchant_id,
          courier_id,
          checkout_session_id,
          position_shown,
          total_couriers_shown,
          was_selected,
          trust_score_at_time,
          price_at_time,
          delivery_time_estimate,
          distance_km,
          order_value,
          items_count,
          package_weight_kg,
          delivery_postal_code,
          delivery_city,
          delivery_country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING position_id`,
        [
          merchantId,
          courierId,
          checkoutSessionId,
          positionShown,
          totalCouriersShown || 1,
          wasSelected || false,
          trustScoreAtTime,
          priceAtTime,
          deliveryTimeEstimate,
          distanceKm,
          orderValue,
          itemsCount,
          packageWeightKg,
          deliveryPostalCode,
          deliveryCity,
          deliveryCountry
        ]
      );

      logger.info('[Checkout Analytics] Position tracked', {
        positionId: result.rows[0].position_id,
        courierId,
        position: positionShown
      });

      res.json({
        success: true,
        data: {
          positionId: result.rows[0].position_id
        },
        message: 'Checkout position tracked successfully'
      });
    } catch (error) {
      logger.error('[Checkout Analytics] Track error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track checkout position',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Helper function to generate recommendations
 */
function generateRecommendations(stats: any, factorAnalysis: any[]): string[] {
  const recommendations: string[] = [];

  if (!stats || stats.total_appearances === 0) {
    return ['Not enough data yet. Keep accepting orders to build your analytics.'];
  }

  // Position recommendations
  if (parseFloat(stats.avg_position) > 2.5) {
    recommendations.push(
      '📈 Your average position is below top 2. Focus on improving trust score and competitive pricing.'
    );
  }

  // Trust score recommendations
  if (parseFloat(stats.avg_trust_score) < 85) {
    recommendations.push(
      '⭐ Boost your trust score by maintaining on-time deliveries and getting positive reviews.'
    );
  }

  // Pricing recommendations
  const position1 = factorAnalysis.find((f) => f.position_group === 'Position 1');
  const currentAvg = parseFloat(stats.avg_price);
  if (position1 && currentAvg > parseFloat(position1.avg_price) * 1.1) {
    recommendations.push(
      `💰 Your average price ($${currentAvg.toFixed(2)}) is higher than top-ranked couriers. Consider adjusting pricing.`
    );
  }

  // Selection rate recommendations
  if (parseFloat(stats.selection_rate) < 25) {
    recommendations.push(
      '🎯 Low selection rate. Improve your profile description and highlight unique services.'
    );
  }

  // Delivery time recommendations
  if (parseFloat(stats.avg_delivery_time) > 48) {
    recommendations.push(
      '⚡ Faster delivery times can improve your ranking. Optimize your routes and schedules.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      '✅ Great performance! Keep maintaining your high standards to stay competitive.'
    );
  }

  return recommendations;
}

export default router;
