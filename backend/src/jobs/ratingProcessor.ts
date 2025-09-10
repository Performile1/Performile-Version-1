import cron from 'node-cron';
import pool from '../config/database';
import logger from '../utils/logger';
import integrationService from '../services/integrationService';

export class RatingProcessor {
  private static instance: RatingProcessor;

  public static getInstance(): RatingProcessor {
    if (!RatingProcessor.instance) {
      RatingProcessor.instance = new RatingProcessor();
    }
    return RatingProcessor.instance;
  }

  // Initialize cron jobs
  public initializeJobs(): void {
    // Process non-response ratings daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.processNonResponseRatings();
    });

    // Send rating reminders daily at 10 AM
    cron.schedule('0 10 * * *', async () => {
      await this.sendRatingReminders();
    });

    // Auto-send rating requests for delivered orders every hour
    cron.schedule('0 * * * *', async () => {
      await this.autoSendRatingRequests();
    });

    logger.info('Rating processor cron jobs initialized');
  }

  // Process expired rating requests with 70% satisfaction default
  private async processNonResponseRatings(): Promise<void> {
    try {
      const result = await pool.query('SELECT process_non_response_ratings() as processed_count');
      const processedCount = result.rows[0].processed_count;

      if (processedCount > 0) {
        logger.info(`Processed ${processedCount} non-response ratings with 70% satisfaction default`);
      }
    } catch (error) {
      logger.error('Error processing non-response ratings:', error);
    }
  }

  // Send reminders for pending rating requests
  private async sendRatingReminders(): Promise<void> {
    try {
      // Find rating requests that need reminders (sent 7 days ago, no response)
      const reminderQuery = await pool.query(`
        SELECT 
          rr.*,
          o.order_number,
          u.email as customer_email,
          u.first_name || ' ' || u.last_name as customer_name,
          c.business_name as courier_name
        FROM RatingRequests rr
        JOIN Orders o ON rr.order_id = o.order_id
        JOIN Users u ON o.customer_id = u.user_id
        JOIN Users c ON o.courier_id = c.user_id
        WHERE rr.status = 'sent'
          AND rr.response_received_at IS NULL
          AND rr.request_sent_at <= CURRENT_TIMESTAMP - INTERVAL '7 days'
          AND rr.reminder_count < 2
          AND rr.expires_at > CURRENT_TIMESTAMP
      `);

      for (const request of reminderQuery.rows) {
        try {
          const ratingUrl = `${process.env.FRONTEND_URL}/rate/${request.rating_link_token}`;
          
          // Send reminder through integration service
          await integrationService.sendRatingRequest(request.order_id, request.integration_platform);

          // Update reminder count
          await pool.query(`
            UPDATE RatingRequests 
            SET reminder_count = reminder_count + 1,
                last_reminder_sent_at = CURRENT_TIMESTAMP
            WHERE request_id = $1
          `, [request.request_id]);

          logger.info(`Reminder sent for rating request ${request.request_id}`);
        } catch (error) {
          logger.error(`Failed to send reminder for request ${request.request_id}:`, error);
        }
      }

      if (reminderQuery.rows.length > 0) {
        logger.info(`Sent ${reminderQuery.rows.length} rating reminders`);
      }
    } catch (error) {
      logger.error('Error sending rating reminders:', error);
    }
  }

  // Auto-send rating requests for recently delivered orders
  private async autoSendRatingRequests(): Promise<void> {
    try {
      // Find delivered orders without rating requests (delivered in last 24 hours)
      const ordersQuery = await pool.query(`
        SELECT o.order_id, s.store_id, iw.platform
        FROM Orders o
        LEFT JOIN Stores s ON o.store_id = s.store_id
        LEFT JOIN IntegrationWebhooks iw ON s.store_id = iw.store_id 
          AND iw.is_active = true
        WHERE o.order_status = 'delivered'
          AND o.delivered_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
          AND o.delivered_at <= CURRENT_TIMESTAMP - INTERVAL '2 hours' -- Wait 2 hours after delivery
          AND NOT EXISTS (
            SELECT 1 FROM RatingRequests rr WHERE rr.order_id = o.order_id
          )
      `);

      for (const order of ordersQuery.rows) {
        try {
          await integrationService.sendRatingRequest(order.order_id, order.platform);
          logger.info(`Auto-sent rating request for order ${order.order_id}`);
        } catch (error) {
          logger.error(`Failed to auto-send rating request for order ${order.order_id}:`, error);
        }
      }

      if (ordersQuery.rows.length > 0) {
        logger.info(`Auto-sent ${ordersQuery.rows.length} rating requests`);
      }
    } catch (error) {
      logger.error('Error auto-sending rating requests:', error);
    }
  }

  // Manual trigger for processing (for testing or manual runs)
  public async manualProcessNonResponses(): Promise<number> {
    try {
      const result = await pool.query('SELECT process_non_response_ratings() as processed_count');
      return result.rows[0].processed_count;
    } catch (error) {
      logger.error('Error in manual non-response processing:', error);
      throw error;
    }
  }

  // Get rating request statistics
  public async getRatingStats(): Promise<any> {
    try {
      const statsQuery = await pool.query(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'responded' THEN 1 END) as responses_received,
          COUNT(CASE WHEN status = 'auto_processed' THEN 1 END) as auto_processed,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
          ROUND(
            COUNT(CASE WHEN status = 'responded' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN status IN ('responded', 'auto_processed', 'expired') THEN 1 END), 0), 2
          ) as response_rate
        FROM RatingRequests
        WHERE request_sent_at >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const platformStats = await pool.query(`
        SELECT 
          integration_platform,
          COUNT(*) as requests,
          COUNT(CASE WHEN status = 'responded' THEN 1 END) as responses,
          ROUND(
            COUNT(CASE WHEN status = 'responded' THEN 1 END) * 100.0 / COUNT(*), 2
          ) as response_rate
        FROM RatingRequests
        WHERE request_sent_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY integration_platform
        ORDER BY requests DESC
      `);

      return {
        overall: statsQuery.rows[0],
        byPlatform: platformStats.rows
      };
    } catch (error) {
      logger.error('Error fetching rating stats:', error);
      throw error;
    }
  }
}

export default RatingProcessor.getInstance();
