/**
 * DASHBOARD LAYOUT API
 * Save and load user's custom dashboard layout
 * Created: October 21, 2025
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Get user ID from JWT token (simplified - you should use your auth middleware)
 */
function getUserIdFromRequest(req: VercelRequest): string | null {
  // TODO: Implement proper JWT verification
  // For now, return from header or query
  return req.headers['x-user-id'] as string || null;
}

/**
 * GET /api/user/dashboard-layout
 * Load user's dashboard layout
 */
async function getDashboardLayout(req: VercelRequest, res: VercelResponse) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      `SELECT dashboard_layout FROM user_preferences WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: { layout: null }, // No saved layout, use default
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        layout: result.rows[0].dashboard_layout,
      },
    });
  } catch (error: any) {
    console.error('Error loading dashboard layout:', error);
    return res.status(500).json({
      error: 'Failed to load dashboard layout',
      details: error.message,
    });
  }
}

/**
 * POST /api/user/dashboard-layout
 * Save user's dashboard layout
 */
async function saveDashboardLayout(req: VercelRequest, res: VercelResponse) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { layout } = req.body;

  if (!layout || !Array.isArray(layout)) {
    return res.status(400).json({ error: 'Invalid layout data' });
  }

  try {
    // Upsert dashboard layout
    await pool.query(
      `INSERT INTO user_preferences (user_id, dashboard_layout, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET dashboard_layout = $2, updated_at = NOW()`,
      [userId, JSON.stringify(layout)]
    );

    return res.status(200).json({
      success: true,
      message: 'Dashboard layout saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving dashboard layout:', error);
    return res.status(500).json({
      error: 'Failed to save dashboard layout',
      details: error.message,
    });
  }
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await getDashboardLayout(req, res);
    } else if (req.method === 'POST') {
      return await saveDashboardLayout(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Dashboard layout API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
