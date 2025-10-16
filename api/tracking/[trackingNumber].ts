import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { applySecurityMiddleware } from '../middleware/security';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: false, // Public endpoint for customers
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  const { trackingNumber } = req.query;

  if (!trackingNumber || typeof trackingNumber !== 'string') {
    return res.status(400).json({ error: 'Tracking number is required' });
  }

  if (req.method === 'GET') {
    try {
      // Get tracking info from database
      const result = await pool.query(
        'SELECT * FROM get_tracking_info($1)',
        [trackingNumber]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Tracking information not found',
          message: 'No tracking data available for this number'
        });
      }

      const trackingData = result.rows[0];

      return res.status(200).json({
        success: true,
        data: {
          trackingId: trackingData.tracking_id,
          trackingNumber: trackingData.tracking_number,
          courier: trackingData.courier,
          status: trackingData.status,
          currentLocation: trackingData.current_location,
          estimatedDelivery: trackingData.estimated_delivery,
          actualDelivery: trackingData.actual_delivery,
          events: trackingData.events || [],
        }
      });

    } catch (error: any) {
      console.error('Error fetching tracking:', error);
      return res.status(500).json({
        error: 'Failed to fetch tracking information',
        message: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
