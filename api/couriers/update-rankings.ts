import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

/**
 * Update Courier Rankings API
 * Recalculates dynamic ranking scores for all couriers
 * 
 * POST /api/couriers/update-rankings
 * 
 * Query params:
 * - postal_area: Optional - Update specific postal area only
 * - courier_id: Optional - Update specific courier only
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true, // Requires authentication
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postal_area, courier_id } = req.query;

  try {
    console.log('Starting ranking update...', { postal_area, courier_id });

    // Call the database function to update rankings
    const updateQuery = `
      SELECT update_courier_ranking_scores(
        $1::VARCHAR,  -- postal_area
        $2::UUID      -- courier_id
      ) as updated_count;
    `;

    const result = await pool.query(updateQuery, [
      postal_area || null,
      courier_id || null
    ]);

    const updatedCount = result.rows[0]?.updated_count || 0;

    // Get summary of updated rankings
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT courier_id) as total_couriers,
        COUNT(DISTINCT postal_area) as total_areas,
        AVG(final_ranking_score) as avg_score,
        MAX(final_ranking_score) as max_score,
        MIN(final_ranking_score) as min_score,
        MAX(last_calculated) as last_update
      FROM courier_ranking_scores
      WHERE 
        ($1::VARCHAR IS NULL OR postal_area = $1)
        AND ($2::UUID IS NULL OR courier_id = $2);
    `;

    const summary = await pool.query(summaryQuery, [
      postal_area || null,
      courier_id || null
    ]);

    const stats = summary.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Courier rankings updated successfully',
      updated_count: updatedCount,
      summary: {
        total_couriers: parseInt(stats.total_couriers || '0'),
        total_areas: parseInt(stats.total_areas || '0'),
        avg_score: parseFloat(stats.avg_score || '0').toFixed(4),
        max_score: parseFloat(stats.max_score || '0').toFixed(4),
        min_score: parseFloat(stats.min_score || '0').toFixed(4),
        last_update: stats.last_update
      },
      filters: {
        postal_area: postal_area || 'all',
        courier_id: courier_id || 'all'
      }
    });

  } catch (error: any) {
    console.error('Error updating courier rankings:', error);
    return res.status(500).json({
      error: 'Failed to update courier rankings',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
