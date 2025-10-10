import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { Resend } from 'resend';

const pool = getPool();

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook signature (implement based on courier's webhook security)
  // For now, we'll use a simple API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.WEBHOOK_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { 
    order_id, 
    tracking_number,
    status,
    delivered_at,
    courier_id 
  } = req.body;

  if (!order_id || status !== 'delivered') {
    return res.status(400).json({ 
      error: 'Invalid webhook data',
      message: 'order_id and status=delivered are required'
    });
  }

  try {
    // Update order status
    const updateResult = await pool.query(
      `UPDATE orders 
       SET status = $1, 
           delivered_at = $2,
           updated_at = NOW()
       WHERE order_id = $3
       RETURNING *`,
      [status, delivered_at || new Date(), order_id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = updateResult.rows[0];

    // Check if review request already sent
    if (order.review_request_sent) {
      return res.status(200).json({
        success: true,
        message: 'Order updated, review request already sent'
      });
    }

    // Mark review request as sent and get token
    const tokenResult = await pool.query(
      'SELECT mark_review_request_sent($1) as success',
      [order_id]
    );

    if (!tokenResult.rows[0].success) {
      throw new Error('Failed to generate review token');
    }

    // Get updated order with token
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [order_id]
    );

    const updatedOrder = orderResult.rows[0];

    // Get courier info
    const courierResult = await pool.query(
      'SELECT courier_name, company_name FROM couriers WHERE courier_id = $1',
      [order.courier_id]
    );

    const courier = courierResult.rows[0];

    // Get customer info
    const customerResult = await pool.query(
      'SELECT email, first_name, last_name FROM users WHERE user_id = $1',
      [order.customer_id]
    );

    const customer = customerResult.rows[0];

    if (!customer || !customer.email) {
      return res.status(400).json({ 
        error: 'Customer email not found' 
      });
    }

    // Send review request email
    const reviewUrl = `${process.env.VERCEL_URL || 'https://frontend-two-swart-31.vercel.app'}/#/review/${updatedOrder.review_token}`;

    const emailResult = await resend.emails.send({
      from: 'Performile <reviews@performile.com>',
      to: customer.email,
      subject: `How was your delivery from ${courier?.courier_name || 'your courier'}?`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #1976d2; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .stars { font-size: 30px; color: #ffc107; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Your Delivery is Complete!</h1>
            </div>
            
            <div class="content">
              <p>Hi ${customer.first_name || 'there'},</p>
              
              <p>Your order <strong>#${order.order_number || order_id.substring(0, 8)}</strong> was delivered by <strong>${courier?.courier_name || 'your courier'}</strong>.</p>
              
              <p><strong>How was your experience?</strong></p>
              
              <div class="stars">⭐⭐⭐⭐⭐</div>
              
              <p>Your feedback helps other customers choose the best courier and helps us improve our service.</p>
              
              <div style="text-align: center;">
                <a href="${reviewUrl}" class="button">Rate Your Delivery</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This should only take 30 seconds. Thank you for your time!
              </p>
            </div>
            
            <div class="footer">
              <p>Performile - Trusted Delivery Reviews</p>
              <p>
                <a href="${process.env.VERCEL_URL || 'https://frontend-two-swart-31.vercel.app'}">Visit Performile</a> | 
                <a href="${reviewUrl}">Leave Review</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Review request email sent:', emailResult);

    return res.status(200).json({
      success: true,
      message: 'Order updated and review request sent',
      order_id: order_id,
      review_token: updatedOrder.review_token,
      email_sent: true,
      email_result: emailResult
    });

  } catch (error: any) {
    console.error('Delivery webhook error:', error);
    return res.status(500).json({
      error: 'Failed to process delivery webhook',
      message: error.message
    });
  }
}
