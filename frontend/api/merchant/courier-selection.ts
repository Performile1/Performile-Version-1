import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

function verifyToken(authHeader: string | undefined): any {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req.headers.authorization);

  if (!user || user.role !== 'merchant') {
    return res.status(403).json({ message: 'Merchant access required' });
  }

  try {
    if (req.method === 'GET') {
      // Get merchant's selected couriers
      const { shop_id } = req.query;

      const result = await pool.query(`
        SELECT 
          sc.shop_courier_id,
          sc.courier_id,
          c.courier_name,
          c.company_name,
          c.logo_url,
          c.trust_score,
          sc.priority_level,
          sc.is_active,
          sc.created_at
        FROM shop_couriers sc
        JOIN couriers c ON sc.courier_id = c.courier_id
        JOIN shops s ON sc.shop_id = s.shop_id
        WHERE s.owner_user_id = $1
          ${shop_id ? 'AND sc.shop_id = $2' : ''}
        ORDER BY sc.priority_level ASC, c.courier_name
      `, shop_id ? [user.user_id, shop_id] : [user.user_id]);

      return res.status(200).json({
        success: true,
        couriers: result.rows
      });

    } else if (req.method === 'POST') {
      // Add courier to shop
      const { shop_id, courier_id, priority_level } = req.body;

      if (!shop_id || !courier_id) {
        return res.status(400).json({
          success: false,
          message: 'Shop ID and Courier ID are required'
        });
      }

      // Verify shop ownership
      const shopCheck = await pool.query(
        'SELECT shop_id FROM shops WHERE shop_id = $1 AND owner_user_id = $2',
        [shop_id, user.user_id]
      );

      if (shopCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not own this shop'
        });
      }

      // Check courier selection limit
      const limitCheck = await pool.query(
        'SELECT * FROM check_courier_selection_limit($1, $2)',
        [user.user_id, shop_id]
      );

      const limit = limitCheck.rows[0];
      
      if (!limit.can_select) {
        return res.status(403).json({
          success: false,
          message: `Courier limit reached. You have ${limit.current_count}/${limit.max_allowed} couriers selected.`,
          error: 'SUBSCRIPTION_LIMIT_REACHED',
          limit_type: 'couriers',
          current_usage: limit.current_count,
          max_allowed: limit.max_allowed,
          plan_name: limit.plan_name,
          tier: limit.tier,
          upgrade_required: true
        });
      }

      // Add courier to shop
      const result = await pool.query(`
        INSERT INTO shop_couriers (shop_id, courier_id, priority_level)
        VALUES ($1, $2, $3)
        ON CONFLICT (shop_id, courier_id) 
        DO UPDATE SET 
          is_active = TRUE,
          priority_level = EXCLUDED.priority_level,
          updated_at = NOW()
        RETURNING *
      `, [shop_id, courier_id, priority_level || 1]);

      return res.status(201).json({
        success: true,
        message: 'Courier added successfully',
        selection: result.rows[0]
      });

    } else if (req.method === 'DELETE') {
      // Remove courier from shop
      const { shop_courier_id } = req.query;

      // Verify ownership
      const ownerCheck = await pool.query(`
        SELECT sc.shop_courier_id 
        FROM shop_couriers sc
        JOIN shops s ON sc.shop_id = s.shop_id
        WHERE sc.shop_courier_id = $1 AND s.owner_user_id = $2
      `, [shop_courier_id, user.user_id]);

      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to remove this courier'
        });
      }

      await pool.query(
        'UPDATE shop_couriers SET is_active = FALSE WHERE shop_courier_id = $1',
        [shop_courier_id]
      );

      return res.status(200).json({
        success: true,
        message: 'Courier removed successfully'
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Courier selection API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}
