import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { applySecurityMiddleware } from '../middleware/security';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: false, // Public endpoint for checkout
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { merchant_id, postal_code, limit = '5', api_key } = req.query;

  // Require either merchant_id or api_key
  if (!merchant_id && !api_key) {
    return res.status(400).json({ 
      error: 'Missing required parameter',
      message: 'Either merchant_id or api_key is required'
    });
  }

  if (!postal_code || typeof postal_code !== 'string') {
    return res.status(400).json({ 
      error: 'Postal code is required',
      message: 'Please provide a valid postal_code parameter'
    });
  }

  try {
    let merchantId = merchant_id as string;

    // If API key provided, get merchant_id from it
    if (api_key && !merchant_id) {
      const apiKeyResult = await pool.query(
        'SELECT user_id FROM users WHERE api_key = $1 AND user_role = $2',
        [api_key, 'merchant']
      );

      if (apiKeyResult.rows.length === 0) {
        return res.status(401).json({ 
          error: 'Invalid API key',
          message: 'The provided API key is not valid'
        });
      }

      merchantId = apiKeyResult.rows[0].user_id;
    }

    // Get merchant's selected couriers for this postal code
    const query = `
      SELECT * FROM get_merchant_couriers_for_checkout($1, $2, $3)
    `;

    const result = await pool.query(query, [
      merchantId,
      postal_code,
      parseInt(limit as string, 10)
    ]);

    const couriers = result.rows.map(courier => ({
      courier_id: courier.courier_id,
      courier_name: courier.display_name || courier.courier_name,
      company_name: courier.company_name,
      logo_url: courier.logo_url,
      trust_score: parseFloat(courier.trust_score),
      total_reviews: parseInt(courier.total_reviews, 10),
      avg_delivery_time: `${Math.round(courier.avg_delivery_days)}-${Math.round(courier.avg_delivery_days) + 1} days`,
      on_time_percentage: parseFloat(courier.on_time_percentage),
      badge: courier.trust_score >= 4.5 ? 'excellent' : 
             courier.trust_score >= 4.0 ? 'very_good' : 
             courier.trust_score >= 3.5 ? 'good' : 'average'
    }));

    // If no couriers found, merchant hasn't selected any couriers
    if (couriers.length === 0) {
      return res.status(200).json({
        success: true,
        postal_code: postal_code,
        couriers: [],
        total_found: 0,
        message: 'No couriers configured. Please select couriers in your Performile dashboard.'
      });
    }

    return res.status(200).json({
      success: true,
      postal_code: postal_code,
      merchant_id: merchantId,
      couriers: couriers,
      total_found: couriers.length,
      message: `Found ${couriers.length} courier(s) configured for your store.`
    });

  } catch (error: any) {
    console.error('Error fetching merchant couriers:', error);
    return res.status(500).json({
      error: 'Failed to fetch courier ratings',
      message: error.message
    });
  }
}
