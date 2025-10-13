import { Router, Request, Response } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import database from '../config/database';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/reviews
 * Submit a review (public endpoint, no auth required)
 */
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      order_id,
      courier_id,
      rating,
      review_text,
      delivery_speed,
      package_condition,
      communication,
      professionalism,
      reviewer_name,
      reviewer_email
    } = req.body;

    logger.info('[Reviews] Submit review', { order_id, courier_id, rating });

    // Validate required fields
    if (!courier_id || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Courier ID and rating are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Check if review already exists for this order
    if (order_id) {
      const existingReview = await database.query(
        'SELECT review_id FROM reviews WHERE order_id = $1',
        [order_id]
      );

      if (existingReview.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Review already submitted for this order'
        });
      }
    }

    // Insert review
    const result = await database.query(
      `INSERT INTO reviews 
       (order_id, courier_id, rating, review_text, delivery_speed, 
        package_condition, communication, professionalism, 
        reviewer_name, reviewer_email, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
       RETURNING review_id, created_at`,
      [
        order_id || null,
        courier_id,
        rating,
        review_text || null,
        delivery_speed || null,
        package_condition || null,
        communication || null,
        professionalism || null,
        reviewer_name || 'Anonymous',
        reviewer_email || null
      ]
    );

    // Update courier's average rating
    await updateCourierRating(courier_id);

    res.json({
      success: true,
      review_id: result.rows[0].review_id,
      message: 'Review submitted successfully. Thank you for your feedback!'
    });
  } catch (error) {
    logger.error('[Reviews] Submit review error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit review'
    });
  }
});

/**
 * GET /api/reviews/courier/:courierId
 * Get reviews for a specific courier
 */
router.get('/courier/:courierId', async (req: Request, res: Response) => {
  try {
    const { courierId } = req.params;
    const { page = '1', limit = '10', status = 'approved' } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    logger.info('[Reviews] Get courier reviews', { courierId, page, limit });

    // Get total count
    const countResult = await database.query(
      'SELECT COUNT(*) as total FROM reviews WHERE courier_id = $1 AND status = $2',
      [courierId, status]
    );

    // Get reviews
    const reviewsResult = await database.query(
      `SELECT 
        review_id,
        order_id,
        rating,
        review_text,
        delivery_speed,
        package_condition,
        communication,
        professionalism,
        reviewer_name,
        created_at
      FROM reviews
      WHERE courier_id = $1 AND status = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4`,
      [courierId, status, parseInt(limit as string), offset]
    );

    // Get rating summary
    const summaryResult = await database.query(
      `SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 2) as avg_rating,
        ROUND(AVG(delivery_speed), 2) as avg_delivery_speed,
        ROUND(AVG(package_condition), 2) as avg_package_condition,
        ROUND(AVG(communication), 2) as avg_communication,
        ROUND(AVG(professionalism), 2) as avg_professionalism,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews
      WHERE courier_id = $1 AND status = 'approved'`,
      [courierId]
    );

    res.json({
      success: true,
      reviews: reviewsResult.rows,
      summary: summaryResult.rows[0],
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('[Reviews] Get courier reviews error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

/**
 * GET /api/reviews/order/:orderId
 * Get review for a specific order
 */
router.get('/order/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    logger.info('[Reviews] Get order review', { orderId });

    const result = await database.query(
      `SELECT 
        r.review_id,
        r.rating,
        r.review_text,
        r.delivery_speed,
        r.package_condition,
        r.communication,
        r.professionalism,
        r.reviewer_name,
        r.status,
        r.created_at,
        c.courier_id,
        u.first_name as courier_first_name,
        u.last_name as courier_last_name
      FROM reviews r
      JOIN couriers c ON r.courier_id = c.courier_id
      JOIN users u ON c.user_id = u.user_id
      WHERE r.order_id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        review: null,
        message: 'No review found for this order'
      });
    }

    res.json({
      success: true,
      review: result.rows[0]
    });
  } catch (error) {
    logger.error('[Reviews] Get order review error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review'
    });
  }
});

/**
 * PUT /api/reviews/:reviewId/status
 * Update review status (admin only)
 */
router.put('/:reviewId/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.user_role;
    const { reviewId } = req.params;
    const { status } = req.body;

    // Only admin can update review status
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin only.'
      });
    }

    logger.info('[Reviews] Update review status', { reviewId, status });

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const result = await database.query(
      `UPDATE reviews 
       SET status = $1, updated_at = NOW()
       WHERE review_id = $2
       RETURNING courier_id`,
      [status, reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Update courier rating if approved/rejected
    if (status === 'approved' || status === 'rejected') {
      await updateCourierRating(result.rows[0].courier_id);
    }

    res.json({
      success: true,
      message: `Review ${status} successfully`
    });
  } catch (error) {
    logger.error('[Reviews] Update review status error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update review status'
    });
  }
});

/**
 * DELETE /api/reviews/:reviewId
 * Delete review (admin only)
 */
router.delete('/:reviewId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.user_role;
    const { reviewId } = req.params;

    // Only admin can delete reviews
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin only.'
      });
    }

    logger.info('[Reviews] Delete review', { reviewId });

    const result = await database.query(
      'DELETE FROM reviews WHERE review_id = $1 RETURNING courier_id',
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Update courier rating
    await updateCourierRating(result.rows[0].courier_id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    logger.error('[Reviews] Delete review error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete review'
    });
  }
});

/**
 * Helper: Update courier's average rating
 */
async function updateCourierRating(courierId: string) {
  try {
    const result = await database.query(
      `SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 2) as avg_rating
      FROM reviews
      WHERE courier_id = $1 AND status = 'approved'`,
      [courierId]
    );

    const { total_reviews, avg_rating } = result.rows[0];

    await database.query(
      `UPDATE couriers 
       SET average_rating = $1,
           total_reviews = $2,
           updated_at = NOW()
       WHERE courier_id = $3`,
      [avg_rating || 0, total_reviews || 0, courierId]
    );

    logger.info('[Reviews] Updated courier rating', { 
      courierId, 
      avg_rating, 
      total_reviews 
    });
  } catch (error) {
    logger.error('[Reviews] Update courier rating error', error);
  }
}

export default router;
