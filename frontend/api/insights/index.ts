import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
const { createLogEndpoint } = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Handle logs endpoint (merged from logs/index.ts)
    if (req.url?.includes('/logs') || req.query.action === 'logs') {
      const logHandler = createLogEndpoint();
      return await logHandler(req, res);
    }

    // Handle analytics endpoints
    switch (method) {
      case 'GET':
        if (req.url?.includes('/trustscore')) {
          return await handleTrustScore(req, res);
        } else {
          return await handleMarkets(req, res);
        }
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ 
          success: false, 
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

async function handleMarkets(_req: VercelRequest, res: VercelResponse) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        'logistics' as market,
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT c.courier_id) as active_couriers,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM Orders o
      LEFT JOIN Couriers c ON o.courier_id = c.courier_id
      LEFT JOIN Reviews r ON o.order_id = r.order_id
      WHERE o.created_at >= NOW() - INTERVAL '30 days'
    `;
    
    const result = await client.query(query);
    
    res.status(200).json({
      success: true,
      data: result.rows[0] || {
        market: 'logistics',
        total_orders: 0,
        active_couriers: 0,
        avg_rating: 0,
        total_revenue: 0
      }
    });
  } finally {
    client.release();
  }
}

// TrustScore calculation handler
async function handleTrustScore(req: VercelRequest, res: VercelResponse) {
  try {
    const { courier_id } = req.query;
    
    if (!courier_id) {
      return res.status(400).json({
        success: false,
        message: 'courier_id is required'
      });
    }
    
    const client = await pool.connect();
    
    // Calculate trust score based on multiple factors
    const trustScoreQuery = `
      WITH courier_stats AS (
        SELECT 
          c.courier_id,
          c.courier_name,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as completed_orders,
          AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating ELSE 0 END) as avg_rating,
          COUNT(DISTINCT r.review_id) as total_reviews,
          EXTRACT(DAYS FROM NOW() - c.created_at) as days_active
        FROM couriers c
        LEFT JOIN orders o ON c.courier_id = o.courier_id
        LEFT JOIN reviews r ON o.order_id = r.order_id
        WHERE c.courier_id = $1
        GROUP BY c.courier_id, c.courier_name, c.created_at
      )
      SELECT 
        courier_id,
        courier_name,
        total_orders,
        completed_orders,
        avg_rating,
        total_reviews,
        days_active,
        CASE 
          WHEN total_orders = 0 THEN 50
          ELSE LEAST(100, GREATEST(0, 
            (completed_orders::float / NULLIF(total_orders, 0) * 40) +
            (COALESCE(avg_rating, 0) * 20) +
            (LEAST(total_reviews, 10) * 2) +
            (LEAST(days_active, 365) / 365.0 * 20) +
            (CASE WHEN total_orders >= 10 THEN 10 ELSE total_orders END)
          ))
        END as trust_score
      FROM courier_stats
    `;
    
    const result = await client.query(trustScoreQuery, [courier_id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Courier not found'
      });
    }
    
    const courierData = result.rows[0];
    
    res.status(200).json({
      success: true,
      data: {
        courier_id: courierData.courier_id,
        courier_name: courierData.courier_name,
        trust_score: Math.round(courierData.trust_score),
        metrics: {
          total_orders: courierData.total_orders,
          completed_orders: courierData.completed_orders,
          completion_rate: courierData.total_orders > 0 ? 
            (courierData.completed_orders / courierData.total_orders * 100).toFixed(1) : '0.0',
          avg_rating: parseFloat(courierData.avg_rating || 0).toFixed(1),
          total_reviews: courierData.total_reviews,
          days_active: courierData.days_active
        }
      }
    });
  } catch (error) {
    console.error('TrustScore calculation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
