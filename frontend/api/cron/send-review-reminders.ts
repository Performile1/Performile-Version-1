import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { sendEmail, generateReviewReminderEmail } from '../utils/email';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron job request (Vercel adds this header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting review reminder cron job...');

    // Find delivery requests that:
    // 1. Were completed 7 days ago
    // 2. Have review link sent
    // 3. Don't have a review yet
    // 4. Haven't had a reminder sent
    const query = `
      SELECT 
        dr.*,
        u.first_name as courier_first_name,
        u.last_name as courier_last_name
      FROM delivery_requests dr
      LEFT JOIN users u ON dr.courier_id = u.user_id
      LEFT JOIN reviews r ON dr.request_id::text = r.order_id
      WHERE dr.status = 'completed'
        AND dr.review_link_sent = true
        AND dr.review_reminder_sent = false
        AND dr.completed_at <= NOW() - INTERVAL '7 days'
        AND r.review_id IS NULL
      LIMIT 100
    `;

    const result = await pool.query(query);
    const deliveryRequests = result.rows;

    console.log(`Found ${deliveryRequests.length} orders needing review reminders`);

    let successCount = 0;
    let failCount = 0;

    for (const dr of deliveryRequests) {
      try {
        // Calculate days since delivery
        const completedDate = new Date(dr.completed_at);
        const now = new Date();
        const daysAgo = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));

        // Generate review link
        const reviewLink = `${process.env.VERCEL_URL || 'https://frontend-two-swart-31.vercel.app'}/review/${dr.request_id}/${dr.review_link_token}`;

        // Get courier name
        const courierName = dr.courier_first_name && dr.courier_last_name
          ? `${dr.courier_first_name} ${dr.courier_last_name}`
          : 'Your courier';

        // Generate email HTML
        const emailHtml = generateReviewReminderEmail({
          customerName: dr.customer_name || 'Valued Customer',
          orderNumber: dr.external_order_id || dr.request_id,
          courierName,
          reviewLink,
          daysAgo
        });

        // Send reminder email
        await sendEmail({
          to: dr.customer_email,
          subject: `Reminder: Share your delivery experience`,
          html: emailHtml
        });

        // Mark reminder as sent
        await pool.query(
          'UPDATE delivery_requests SET review_reminder_sent = true, review_reminder_sent_at = NOW() WHERE request_id = $1',
          [dr.request_id]
        );

        successCount++;
        console.log(`Sent reminder for request ${dr.request_id}`);

      } catch (error) {
        console.error(`Failed to send reminder for request ${dr.request_id}:`, error);
        failCount++;
      }
    }

    console.log(`Review reminder cron job completed. Success: ${successCount}, Failed: ${failCount}`);

    return res.status(200).json({
      success: true,
      message: 'Review reminders sent',
      stats: {
        total: deliveryRequests.length,
        success: successCount,
        failed: failCount
      }
    });

  } catch (error: any) {
    console.error('Review reminder cron job error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send review reminders'
    });
  }
}
