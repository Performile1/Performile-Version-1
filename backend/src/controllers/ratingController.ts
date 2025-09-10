import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../utils/logger';
import Joi from 'joi';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Validation schemas
const ratingRequestSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  platform: Joi.string().valid('shopify', 'woocommerce', 'magento', 'stripe', 'paypal', 'klarna', 'mollie', 'adyen').optional(),
  integrationOrderId: Joi.string().optional()
});

const submitRatingSchema = Joi.object({
  token: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  reviewText: Joi.string().max(1000).optional(),
  requestedService: Joi.string().valid('home_delivery', 'parcelshop', 'parcellocker', 'pickup_point', 'office_delivery').required(),
  actualService: Joi.string().valid('home_delivery', 'parcelshop', 'parcellocker', 'pickup_point', 'office_delivery').required(),
  serviceAccuracyRating: Joi.number().min(1).max(5).required(),
  serviceSatisfactionRating: Joi.number().min(1).max(5).required(),
  deliveryMethodFeedback: Joi.string().max(500).optional(),
  onTimeDeliveryScore: Joi.number().min(1).max(5).optional(),
  communicationScore: Joi.number().min(1).max(5).optional(),
  packageConditionScore: Joi.number().min(1).max(5).optional(),
  overallSatisfactionScore: Joi.number().min(1).max(5).optional()
});

