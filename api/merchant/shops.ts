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
      // Get merchant's shops
      const result = await pool.query(`
        SELECT 
          shop_id,
          shop_name,
          website_url,
          description,
          contact_email,
          contact_phone,
          address,
          city,
          state,
          postal_code,
          country,
          is_active,
          created_at
        FROM shops
        WHERE owner_user_id = $1
        ORDER BY created_at DESC
      `, [user.user_id]);

      return res.status(200).json({
        success: true,
        shops: result.rows
      });

    } else if (req.method === 'POST') {
      // Check shop creation limit
      const limitCheck = await pool.query(
        'SELECT * FROM check_shop_limit($1)',
        [user.user_id]
      );

      const limit = limitCheck.rows[0];
      
      if (!limit.can_create) {
        return res.status(403).json({
          success: false,
          message: `Shop limit reached. You have ${limit.current_count}/${limit.max_allowed} shops.`,
          error: 'SUBSCRIPTION_LIMIT_REACHED',
          limit_type: 'shops',
          current_usage: limit.current_count,
          max_allowed: limit.max_allowed,
          plan_name: limit.plan_name,
          tier: limit.tier,
          upgrade_required: true
        });
      }

      // Create shop
      const {
        shop_name,
        website_url,
        description,
        contact_email,
        contact_phone,
        address,
        city,
        state,
        postal_code,
        country
      } = req.body;

      if (!shop_name) {
        return res.status(400).json({
          success: false,
          message: 'Shop name is required'
        });
      }

      const result = await pool.query(`
        INSERT INTO shops (
          owner_user_id, shop_name, website_url, description,
          contact_email, contact_phone, address, city, state,
          postal_code, country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        user.user_id,
        shop_name,
        website_url || null,
        description || null,
        contact_email || null,
        contact_phone || null,
        address || null,
        city || null,
        state || null,
        postal_code || null,
        country || null
      ]);

      return res.status(201).json({
        success: true,
        message: 'Shop created successfully',
        shop: result.rows[0]
      });

    } else if (req.method === 'PUT') {
      // Update shop
      const { shop_id } = req.query;
      const updateData = req.body;

      // Verify ownership
      const ownerCheck = await pool.query(
        'SELECT shop_id FROM shops WHERE shop_id = $1 AND owner_user_id = $2',
        [shop_id, user.user_id]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not own this shop'
        });
      }

      const result = await pool.query(`
        UPDATE shops
        SET 
          shop_name = COALESCE($1, shop_name),
          website_url = COALESCE($2, website_url),
          description = COALESCE($3, description),
          contact_email = COALESCE($4, contact_email),
          contact_phone = COALESCE($5, contact_phone),
          address = COALESCE($6, address),
          city = COALESCE($7, city),
          state = COALESCE($8, state),
          postal_code = COALESCE($9, postal_code),
          country = COALESCE($10, country),
          updated_at = NOW()
        WHERE shop_id = $11
        RETURNING *
      `, [
        updateData.shop_name,
        updateData.website_url,
        updateData.description,
        updateData.contact_email,
        updateData.contact_phone,
        updateData.address,
        updateData.city,
        updateData.state,
        updateData.postal_code,
        updateData.country,
        shop_id
      ]);

      return res.status(200).json({
        success: true,
        message: 'Shop updated successfully',
        shop: result.rows[0]
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Shops API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}
