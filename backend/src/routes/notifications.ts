import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import database from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(apiRateLimit);

/**
 * GET /api/notifications
 * Get notifications for the logged-in user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { unread_only, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        notification_id,
        user_id,
        type,
        title,
        message,
        data,
        is_read,
        created_at,
        read_at
      FROM notifications
      WHERE user_id = $1
    `;

    const params: any[] = [userId];

    if (unread_only === 'true') {
      query += ` AND is_read = false`;
    }

    query += `
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await database.query(query, params);

    // Get unread count
    const countQuery = `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;
    const countResult = await database.query(countQuery, [userId]);

    res.json({
      success: true,
      data: result.rows,
      unread_count: parseInt(countResult.rows[0].unread_count),
      total: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;

    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;

    const result = await database.query(query, [userId]);

    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification (internal use or admin)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      type,
      title,
      message,
      data
    } = req.body;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'user_id, type, title, and message are required'
      });
    }

    const query = `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        is_read,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, false, NOW())
      RETURNING *
    `;

    const result = await database.query(query, [
      user_id,
      type,
      title,
      message,
      data ? JSON.stringify(data) : null
    ]);

    logger.info(`Notification created for user ${user_id}: ${type}`);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.user_id;

    // Check ownership
    const checkQuery = `
      SELECT user_id FROM notifications WHERE notification_id = $1
    `;
    const checkResult = await database.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }

    const query = `
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE notification_id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;

    const query = `
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE user_id = $1 AND is_read = false
      RETURNING notification_id
    `;

    const result = await database.query(query, [userId]);

    res.json({
      success: true,
      message: `Marked ${result.rows.length} notifications as read`,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.user_id;

    // Check ownership
    const checkQuery = `
      SELECT user_id FROM notifications WHERE notification_id = $1
    `;
    const checkResult = await database.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    const query = `
      DELETE FROM notifications
      WHERE notification_id = $1
    `;

    await database.query(query, [id]);

    logger.info(`Notification deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/notifications/clear-all
 * Delete all read notifications
 */
router.delete('/clear-all', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;

    const query = `
      DELETE FROM notifications
      WHERE user_id = $1 AND is_read = true
      RETURNING notification_id
    `;

    const result = await database.query(query, [userId]);

    logger.info(`Cleared ${result.rows.length} notifications for user ${userId}`);

    res.json({
      success: true,
      message: `Cleared ${result.rows.length} read notifications`,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
