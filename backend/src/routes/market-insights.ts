import { Router, Request, Response } from 'express';
import database from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/market-insights/courier
 * Get anonymized merchant market data for couriers
 * Shows high-value merchant segments without revealing identities
 */
router.get(
  '/courier',
  authenticateToken,
  requireRole(['courier', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.user_id;
      const userRole = (req as any).user?.user_role;

      logger.info('[Market Insights - Courier] Request', { userId, userRole });

      // Check if user has premium access
      let hasPremiumAccess = false;
      if (userRole === 'admin') {
        hasPremiumAccess = true;
      } else {
        const premiumCheck = await database.query(
          `SELECT EXISTS(
            SELECT 1 FROM courier_premium_access
            WHERE courier_id = (SELECT courier_id FROM couriers WHERE user_id = $1)
              AND feature_type = 'market_insights'
              AND (expires_at IS NULL OR expires_at > NOW())
          ) as has_access`,
          [userId]
        );
        hasPremiumAccess = premiumCheck.rows[0]?.has_access || false;
      }

      if (!hasPremiumAccess) {
        return res.status(403).json({
          success: false,
          error: 'Premium feature',
          message: 'Market Insights requires a premium subscription',
          premium: {
            feature: 'market_insights',
            price: 29,
            currency: 'USD',
            interval: 'month'
          }
        });
      }

      // Get merchant segments by order value
      const merchantSegmentsResult = await database.query(
        `SELECT 
           CASE 
             WHEN avg_order_value >= 200 THEN 'Premium ($200+)'
             WHEN avg_order_value >= 100 THEN 'High-Value ($100-$199)'
             WHEN avg_order_value >= 50 THEN 'Mid-Value ($50-$99)'
             ELSE 'Standard (<$50)'
           END as segment,
           COUNT(DISTINCT merchant_id) as merchant_count,
           ROUND(AVG(avg_order_value), 2) as avg_order_value,
           ROUND(AVG(selection_rate), 1) as avg_selection_rate,
           SUM(total_checkouts) as total_checkouts,
           ROUND(AVG(avg_position), 1) as avg_position
         FROM (
           SELECT 
             merchant_id,
             AVG(order_value) as avg_order_value,
             COUNT(DISTINCT checkout_session_id) as total_checkouts,
             ROUND((COUNT(CASE WHEN was_selected THEN 1 END)::DECIMAL / 
                    NULLIF(COUNT(DISTINCT checkout_session_id), 0)) * 100, 1) as selection_rate,
             AVG(position_shown) as avg_position
           FROM courier_checkout_positions
           WHERE created_at >= NOW() - INTERVAL '30 days'
           GROUP BY merchant_id
         ) merchant_stats
         GROUP BY segment
         ORDER BY avg_order_value DESC`
      );

      // Get geographic opportunities
      const geographicResult = await database.query(
        `SELECT 
           delivery_country,
           delivery_city,
           COUNT(DISTINCT merchant_id) as merchant_count,
           COUNT(DISTINCT checkout_session_id) as total_checkouts,
           ROUND(AVG(order_value), 2) as avg_order_value,
           ROUND((COUNT(CASE WHEN was_selected THEN 1 END)::DECIMAL / 
                  NULLIF(COUNT(DISTINCT checkout_session_id), 0)) * 100, 1) as selection_rate
         FROM courier_checkout_positions
         WHERE created_at >= NOW() - INTERVAL '30 days'
           AND delivery_country IS NOT NULL
           AND delivery_city IS NOT NULL
         GROUP BY delivery_country, delivery_city
         HAVING COUNT(DISTINCT checkout_session_id) >= 5
         ORDER BY total_checkouts DESC
         LIMIT 20`
      );

      // Get industry trends (based on order patterns)
      const industryTrendsResult = await database.query(
        `SELECT 
           CASE 
             WHEN avg_items >= 10 THEN 'Bulk/Wholesale'
             WHEN avg_items >= 5 THEN 'Multi-Item Retail'
             WHEN avg_items >= 2 THEN 'Standard Retail'
             ELSE 'Single Item'
           END as industry_type,
           COUNT(DISTINCT merchant_id) as merchant_count,
           ROUND(AVG(avg_order_value), 2) as avg_order_value,
           ROUND(AVG(avg_items), 1) as avg_items_per_order,
           ROUND(AVG(avg_weight), 2) as avg_package_weight
         FROM (
           SELECT 
             merchant_id,
             AVG(order_value) as avg_order_value,
             AVG(items_count) as avg_items,
             AVG(package_weight_kg) as avg_weight
           FROM courier_checkout_positions
           WHERE created_at >= NOW() - INTERVAL '30 days'
             AND items_count IS NOT NULL
           GROUP BY merchant_id
         ) merchant_patterns
         GROUP BY industry_type
         ORDER BY merchant_count DESC`
      );

      // Get competitive benchmarks
      const benchmarksResult = await database.query(
        `SELECT 
           ROUND(AVG(avg_position), 1) as market_avg_position,
           ROUND(AVG(selection_rate), 1) as market_avg_selection_rate,
           ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY avg_position), 1) as top_25_position,
           ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY selection_rate DESC), 1) as top_25_selection_rate
         FROM (
           SELECT 
             courier_id,
             AVG(position_shown) as avg_position,
             ROUND((COUNT(CASE WHEN was_selected THEN 1 END)::DECIMAL / 
                    NULLIF(COUNT(*), 0)) * 100, 1) as selection_rate
           FROM courier_checkout_positions
           WHERE created_at >= NOW() - INTERVAL '30 days'
           GROUP BY courier_id
           HAVING COUNT(*) >= 10
         ) courier_stats`
      );

      logger.info('[Market Insights - Courier] Success', {
        segments: merchantSegmentsResult.rows.length,
        locations: geographicResult.rows.length
      });

      res.json({
        success: true,
        data: {
          merchantSegments: merchantSegmentsResult.rows,
          geographicOpportunities: geographicResult.rows,
          industryTrends: industryTrendsResult.rows,
          marketBenchmarks: benchmarksResult.rows[0] || {},
          dataRange: '30 days',
          anonymized: true
        },
        message: 'Market insights retrieved successfully'
      });
    } catch (error) {
      logger.error('[Market Insights - Courier] Error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch market insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/market-insights/merchant
 * Get anonymized courier market data for merchants
 * Shows courier performance benchmarks without revealing identities
 */
router.get(
  '/merchant',
  authenticateToken,
  requireRole(['merchant', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.user_id;
      const userRole = (req as any).user?.user_role;

      logger.info('[Market Insights - Merchant] Request', { userId, userRole });

      // Check if user has premium access
      let hasPremiumAccess = false;
      if (userRole === 'admin') {
        hasPremiumAccess = true;
      } else {
        const premiumCheck = await database.query(
          `SELECT tier FROM user_subscriptions 
           WHERE user_id = $1 
           ORDER BY created_at DESC 
           LIMIT 1`,
          [userId]
        );
        // Premium tier 2+ gets market insights
        hasPremiumAccess = (premiumCheck.rows[0]?.tier || 1) >= 2;
      }

      if (!hasPremiumAccess) {
        return res.status(403).json({
          success: false,
          error: 'Premium feature',
          message: 'Market Insights requires Professional or Enterprise plan',
          premium: {
            feature: 'market_insights',
            requiredTier: 2,
            tierName: 'Professional'
          }
        });
      }

      // Get courier performance segments
      const courierSegmentsResult = await database.query(
        `SELECT 
           CASE 
             WHEN avg_position <= 1.5 THEN 'Top Performers (Avg Pos 1-1.5)'
             WHEN avg_position <= 2.5 THEN 'High Performers (Avg Pos 1.5-2.5)'
             WHEN avg_position <= 3.5 THEN 'Mid Performers (Avg Pos 2.5-3.5)'
             ELSE 'Standard Performers (Avg Pos 3.5+)'
           END as segment,
           COUNT(DISTINCT courier_id) as courier_count,
           ROUND(AVG(avg_position), 1) as avg_position,
           ROUND(AVG(selection_rate), 1) as avg_selection_rate,
           ROUND(AVG(avg_order_value), 2) as avg_order_value
         FROM (
           SELECT 
             courier_id,
             AVG(position_shown) as avg_position,
             ROUND((COUNT(CASE WHEN was_selected THEN 1 END)::DECIMAL / 
                    NULLIF(COUNT(*), 0)) * 100, 1) as selection_rate,
             AVG(order_value) as avg_order_value
           FROM courier_checkout_positions
           WHERE created_at >= NOW() - INTERVAL '30 days'
           GROUP BY courier_id
           HAVING COUNT(*) >= 5
         ) courier_stats
         GROUP BY segment
         ORDER BY avg_position ASC`
      );

      // Get selection rate distribution
      const selectionDistributionResult = await database.query(
        `SELECT 
           CASE 
             WHEN selection_rate >= 50 THEN '50%+ Selection Rate'
             WHEN selection_rate >= 30 THEN '30-49% Selection Rate'
             WHEN selection_rate >= 15 THEN '15-29% Selection Rate'
             ELSE '<15% Selection Rate'
           END as rate_bracket,
           COUNT(*) as courier_count,
           ROUND(AVG(selection_rate), 1) as avg_rate
         FROM (
           SELECT 
             courier_id,
             ROUND((COUNT(CASE WHEN was_selected THEN 1 END)::DECIMAL / 
                    NULLIF(COUNT(*), 0)) * 100, 1) as selection_rate
           FROM courier_checkout_positions
           WHERE created_at >= NOW() - INTERVAL '30 days'
           GROUP BY courier_id
           HAVING COUNT(*) >= 5
         ) courier_rates
         GROUP BY rate_bracket
         ORDER BY avg_rate DESC`
      );

      // Get geographic courier availability
      const geographicCoverageResult = await database.query(
        `SELECT 
           delivery_country,
           delivery_city,
           COUNT(DISTINCT courier_id) as available_couriers,
           ROUND(AVG(selection_rate), 1) as avg_selection_rate,
           COUNT(DISTINCT checkout_session_id) as total_checkouts
         FROM (
           SELECT 
             delivery_country,
             delivery_city,
             courier_id,
             checkout_session_id,
             ROUND((COUNT(CASE WHEN was_selected THEN 1 END)::DECIMAL / 
                    NULLIF(COUNT(*), 0)) * 100, 1) as selection_rate
           FROM courier_checkout_positions
           WHERE created_at >= NOW() - INTERVAL '30 days'
             AND delivery_country IS NOT NULL
             AND delivery_city IS NOT NULL
           GROUP BY delivery_country, delivery_city, courier_id, checkout_session_id
         ) location_stats
         GROUP BY delivery_country, delivery_city
         HAVING COUNT(DISTINCT courier_id) >= 2
         ORDER BY available_couriers DESC, total_checkouts DESC
         LIMIT 20`
      );

      // Get market benchmarks
      const benchmarksResult = await database.query(
        `SELECT 
           ROUND(AVG(selection_rate), 1) as market_avg_selection_rate,
           ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY selection_rate), 1) as top_25_selection_rate,
           ROUND(AVG(avg_position), 1) as market_avg_position,
           COUNT(DISTINCT courier_id) as total_active_couriers
         FROM (
           SELECT 
             courier_id,
             AVG(position_shown) as avg_position,
             ROUND((COUNT(CASE WHEN was_selected THEN 1 END)::DECIMAL / 
                    NULLIF(COUNT(*), 0)) * 100, 1) as selection_rate
           FROM courier_checkout_positions
           WHERE created_at >= NOW() - INTERVAL '30 days'
           GROUP BY courier_id
           HAVING COUNT(*) >= 5
         ) courier_stats`
      );

      logger.info('[Market Insights - Merchant] Success', {
        segments: courierSegmentsResult.rows.length,
        locations: geographicCoverageResult.rows.length
      });

      res.json({
        success: true,
        data: {
          courierSegments: courierSegmentsResult.rows,
          selectionDistribution: selectionDistributionResult.rows,
          geographicCoverage: geographicCoverageResult.rows,
          marketBenchmarks: benchmarksResult.rows[0] || {},
          dataRange: '30 days',
          anonymized: true
        },
        message: 'Market insights retrieved successfully'
      });
    } catch (error) {
      logger.error('[Market Insights - Merchant] Error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch market insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
