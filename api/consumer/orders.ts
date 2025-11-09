import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

/**
 * Get Consumer Orders
 * GET /api/consumer/orders
 * 
 * Query params:
 * - status: string (optional) - filter by status
 * - search: string (optional) - search by order number, tracking, merchant
 * - limit: number (optional, default: 50)
 * - offset: number (optional, default: 0)
 * 
 * SECURITY: Only returns orders where consumer_id = authenticated user
 * 
 * Returns:
 * - orders: array of order objects
 * - total: total count
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = (req as any).user;

  // CRITICAL: Validate user is a consumer
  if (user.user_role !== 'consumer') {
    return res.status(403).json({ 
      error: 'Access denied. Consumer role required.',
      userRole: user.user_role 
    });
  }

  // Parse query parameters
  const { status, search, limit = '50', offset = '0' } = req.query;
  const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100
  const offsetNum = parseInt(offset as string) || 0;

  try {
    // Build WHERE clause
    let whereConditions = ['o.consumer_id = $1'];
    const queryParams: any[] = [user.user_id];
    let paramIndex = 2;

    // Filter by status
    if (status && status !== 'all') {
      whereConditions.push(`o.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Search filter
    if (search) {
      whereConditions.push(`(
        o.order_number ILIKE $${paramIndex} OR
        o.tracking_number ILIKE $${paramIndex} OR
        m.business_name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = await pool.query(
      `SELECT COUNT(*) as total
       FROM orders o
       LEFT JOIN merchantshops m ON o.merchant_id = m.shop_id
       WHERE ${whereClause}`,
      queryParams
    );

    const total = parseInt(countQuery.rows[0]?.total || '0');

    // Get orders with merchant and courier info
    // CRITICAL: WHERE clause ensures consumer_id = authenticated user
    const ordersQuery = await pool.query(
      `SELECT 
        o.order_id,
        o.order_number,
        o.status,
        o.tracking_number,
        o.total_amount,
        o.delivery_address,
        o.estimated_delivery,
        o.created_at,
        o.updated_at,
        o.delivered_at,
        
        -- Merchant info
        m.business_name as merchant_name,
        m.shop_id as merchant_id,
        
        -- Courier info
        u.full_name as courier_name,
        u.user_id as courier_id,
        
        -- Order type
        o.order_type,
        
        -- Payment info
        o.payment_status
        
       FROM orders o
       LEFT JOIN merchantshops m ON o.merchant_id = m.shop_id
       LEFT JOIN users u ON o.courier_id = u.user_id
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limitNum, offsetNum]
    );

    // Log for security audit
    console.log(`[Consumer Orders] User ${user.user_id} fetched ${ordersQuery.rows.length} orders`);

    return res.status(200).json({
      orders: ordersQuery.rows,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + ordersQuery.rows.length < total,
    });

  } catch (error: any) {
    console.error('[Consumer Orders] Error:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch orders',
      message: error.message,
    });
  }
}
