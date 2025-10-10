import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { review_token, rating, comment } = req.body;

  if (!review_token || !rating) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'review_token and rating are required'
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ 
      error: 'Invalid rating',
      message: 'Rating must be between 1 and 5'
    });
  }

  try {
    // Get order info
    const orderQuery = `
      SELECT 
        o.order_id,
        o.customer_id,
        o.courier_id,
        o.merchant_id,
        o.review_submitted
      FROM orders o
      WHERE o.review_token = $1
        AND o.review_request_sent = TRUE
        AND o.status = 'delivered';
    `;

    const orderResult = await pool.query(orderQuery, [review_token]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired review link'
      });
    }

    const order = orderResult.rows[0];

    if (order.review_submitted) {
      return res.status(400).json({
        success: false,
        message: 'Review already submitted for this order'
      });
    }

    // Create review
    const reviewQuery = `
      INSERT INTO reviews (
        order_id,
        customer_id,
        courier_id,
        merchant_id,
        rating,
        comment,
        is_verified,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING review_id;
    `;

    const reviewResult = await pool.query(reviewQuery, [
      order.order_id,
      order.customer_id,
      order.courier_id,
      order.merchant_id,
      rating,
      comment || null,
      true // Verified because it came from delivery confirmation
    ]);

    const reviewId = reviewResult.rows[0].review_id;

    // Mark review as submitted
    await pool.query(
      'SELECT mark_review_submitted($1)',
      [review_token]
    );

    // Update courier TrustScore
    await pool.query(
      `UPDATE couriers 
       SET trust_score = (
         SELECT AVG(rating) 
         FROM reviews 
         WHERE courier_id = $1
       )
       WHERE courier_id = $1`,
      [order.courier_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Review submitted successfully',
      review_id: reviewId
    });

  } catch (error: any) {
    console.error('Error submitting review:', error);
    return res.status(500).json({
      error: 'Failed to submit review',
      message: error.message
    });
  }
}
