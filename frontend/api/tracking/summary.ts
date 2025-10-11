import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applySecurityMiddleware } from '../middleware/security';
import { getPool } from '../lib/db';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log auth header for debugging
  console.log('[Tracking Summary] Auth header:', req.headers.authorization ? 'Present' : 'Missing');
  
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    console.log('[Tracking Summary] Security check failed');
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = security.user;
  console.log('[Tracking Summary] User authenticated:', user?.userId || user?.user_id);

  try {
    // Check if tracking_data table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tracking_data'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      // Table doesn't exist yet, return empty data
      return res.status(200).json({
        success: true,
        data: {
          total: 0,
          outForDelivery: 0,
          inTransit: 0,
          delivered: 0,
          exceptions: 0,
          recentUpdates: [],
        }
      });
    }

    // Get tracking summary for user's orders
    const summaryQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE td.status = 'out_for_delivery') as out_for_delivery,
        COUNT(*) FILTER (WHERE td.status = 'in_transit') as in_transit,
        COUNT(*) FILTER (WHERE td.status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE td.status IN ('exception', 'failed_delivery')) as exceptions
      FROM tracking_data td
      LEFT JOIN orders o ON td.order_id = o.order_id
      WHERE (o.merchant_id = $1 OR td.order_id IS NULL)
        AND td.status NOT IN ('delivered', 'cancelled')
        AND td.created_at > NOW() - INTERVAL '30 days'
    `;

    const summaryResult = await pool.query(summaryQuery, [user.user_id]);
    const summary = summaryResult.rows[0] || {};

    // Get recent updates
    const updatesQuery = `
      SELECT 
        COALESCE(o.order_id::text, td.tracking_id::text) as order_id,
        td.tracking_number,
        td.status,
        td.last_updated as timestamp
      FROM tracking_data td
      LEFT JOIN orders o ON td.order_id = o.order_id
      WHERE (o.merchant_id = $1 OR td.order_id IS NULL)
      ORDER BY td.last_updated DESC
      LIMIT 10
    `;

    const updatesResult = await pool.query(updatesQuery, [user.user_id]);

    return res.status(200).json({
      success: true,
      data: {
        total: parseInt(summary.total) || 0,
        outForDelivery: parseInt(summary.out_for_delivery) || 0,
        inTransit: parseInt(summary.in_transit) || 0,
        delivered: parseInt(summary.delivered) || 0,
        exceptions: parseInt(summary.exceptions) || 0,
        recentUpdates: updatesResult.rows,
      }
    });

  } catch (error: any) {
    console.error('Error fetching tracking summary:', error);
    return res.status(500).json({
      error: 'Failed to fetch tracking summary',
      message: error.message
    });
  }
}
