import { Request, Response } from 'express';
import { TrustScore, ApiResponse, FilterQuery, PaginationQuery } from '../types';
import database from '../config/database';
import redisClient from '../config/redis';
import logger from '../utils/logger';

export class TrustScoreController {
  // Get courier trust scores with filtering and pagination
  public async getCourierTrustScores(req: Request, res: Response): Promise<void> {
    try {
      const {
        country,
        postal_code,
        min_reviews = 0,
        courier_id,
        page = 1,
        limit = 50,
        sortBy = 'trust_score',
        sortOrder = 'desc'
      } = req.query;

      // Mock TrustScore data for development
      const mockTrustScores: TrustScore[] = [
        {
          courier_id: '1',
          courier_name: 'FastShip Express',
          total_reviews: 1247,
          average_rating: 4.6,
          weighted_rating: 4.5,
          completion_rate: 98.2,
          on_time_rate: 94.8,
          response_time_avg: 2.3,
          customer_satisfaction_score: 4.7,
          issue_resolution_rate: 96.5,
          delivery_attempt_avg: 1.2,
          last_mile_performance: 92.1,
          trust_score: 94.2,
          total_orders: 5432,
          completed_orders: 5334,
          on_time_deliveries: 5056,
          last_calculated: new Date()
        },
        {
          courier_id: '2',
          courier_name: 'QuickLogistics',
          total_reviews: 892,
          average_rating: 4.3,
          weighted_rating: 4.2,
          completion_rate: 96.8,
          on_time_rate: 91.2,
          response_time_avg: 3.1,
          customer_satisfaction_score: 4.4,
          issue_resolution_rate: 93.8,
          delivery_attempt_avg: 1.4,
          last_mile_performance: 89.6,
          trust_score: 89.7,
          total_orders: 3821,
          completed_orders: 3699,
          on_time_deliveries: 3373,
          last_calculated: new Date()
        },
        {
          courier_id: '3',
          courier_name: 'ReliableFreight',
          total_reviews: 634,
          average_rating: 4.1,
          weighted_rating: 4.0,
          completion_rate: 95.1,
          on_time_rate: 88.7,
          response_time_avg: 4.2,
          customer_satisfaction_score: 4.2,
          issue_resolution_rate: 91.3,
          delivery_attempt_avg: 1.6,
          last_mile_performance: 86.4,
          trust_score: 85.8,
          total_orders: 2156,
          completed_orders: 2050,
          on_time_deliveries: 1818,
          last_calculated: new Date()
        }
      ];

      // Apply filters
      let filteredScores = mockTrustScores.filter(score => {
        if (min_reviews && score.total_reviews < Number(min_reviews)) return false;
        if (courier_id && score.courier_id !== courier_id) return false;
        return true;
      });

      // Apply sorting
      filteredScores.sort((a, b) => {
        const aVal = (a as any)[sortBy as string] || 0;
        const bVal = (b as any)[sortBy as string] || 0;
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });

      // Apply pagination
      const offset = (Number(page) - 1) * Number(limit);
      const paginatedScores = filteredScores.slice(offset, offset + Number(limit));

      const response: ApiResponse<TrustScore[]> = {
        success: true,
        data: paginatedScores,
        message: 'Trust scores retrieved successfully (mock data)',
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredScores.length,
          totalPages: Math.ceil(filteredScores.length / Number(limit))
        }
      };

      res.json(response);

      // Get trust scores from database
      const result = await database.query(
        `SELECT * FROM get_courier_trust_scores($1, $2, $3, $4, $5)`,
        [country || null, postal_code || null, Number(min_reviews), Number(limit), offset]
      );

      // Get total count for pagination
      const countResult = await database.query(
        `SELECT COUNT(*) as total FROM CourierTrustScores cts
         WHERE ($1::varchar IS NULL OR EXISTS (
           SELECT 1 FROM Orders o 
           WHERE o.courier_id = cts.courier_id 
           AND o.country = $1
         ))
         AND ($2::varchar IS NULL OR EXISTS (
           SELECT 1 FROM Orders o 
           WHERE o.courier_id = cts.courier_id 
           AND o.postal_code LIKE $2 || '%'
         ))
         AND cts.total_reviews >= $3`,
        [country || null, postal_code || null, Number(min_reviews)]
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / Number(limit));

      const responseData = {
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      };

      // Cache disabled for mock data mode

      res.json({
        success: true,
        ...responseData,
        message: 'Trust scores retrieved successfully'
      });
    } catch (error) {
      logger.error('Get trust scores error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve trust scores',
        message: 'An error occurred while fetching trust scores'
      });
    }
  }

  // Get detailed trust score for a specific courier
  public async getCourierTrustScore(req: Request, res: Response): Promise<void> {
    try {
      const { courierId } = req.params;

      // Check cache first
      const cacheKey = `trust_score:${courierId}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        const cachedData = JSON.parse(cached);
        res.json({
          success: true,
          data: cachedData,
          message: 'Trust score retrieved successfully (cached)'
        });
        return;
      }

      // Calculate fresh trust score
      const result = await database.query(
        'SELECT * FROM calculate_trust_score($1)',
        [courierId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Courier not found',
          message: 'No trust score data available for this courier'
        });
        return;
      }

      const trustScore = result.rows[0];

      // Cache the result for 10 minutes
      await redisClient.set(cacheKey, JSON.stringify(trustScore), 600);

      res.json({
        success: true,
        data: trustScore,
        message: 'Trust score retrieved successfully'
      });
    } catch (error) {
      logger.error('Get courier trust score error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve trust score',
        message: 'An error occurred while fetching trust score'
      });
    }
  }

  // Update trust score cache for a specific courier
  public async updateCourierTrustScore(req: Request, res: Response): Promise<void> {
    try {
      const { courierId } = req.params;

      // Update trust score cache
      await database.query('SELECT update_trust_score_cache($1)', [courierId]);

      // Clear related caches
      await redisClient.del(`trust_score:${courierId}`);
      await redisClient.flushCache('trust_scores:*');

      logger.info('Trust score cache updated', { courierId });

      res.json({
        success: true,
        message: 'Trust score updated successfully'
      });
    } catch (error) {
      logger.error('Update trust score error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update trust score',
        message: 'An error occurred while updating trust score'
      });
    }
  }

  // Update all trust score caches (admin only)
  public async updateAllTrustScores(req: Request, res: Response): Promise<void> {
    try {
      const result = await database.query('SELECT update_all_trust_score_caches()');
      const updatedCount = result.rows[0].update_all_trust_score_caches;

      // Clear all trust score caches
      await redisClient.flushCache('trust_score:*');
      await redisClient.flushCache('trust_scores:*');

      logger.info('All trust score caches updated', { updatedCount });

      res.json({
        success: true,
        data: { updatedCount },
        message: `Updated trust scores for ${updatedCount} couriers`
      });
    } catch (error) {
      logger.error('Update all trust scores error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update trust scores',
        message: 'An error occurred while updating trust scores'
      });
    }
  }

  // Get trust score dashboard data
  public async getTrustScoreDashboard(req: Request, res: Response): Promise<void> {
    try {
      const {
        country,
        postal_code,
        min_reviews = 0,
        limit = 20
      } = req.query;

      // Get user info for role-based filtering
      const user = (req as any).user;
      const userId = user?.user_id;
      const userRole = user?.user_role;

      logger.info('[Dashboard] Request from user', { userId, userRole });

      // Get user's subscription plan for limits
      let subscriptionLimits = {
        max_couriers: 999999, // Default: unlimited for admin
        max_orders: 999999,
        tier: 0
      };

      if (userRole !== 'admin') {
        try {
          const subResult = await database.query(
            `SELECT tier, max_couriers, max_orders_per_month 
             FROM user_subscriptions 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [userId]
          );
          
          if (subResult.rows.length > 0) {
            subscriptionLimits = {
              max_couriers: subResult.rows[0].max_couriers || 5,
              max_orders: subResult.rows[0].max_orders_per_month || 100,
              tier: subResult.rows[0].tier || 1
            };
          }
          
          logger.info('[Dashboard] Subscription limits', { userId, limits: subscriptionLimits });
        } catch (subError) {
          logger.warn('[Dashboard] Could not fetch subscription', { error: subError });
          // Use default limits if subscription table doesn't exist
          subscriptionLimits = {
            max_couriers: 5,
            max_orders: 100,
            tier: 1
          };
        }
      }

      const cacheKey = `dashboard:${userRole}:${userId}:${JSON.stringify({ country, postal_code, min_reviews, limit })}`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        res.json({
          success: true,
          data: cachedData,
          message: 'Dashboard data retrieved successfully (cached)'
        });
        return;
      }

      // Get dashboard data from view
      const result = await database.query(
        `SELECT * FROM courier_trust_score_dashboard
         WHERE ($1::varchar IS NULL OR EXISTS (
           SELECT 1 FROM Orders o 
           WHERE o.courier_id = courier_trust_score_dashboard.courier_id 
           AND o.country = $1
         ))
         AND ($2::varchar IS NULL OR EXISTS (
           SELECT 1 FROM Orders o 
           WHERE o.courier_id = courier_trust_score_dashboard.courier_id 
           AND o.postal_code LIKE $2 || '%'
         ))
         AND total_reviews >= $3
         ORDER BY trust_score DESC NULLS LAST
         LIMIT $4`,
        [country || null, postal_code || null, Number(min_reviews), Number(limit)]
      );

      // Build role-based WHERE clause for filtering
      let roleFilter = '';
      let queryParams: any[] = [Number(min_reviews)];
      
      switch (userRole) {
        case 'merchant':
          // Merchant: Only their linked couriers and orders
          roleFilter = `AND EXISTS (
            SELECT 1 FROM merchant_courier_selections mcs 
            WHERE mcs.courier_id = c.courier_id 
            AND mcs.merchant_id = $2 
            AND mcs.is_active = TRUE
          )`;
          queryParams.push(userId);
          break;
          
        case 'courier':
          // Courier: Only their own data
          roleFilter = `AND c.user_id = $2`;
          queryParams.push(userId);
          break;
          
        case 'consumer':
          // Consumer: Only orders they placed (if we add consumer_id to orders)
          roleFilter = `AND EXISTS (
            SELECT 1 FROM orders o2 
            WHERE o2.courier_id = c.courier_id 
            AND o2.consumer_id = $2
          )`;
          queryParams.push(userId);
          break;
          
        case 'admin':
        default:
          // Admin: See all data (no filter)
          break;
      }

      logger.info('[Dashboard] Role filter', { userRole, roleFilter });

      // Get summary statistics from actual tables with role-based filtering
      const statsResult = await database.query(
        `SELECT 
           COUNT(DISTINCT c.courier_id) as total_couriers,
           COALESCE(ROUND(AVG(c.trust_score), 1), 0) as avg_trust_score,
           COALESCE(ROUND(AVG(
             CASE WHEN o.order_status = 'delivered' AND o.delivery_date <= o.order_date + INTERVAL '2 days' 
             THEN 100.0 ELSE 0 END
           ), 1), 0) as avg_on_time_rate,
           COALESCE(ROUND(AVG(
             CASE WHEN o.order_status = 'delivered' 
             THEN 100.0 ELSE 0 END
           ), 1), 0) as avg_completion_rate,
           COUNT(DISTINCT o.order_id) as total_orders_processed,
           COUNT(DISTINCT r.review_id) as total_reviews_count
         FROM couriers c
         LEFT JOIN orders o ON c.courier_id = o.courier_id
         LEFT JOIN reviews r ON o.order_id = r.order_id
         WHERE c.is_active = TRUE
         ${roleFilter}
         GROUP BY ()
         HAVING COUNT(DISTINCT r.review_id) >= $1`,
        queryParams
      );

      // Apply subscription limits to results
      const limitedCouriers = result.rows.slice(0, subscriptionLimits.max_couriers);
      
      const dashboardData = {
        couriers: limitedCouriers,
        statistics: {
          ...statsResult.rows[0],
          // Add subscription info to response
          subscription: {
            tier: subscriptionLimits.tier,
            max_couriers: subscriptionLimits.max_couriers,
            max_orders: subscriptionLimits.max_orders,
            current_couriers: limitedCouriers.length,
            is_at_limit: limitedCouriers.length >= subscriptionLimits.max_couriers
          }
        }
      };

      // Cache for 15 minutes
      await redisClient.set(cacheKey, JSON.stringify(dashboardData), 900);

      res.json({
        success: true,
        data: dashboardData,
        message: 'Dashboard data retrieved successfully'
      });
    } catch (error) {
      logger.error('Get dashboard error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data',
        message: 'An error occurred while fetching dashboard data'
      });
    }
  }

  // Get trust score trends for a courier
  public async getCourierTrends(req: Request, res: Response): Promise<void> {
    try {
      const { courierId } = req.params;
      const { days = 30 } = req.query;

      const cacheKey = `trends:${courierId}:${days}`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        res.json({
          success: true,
          data: cachedData,
          message: 'Trend data retrieved successfully (cached)'
        });
        return;
      }

      // Get trend data
      const result = await database.query(
        `WITH daily_stats AS (
           SELECT 
             DATE(o.order_date) as date,
             COUNT(*) as orders_count,
             COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as completed_count,
             COUNT(CASE WHEN o.order_status = 'delivered' AND o.delivery_date <= o.estimated_delivery THEN 1 END) as on_time_count,
             AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating END) as avg_rating
           FROM Orders o
           LEFT JOIN Reviews r ON o.order_id = r.order_id
           WHERE o.courier_id = $1
           AND o.order_date >= NOW() - INTERVAL '$2 days'
           GROUP BY DATE(o.order_date)
           ORDER BY date DESC
         )
         SELECT 
           date,
           orders_count,
           completed_count,
           on_time_count,
           CASE WHEN completed_count > 0 THEN (on_time_count::float / completed_count * 100) ELSE 0 END as on_time_rate,
           COALESCE(avg_rating, 0) as avg_rating
         FROM daily_stats`,
        [courierId, Number(days)]
      );

      const trendData = {
        trends: result.rows,
        period_days: Number(days),
        courier_id: courierId
      };

      // Cache for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(trendData), 3600);

      res.json({
        success: true,
        data: trendData,
        message: 'Trend data retrieved successfully'
      });
    } catch (error) {
      logger.error('Get courier trends error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve trend data',
        message: 'An error occurred while fetching trend data'
      });
    }
  }

  // Compare couriers
  public async compareCouriers(req: Request, res: Response): Promise<void> {
    try {
      const { courier_ids } = req.body;

      if (!Array.isArray(courier_ids) || courier_ids.length < 2 || courier_ids.length > 5) {
        res.status(400).json({
          success: false,
          error: 'Invalid courier IDs',
          message: 'Please provide 2-5 courier IDs for comparison'
        });
        return;
      }

      const cacheKey = `compare:${courier_ids.sort().join(':')}`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        res.json({
          success: true,
          data: cachedData,
          message: 'Comparison data retrieved successfully (cached)'
        });
        return;
      }

      // Get comparison data
      const placeholders = courier_ids.map((_, index) => `$${index + 1}`).join(',');
      const result = await database.query(
        `SELECT * FROM courier_trust_score_dashboard
         WHERE courier_id IN (${placeholders})
         ORDER BY trust_score DESC`,
        courier_ids
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No couriers found',
          message: 'No data available for the specified couriers'
        });
        return;
      }

      const comparisonData = {
        couriers: result.rows,
        comparison_metrics: this.calculateComparisonMetrics(result.rows)
      };

      // Cache for 30 minutes
      await redisClient.set(cacheKey, JSON.stringify(comparisonData), 1800);

      res.json({
        success: true,
        data: comparisonData,
        message: 'Courier comparison retrieved successfully'
      });
    } catch (error) {
      logger.error('Compare couriers error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to compare couriers',
        message: 'An error occurred while comparing couriers'
      });
    }
  }

  // Private helper methods
  private calculateComparisonMetrics(couriers: any[]): any {
    const metrics = {
      highest_trust_score: Math.max(...couriers.map(c => c.trust_score || 0)),
      lowest_trust_score: Math.min(...couriers.map(c => c.trust_score || 0)),
      avg_trust_score: couriers.reduce((sum, c) => sum + (c.trust_score || 0), 0) / couriers.length,
      highest_on_time_rate: Math.max(...couriers.map(c => c.on_time_rate || 0)),
      lowest_on_time_rate: Math.min(...couriers.map(c => c.on_time_rate || 0)),
      most_reviews: Math.max(...couriers.map(c => c.total_reviews || 0)),
      least_reviews: Math.min(...couriers.map(c => c.total_reviews || 0)),
    };

    return metrics;
  }
}

