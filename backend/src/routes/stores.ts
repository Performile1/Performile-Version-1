import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import database from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(apiRateLimit);

/**
 * GET /api/stores
 * Get all stores (filtered by user role)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const userRole = (req as any).user?.user_role;
    const { status, search } = req.query;

    let query = `
      SELECT 
        m.*,
        u.email,
        u.first_name,
        u.last_name,
        u.phone_number,
        COUNT(DISTINCT o.order_id) as total_orders,
        AVG(ts.trust_score) as avg_trust_score
      FROM merchants m
      INNER JOIN users u ON m.user_id = u.user_id
      LEFT JOIN orders o ON m.merchant_id = o.merchant_id
      LEFT JOIN trust_scores ts ON m.merchant_id = ts.merchant_id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Role-based filtering
    if (userRole === 'merchant') {
      query += ` AND m.user_id = $${params.length + 1}`;
      params.push(userId);
    }

    // Status filter
    if (status) {
      query += ` AND m.status = $${params.length + 1}`;
      params.push(status);
    }

    // Search filter
    if (search) {
      query += ` AND (
        m.business_name ILIKE $${params.length + 1} OR
        m.store_url ILIKE $${params.length + 1} OR
        u.email ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY m.merchant_id, u.user_id
      ORDER BY m.created_at DESC
    `;

    const result = await database.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching stores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stores',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/stores/:id
 * Get store by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.user_id;
    const userRole = (req as any).user?.user_role;

    let query = `
      SELECT 
        m.*,
        u.email,
        u.first_name,
        u.last_name,
        u.phone_number,
        COUNT(DISTINCT o.order_id) as total_orders,
        AVG(ts.trust_score) as avg_trust_score,
        COUNT(DISTINCT r.review_id) as total_reviews
      FROM merchants m
      INNER JOIN users u ON m.user_id = u.user_id
      LEFT JOIN orders o ON m.merchant_id = o.merchant_id
      LEFT JOIN trust_scores ts ON m.merchant_id = ts.merchant_id
      LEFT JOIN reviews r ON m.merchant_id = r.merchant_id
      WHERE m.merchant_id = $1
    `;

    const params: any[] = [id];

    // Merchants can only view their own store
    if (userRole === 'merchant') {
      query += ` AND m.user_id = $2`;
      params.push(userId);
    }

    query += ` GROUP BY m.merchant_id, u.user_id`;

    const result = await database.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/stores
 * Create new store (merchant only)
 */
router.post('/', requireRole(['merchant', 'admin']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const {
      business_name,
      store_url,
      business_address,
      business_type,
      platform,
      api_key,
      webhook_url
    } = req.body;

    // Validate required fields
    if (!business_name || !store_url) {
      return res.status(400).json({
        success: false,
        message: 'Business name and store URL are required'
      });
    }

    const query = `
      INSERT INTO merchants (
        user_id,
        business_name,
        store_url,
        business_address,
        business_type,
        platform,
        api_key,
        webhook_url,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW())
      RETURNING *
    `;

    const result = await database.query(query, [
      userId,
      business_name,
      store_url,
      business_address || null,
      business_type || 'retail',
      platform || 'custom',
      api_key || null,
      webhook_url || null
    ]);

    logger.info(`Store created: ${result.rows[0].merchant_id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create store',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/stores/:id
 * Update store
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.user_id;
    const userRole = (req as any).user?.user_role;
    const {
      business_name,
      store_url,
      business_address,
      business_type,
      platform,
      api_key,
      webhook_url,
      status
    } = req.body;

    // Check ownership
    const ownershipQuery = `
      SELECT user_id FROM merchants WHERE merchant_id = $1
    `;
    const ownershipResult = await database.query(ownershipQuery, [id]);

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Merchants can only update their own store
    if (userRole === 'merchant' && ownershipResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this store'
      });
    }

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (business_name !== undefined) {
      updateFields.push(`business_name = $${paramCount++}`);
      params.push(business_name);
    }
    if (store_url !== undefined) {
      updateFields.push(`store_url = $${paramCount++}`);
      params.push(store_url);
    }
    if (business_address !== undefined) {
      updateFields.push(`business_address = $${paramCount++}`);
      params.push(business_address);
    }
    if (business_type !== undefined) {
      updateFields.push(`business_type = $${paramCount++}`);
      params.push(business_type);
    }
    if (platform !== undefined) {
      updateFields.push(`platform = $${paramCount++}`);
      params.push(platform);
    }
    if (api_key !== undefined) {
      updateFields.push(`api_key = $${paramCount++}`);
      params.push(api_key);
    }
    if (webhook_url !== undefined) {
      updateFields.push(`webhook_url = $${paramCount++}`);
      params.push(webhook_url);
    }
    if (status !== undefined && userRole === 'admin') {
      updateFields.push(`status = $${paramCount++}`);
      params.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE merchants
      SET ${updateFields.join(', ')}
      WHERE merchant_id = $${paramCount}
      RETURNING *
    `;

    const result = await database.query(query, params);

    logger.info(`Store updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/stores/:id
 * Delete store (admin only)
 */
router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.user_id;

    // Check if store exists
    const checkQuery = `SELECT merchant_id FROM merchants WHERE merchant_id = $1`;
    const checkResult = await database.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Soft delete by setting status to 'deleted'
    const query = `
      UPDATE merchants
      SET status = 'deleted', updated_at = NOW()
      WHERE merchant_id = $1
      RETURNING merchant_id
    `;

    await database.query(query, [id]);

    logger.info(`Store deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete store',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
