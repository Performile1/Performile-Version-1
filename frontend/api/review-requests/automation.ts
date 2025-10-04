import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Automated Review Request Cron Job
 * This endpoint should be called by a scheduled task (e.g., Vercel Cron, GitHub Actions)
 * to process and send review requests
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const client = await pool.connect();

  try {
    const now = new Date();
    const processedRequests = [];

    // Find orders eligible for review requests
    const eligibleOrdersQuery = `
      SELECT 
        o.order_id,
        o.courier_id,
        o.customer_email,
        o.delivery_date,
        o.order_value,
        c.courier_name,
        s.user_id as merchant_id,
        rrs.settings_id,
        rrs.days_after_delivery,
        rrs.email_enabled,
        rrs.sms_enabled,
        rrs.in_app_enabled,
        rrs.custom_message,
        rrs.custom_subject,
        rrs.min_order_value,
        rrs.only_successful_deliveries,
        rrs.max_requests_per_order
      FROM Orders o
      JOIN Couriers c ON o.courier_id = c.courier_id
      JOIN Stores s ON o.store_id = s.store_id
      LEFT JOIN ReviewRequestSettings rrs ON s.user_id = rrs.user_id
      WHERE o.order_status = 'delivered'
        AND o.delivery_date IS NOT NULL
        AND rrs.auto_request_enabled = TRUE
        AND o.delivery_date + (rrs.days_after_delivery || ' days')::INTERVAL <= NOW()
        AND NOT EXISTS (
          SELECT 1 FROM Reviews r 
          WHERE r.order_id = o.order_id
        )
        AND (
          SELECT COUNT(*) FROM ReviewRequests rr
          WHERE rr.order_id = o.order_id
        ) < rrs.max_requests_per_order
        AND (rrs.min_order_value IS NULL OR o.order_value >= rrs.min_order_value)
      LIMIT 100
    `;

    const eligibleOrders = await client.query(eligibleOrdersQuery);

    for (const order of eligibleOrders.rows) {
      // Check if we should send a reminder
      const lastRequestQuery = `
        SELECT * FROM ReviewRequests
        WHERE order_id = $1
        ORDER BY sent_at DESC
        LIMIT 1
      `;
      
      const lastRequest = await client.query(lastRequestQuery, [order.order_id]);
      
      // If there's a previous request, check if enough time has passed for a reminder
      if (lastRequest.rows.length > 0) {
        const lastSent = new Date(lastRequest.rows[0].sent_at);
        const reminderInterval = await client.query(
          `SELECT reminder_interval_days FROM ReviewRequestSettings WHERE user_id = $1`,
          [order.merchant_id]
        );
        
        const daysSinceLastRequest = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastRequest < reminderInterval.rows[0].reminder_interval_days) {
          continue; // Skip this order, not time for reminder yet
        }
      }

      // Create review request
      const requestQuery = `
        INSERT INTO ReviewRequests (
          order_id,
          requester_id,
          recipient_id,
          request_type,
          channel,
          status,
          scheduled_for,
          message_text,
          subject,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING request_id
      `;

      // Determine channel priority: email > in-app > sms
      let channel = 'email';
      if (!order.email_enabled && order.in_app_enabled) channel = 'in_app';
      else if (!order.email_enabled && !order.in_app_enabled && order.sms_enabled) channel = 'sms';

      const messageText = order.custom_message || 
        `Hi! We'd love to hear about your recent delivery experience with ${order.courier_name}. Your feedback helps us improve our service.`;
      
      const subject = order.custom_subject || 
        'How was your delivery experience?';

      const request = await client.query(requestQuery, [
        order.order_id,
        order.merchant_id,
        order.customer_email, // This should be customer user_id in production
        'automatic',
        channel,
        'pending',
        now,
        messageText,
        subject,
        JSON.stringify({
          delivery_date: order.delivery_date,
          order_value: order.order_value,
          courier_name: order.courier_name
        })
      ]);

      // Send the request based on channel
      if (channel === 'email') {
        await sendEmailReviewRequest(order, messageText, subject);
      } else if (channel === 'in_app') {
        await createInAppNotification(order, messageText);
      } else if (channel === 'sms') {
        await sendSMSReviewRequest(order, messageText);
      }

      // Update request status to sent
      await client.query(
        `UPDATE ReviewRequests 
         SET status = 'sent', sent_at = NOW() 
         WHERE request_id = $1`,
        [request.rows[0].request_id]
      );

      processedRequests.push({
        order_id: order.order_id,
        channel,
        request_id: request.rows[0].request_id
      });
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${processedRequests.length} review requests`,
      data: processedRequests
    });

  } catch (error: any) {
    console.error('Review request automation error:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal server error'
    });
  } finally {
    client.release();
  }
}

// Helper function to send email review request
async function sendEmailReviewRequest(order: any, message: string, subject: string) {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`Sending email review request for order ${order.order_id} to ${order.customer_email}`);
  
  // Example email content
  const emailHTML = `
    <html>
      <body>
        <h2>${subject}</h2>
        <p>${message}</p>
        <p>
          <a href="${process.env.APP_URL}/review/${order.order_id}" 
             style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Leave a Review
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Order ID: ${order.order_id}<br>
          Delivered on: ${new Date(order.delivery_date).toLocaleDateString()}
        </p>
      </body>
    </html>
  `;

  // In production, send actual email here
  // await emailService.send({
  //   to: order.customer_email,
  //   subject: subject,
  //   html: emailHTML
  // });
}

// Helper function to create in-app notification
async function createInAppNotification(order: any, message: string) {
  console.log(`Creating in-app notification for order ${order.order_id}`);
  
  // TODO: Create notification in database
  // await pool.query(
  //   `INSERT INTO Notifications (user_id, type, title, message, link)
  //    VALUES ($1, 'review_request', $2, $3, $4)`,
  //   [order.customer_id, 'Review Request', message, `/review/${order.order_id}`]
  // );
}

// Helper function to send SMS review request
async function sendSMSReviewRequest(order: any, message: string) {
  console.log(`Sending SMS review request for order ${order.order_id}`);
  
  // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  // await smsService.send({
  //   to: order.customer_phone,
  //   message: `${message}\n\nLeave a review: ${process.env.APP_URL}/review/${order.order_id}`
  // });
}
