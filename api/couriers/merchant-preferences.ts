import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Helper function to verify JWT token
const verifyToken = (token: string): JWTPayload | null => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('[Merchant Preferences] JWT_SECRET is not set!');
      return null;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    console.log('[Merchant Preferences] Token decoded successfully:', { 
      userId: decoded.userId, 
      role: decoded.role 
    });
    return decoded;
  } catch (error: any) {
    console.error('[Merchant Preferences] Token verification failed:', error.message);
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  console.log('[Merchant Preferences] Token verification result:', { 
    hasUser: !!user, 
    role: user?.role,
    userId: user?.userId 
  });

  if (!user || user.role !== 'merchant') {
    console.log('[Merchant Preferences] Access denied:', { hasUser: !!user, role: user?.role });
    return res.status(403).json({ error: 'Access denied. Merchants only.' });
  }

  const { action } = req.body || {};

  try {
    switch (action) {
      case 'get_subscription_info':
        return await getSubscriptionInfo(req, res, user.userId);
      
      case 'get_selected_couriers':
        return await getSelectedCouriers(req, res, user.userId);
      
      case 'get_available_couriers':
        return await getAvailableCouriers(req, res, user.userId);
      
      case 'add_courier':
        return await addCourier(req, res, user.userId);
      
      case 'remove_courier':
        return await removeCourier(req, res, user.userId);
      
      case 'toggle_courier_active':
        return await toggleCourierActive(req, res, user.userId);
      
      case 'update_courier_order':
        return await updateCourierOrder(req, res, user.userId);
      
      case 'update_courier_settings':
        return await updateCourierSettings(req, res, user.userId);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Error in merchant-preferences API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Get subscription info and usage
async function getSubscriptionInfo(req: VercelRequest, res: VercelResponse, merchantId: string) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT get_merchant_subscription_info($1) as info',
      [merchantId]
    );
    
    return res.status(200).json({
      success: true,
      data: result.rows[0]?.info || {}
    });
  } finally {
    client.release();
  }
}

// Get selected couriers for merchant
async function getSelectedCouriers(req: VercelRequest, res: VercelResponse, merchantId: string) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        selection_id,
        courier_id,
        courier_name,
        logo_url,
        trust_score,
        reliability_score,
        total_deliveries,
        display_order,
        is_active,
        custom_name,
        custom_description,
        priority_level,
        created_at
      FROM vw_merchant_courier_preferences
      WHERE merchant_id = $1
      ORDER BY display_order ASC, trust_score DESC
    `, [merchantId]);
    
    return res.status(200).json({
      success: true,
      couriers: result.rows
    });
  } finally {
    client.release();
  }
}

// Get available couriers for merchant
async function getAvailableCouriers(req: VercelRequest, res: VercelResponse, merchantId: string) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM get_available_couriers_for_merchant($1)',
      [merchantId]
    );
    
    return res.status(200).json({
      success: true,
      couriers: result.rows
    });
  } finally {
    client.release();
  }
}

// Add courier to merchant's selection
async function addCourier(req: VercelRequest, res: VercelResponse, merchantId: string) {
  const { courier_id } = req.body;
  
  if (!courier_id) {
    return res.status(400).json({ error: 'courier_id is required' });
  }
  
  const client = await pool.connect();
  
  try {
    // Check if limit allows adding more couriers
    const limitCheck = await client.query(
      'SELECT check_courier_selection_limit($1) as can_add',
      [merchantId]
    );
    
    if (!limitCheck.rows[0]?.can_add) {
      return res.status(403).json({ 
        error: 'Courier limit reached',
        message: 'You have reached your subscription limit for courier selections. Please upgrade your plan to add more couriers.'
      });
    }
    
    // Get current max display_order
    const orderResult = await client.query(`
      SELECT COALESCE(MAX(display_order), -1) + 1 as next_order
      FROM merchant_courier_selections
      WHERE merchant_id = $1
    `, [merchantId]);
    
    const nextOrder = orderResult.rows[0].next_order;
    
    // Add courier
    await client.query(`
      INSERT INTO merchant_courier_selections (merchant_id, courier_id, display_order, is_active)
      VALUES ($1, $2, $3, TRUE)
      ON CONFLICT (merchant_id, courier_id) DO NOTHING
    `, [merchantId, courier_id, nextOrder]);
    
    return res.status(200).json({
      success: true,
      message: 'Courier added successfully'
    });
  } catch (error: any) {
    if (error.message.includes('limit reached')) {
      return res.status(403).json({ 
        error: 'Courier limit reached',
        message: error.message
      });
    }
    throw error;
  } finally {
    client.release();
  }
}

// Remove courier from merchant's selection
async function removeCourier(req: VercelRequest, res: VercelResponse, merchantId: string) {
  const { courier_id } = req.body;
  
  if (!courier_id) {
    return res.status(400).json({ error: 'courier_id is required' });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query(`
      DELETE FROM merchant_courier_selections
      WHERE merchant_id = $1 AND courier_id = $2
    `, [merchantId, courier_id]);
    
    return res.status(200).json({
      success: true,
      message: 'Courier removed successfully'
    });
  } finally {
    client.release();
  }
}

// Toggle courier active status
async function toggleCourierActive(req: VercelRequest, res: VercelResponse, merchantId: string) {
  const { courier_id, is_active } = req.body;
  
  if (!courier_id || typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'courier_id and is_active are required' });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query(`
      UPDATE merchant_courier_selections
      SET is_active = $1, updated_at = NOW()
      WHERE merchant_id = $2 AND courier_id = $3
    `, [is_active, merchantId, courier_id]);
    
    return res.status(200).json({
      success: true,
      message: `Courier ${is_active ? 'enabled' : 'disabled'} successfully`
    });
  } finally {
    client.release();
  }
}

// Update courier display order
async function updateCourierOrder(req: VercelRequest, res: VercelResponse, merchantId: string) {
  const { courier_orders } = req.body;
  
  if (!Array.isArray(courier_orders)) {
    return res.status(400).json({ error: 'courier_orders array is required' });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const item of courier_orders) {
      await client.query(`
        UPDATE merchant_courier_selections
        SET display_order = $1, updated_at = NOW()
        WHERE merchant_id = $2 AND courier_id = $3
      `, [item.display_order, merchantId, item.courier_id]);
    }
    
    await client.query('COMMIT');
    
    return res.status(200).json({
      success: true,
      message: 'Courier order updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Update courier custom settings
async function updateCourierSettings(req: VercelRequest, res: VercelResponse, merchantId: string) {
  const { courier_id, custom_name, custom_description, priority_level } = req.body;
  
  if (!courier_id) {
    return res.status(400).json({ error: 'courier_id is required' });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query(`
      UPDATE merchant_courier_selections
      SET 
        custom_name = $1,
        custom_description = $2,
        priority_level = $3,
        updated_at = NOW()
      WHERE merchant_id = $4 AND courier_id = $5
    `, [custom_name, custom_description, priority_level || 0, merchantId, courier_id]);
    
    return res.status(200).json({
      success: true,
      message: 'Courier settings updated successfully'
    });
  } finally {
    client.release();
  }
}
