import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { period = '7d' } = req.query;
    const days = period === '30d' ? 30 : 7;

    const client = await pool.connect();
    try {
      // Get daily trends for orders, reviews, and trust scores
      const result = await client.query(`
        WITH date_series AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '${days} days',
            CURRENT_DATE,
            '1 day'::interval
          )::date AS date
        ),
        daily_orders AS (
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as orders
          FROM orders
          WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
          GROUP BY DATE(created_at)
        ),
        daily_reviews AS (
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as reviews
          FROM reviews
          WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
          GROUP BY DATE(created_at)
        ),
        daily_trust_scores AS (
          SELECT 
            DATE(COALESCE(last_calculated, updated_at, created_at)) as date,
            AVG(trust_score) as avg_trust_score
          FROM courier_analytics
          WHERE COALESCE(last_calculated, updated_at, created_at) >= CURRENT_DATE - INTERVAL '${days} days'
          GROUP BY DATE(COALESCE(last_calculated, updated_at, created_at))
        )
        SELECT 
          ds.date::text,
          COALESCE(do.orders, 0) as orders,
          COALESCE(dr.reviews, 0) as reviews,
          COALESCE(ROUND(dts.avg_trust_score::numeric, 1), 0) as trust_score
        FROM date_series ds
        LEFT JOIN daily_orders do ON ds.date = do.date
        LEFT JOIN daily_reviews dr ON ds.date = dr.date
        LEFT JOIN daily_trust_scores dts ON ds.date = dts.date
        ORDER BY ds.date
      `);

      return res.status(200).json({
        success: true,
        data: result.rows,
        period: period
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Dashboard trends API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