export class RatingController {
  // Send rating request through integration
  async sendRatingRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, value } = ratingRequestSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0]?.message || 'Validation error' });
        return;
      }

      const { orderId, platform, integrationOrderId } = value;

      // Verify order exists and is completed
      const orderQuery = await pool.query(`
        SELECT o.*, u.email as customer_email, c.email as courier_email
        FROM Orders o
        JOIN Users u ON o.customer_id = u.user_id
        JOIN Users c ON o.courier_id = c.user_id
        WHERE o.order_id = $1 AND o.order_status = 'delivered'
      `, [orderId]);

      if (orderQuery.rows.length === 0) {
        res.status(404).json({ error: 'Order not found or not yet delivered' });
        return;
      }

      const order = orderQuery.rows[0];

      // Check if rating request already sent
      const existingRequest = await pool.query(
        'SELECT * FROM RatingRequests WHERE order_id = $1',
        [orderId]
      );

      if (existingRequest.rows.length > 0) {
        res.status(409).json({ error: 'Rating request already sent for this order' });
        return;
      }

      // Send rating request
      const requestResult = await pool.query(
        'SELECT send_rating_request($1, $2) as request_id',
        [orderId, platform]
      );

      const requestId = requestResult.rows[0].request_id;

      // Get the rating link token
      const tokenQuery = await pool.query(
        'SELECT rating_link_token FROM RatingRequests WHERE request_id = $1',
        [requestId]
      );

      const token = tokenQuery.rows[0].rating_link_token;
      const ratingUrl = `${process.env.FRONTEND_URL}/rate/${token}`;

      // TODO: Integrate with actual platforms
      // For now, we'll return the rating URL for manual integration
      res.json({
        success: true,
        requestId,
        ratingUrl,
        customerEmail: order.customer_email,
        platform: platform || 'manual',
        message: 'Rating request created successfully'
      });

    } catch (error) {
      logger.error('Error sending rating request:', error);
      res.status(500).json({ error: 'Failed to send rating request' });
    }
  }

  // Submit rating via public link
  async submitRating(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, value } = submitRatingSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0]?.message || 'Validation error' });
        return;
      }

      const {
        token,
        rating,
        reviewText,
        requestedService,
        actualService,
        serviceAccuracyRating,
        serviceSatisfactionRating,
        deliveryMethodFeedback,
        onTimeDeliveryScore,
        communicationScore,
        packageConditionScore,
        overallSatisfactionScore
      } = value;

      // Verify token and get rating request
      const requestQuery = await pool.query(`
        SELECT rr.*, o.order_id, o.customer_id, o.courier_id
        FROM RatingRequests rr
        JOIN Orders o ON rr.order_id = o.order_id
        WHERE rr.rating_link_token = $1 
          AND rr.expires_at > CURRENT_TIMESTAMP
          AND rr.status = 'sent'
      `, [token]);

      if (requestQuery.rows.length === 0) {
        res.status(404).json({ error: 'Invalid or expired rating link' });
        return;
      }

      const request = requestQuery.rows[0];

      // Check if rating already submitted
      const existingReview = await pool.query(
        'SELECT * FROM Reviews WHERE order_id = $1',
        [request.order_id]
      );

      if (existingReview.rows.length > 0) {
        res.status(409).json({ error: 'Rating already submitted for this order' });
        return;
      }

      // Insert review with service verification
      const reviewResult = await pool.query(`
        INSERT INTO Reviews (
          order_id,
          customer_id,
          courier_id,
          rating,
          review_text,
          requested_service,
          actual_service,
          service_accuracy_rating,
          service_satisfaction_rating,
          delivery_method_feedback,
          on_time_delivery_score,
          communication_score,
          package_condition_score,
          overall_satisfaction_score,
          rating_request_id,
          is_auto_generated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false)
        RETURNING review_id
      `, [
        request.order_id,
        request.customer_id,
        request.courier_id,
        rating,
        reviewText,
        requestedService,
        actualService,
        serviceAccuracyRating,
        serviceSatisfactionRating,
        deliveryMethodFeedback,
        onTimeDeliveryScore || rating,
        communicationScore || rating,
        packageConditionScore || rating,
        overallSatisfactionScore || rating,
        request.request_id
      ]);

      // Update rating request status
      await pool.query(`
        UPDATE RatingRequests 
        SET status = 'responded', response_received_at = CURRENT_TIMESTAMP
        WHERE request_id = $1
      `, [request.request_id]);

      // Update order with actual service
      await pool.query(`
        UPDATE Orders 
        SET actual_service = $1, 
            service_notes = $2
        WHERE order_id = $3
      `, [actualService, deliveryMethodFeedback, request.order_id]);

      res.json({
        success: true,
        reviewId: reviewResult.rows[0].review_id,
        message: 'Rating submitted successfully'
      });

    } catch (error) {
      logger.error('Error submitting rating:', error);
      res.status(500).json({ error: 'Failed to submit rating' });
    }
  }

  // Get rating request analytics
  async getRatingAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Get rating request statistics
      const analyticsQuery = await pool.query(`
        SELECT * FROM RatingRequestAnalytics
        WHERE month >= CURRENT_DATE - INTERVAL '12 months'
        ORDER BY month DESC
      `);

      // Get service performance data
      const serviceQuery = await pool.query(`
        SELECT 
          csp.*,
          u.business_name as courier_name
        FROM CourierServicePerformance csp
        JOIN Users u ON csp.courier_id = u.user_id
        ORDER BY csp.avg_rating DESC, csp.total_orders DESC
      `);

      res.json({
        success: true,
        ratingAnalytics: analyticsQuery.rows,
        servicePerformance: serviceQuery.rows
      });

    } catch (error) {
      logger.error('Error fetching rating analytics:', error);
      res.status(500).json({ error: 'Failed to fetch rating analytics' });
    }
  }

  // Process non-response ratings (cron job endpoint)
  async processNonResponses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // This should be called by a cron job or scheduled task
      const result = await pool.query('SELECT process_non_response_ratings() as processed_count');
      const processedCount = result.rows[0].processed_count;

      logger.info(`Processed ${processedCount} non-response ratings`);
      
      res.json({
        success: true,
        processedCount,
        message: `Processed ${processedCount} non-response ratings with 70% satisfaction default`
      });

    } catch (error) {
      logger.error('Error processing non-response ratings:', error);
      res.status(500).json({ error: 'Failed to process non-response ratings' });
    }
  }

  // Get courier services
  async getCourierServices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courierId } = req.params;

      const servicesQuery = await pool.query(`
        SELECT 
          cs.*,
          COUNT(o.order_id) as total_orders,
          AVG(r.service_satisfaction_rating) as avg_service_rating,
          calculate_service_accuracy_rate(cs.courier_id) as accuracy_rate
        FROM CourierServices cs
        LEFT JOIN Orders o ON cs.courier_id = o.courier_id AND cs.service_type = o.actual_service
        LEFT JOIN Reviews r ON o.order_id = r.order_id
        WHERE cs.courier_id = $1
        GROUP BY cs.service_id, cs.courier_id, cs.service_type, cs.is_available, 
                 cs.price_modifier, cs.estimated_delivery_hours, cs.coverage_areas, 
                 cs.special_instructions, cs.created_at, cs.updated_at
        ORDER BY cs.service_type
      `, [courierId]);

      res.json({
        success: true,
        services: servicesQuery.rows
      });

    } catch (error) {
      logger.error('Error fetching courier services:', error);
      res.status(500).json({ error: 'Failed to fetch courier services' });
    }
  }

  // Update courier services
  async updateCourierServices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { services } = req.body;

      if (!Array.isArray(services)) {
        res.status(400).json({ error: 'Services must be an array' });
        return;
      }

      // Clear existing services
      await pool.query('DELETE FROM CourierServices WHERE courier_id = $1', [userId]);

      // Insert new services
      for (const service of services) {
        await pool.query(`
          INSERT INTO CourierServices (
            courier_id, service_type, is_available, price_modifier,
            estimated_delivery_hours, coverage_areas, special_instructions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          userId,
          service.serviceType,
          service.isAvailable,
          service.priceModifier || 1.00,
          service.estimatedDeliveryHours,
          service.coverageAreas || [],
          service.specialInstructions
        ]);
      }

      res.json({
        success: true,
        message: 'Courier services updated successfully'
      });

    } catch (error) {
      logger.error('Error updating courier services:', error);
      res.status(500).json({ error: 'Failed to update courier services' });
    }
  }
}

export default new RatingController();
