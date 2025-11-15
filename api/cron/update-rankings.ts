import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Daily Courier Rankings Update Cron Job
 * Runs daily at midnight to update courier rankings
 * 
 * GET /api/cron/update-rankings
 * 
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-rankings",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 * 
 * Authorization: Requires CRON_SECRET environment variable
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret for security
  const cronSecret = req.headers['authorization'];
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startTime = Date.now();

  try {
    console.log('🕐 Starting daily ranking update...');

    // Step 1: Update all courier ranking scores
    console.log('📊 Updating ranking scores...');
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_courier_ranking_scores', {
        p_postal_code: null,
        p_courier_id: null
      });

    if (updateError) {
      console.error('Error updating ranking scores:', updateError);
      return res.status(500).json({
        error: 'Failed to update ranking scores',
        message: updateError.message
      });
    }

    const updatedCount = updateResult || 0;
    console.log(`✅ Updated ${updatedCount} courier rankings`);

    // Step 2: Save daily snapshot to history
    console.log('📸 Saving ranking snapshot...');
    const { data: snapshotResult, error: snapshotError } = await supabase
      .rpc('save_ranking_snapshot');

    if (snapshotError) {
      console.error('Error saving snapshot:', snapshotError);
      // Don't fail the request, ranking update was successful
    }

    const snapshotCount = snapshotResult || 0;
    console.log(`✅ Saved ${snapshotCount} ranking snapshots`);

    // Step 3: Get summary statistics
    const { data: stats, error: statsError } = await supabase
      .from('courier_ranking_scores')
      .select('courier_id, postal_area, final_ranking_score, last_calculated')
      .order('final_ranking_score', { ascending: false })
      .limit(10);

    if (statsError) {
      console.error('Error fetching stats:', statsError);
    }

    // Step 4: Calculate execution time
    const executionTime = Date.now() - startTime;

    // Step 5: Log to database (optional - for monitoring)
    const logEntry = {
      job_name: 'update_courier_rankings',
      status: 'success',
      updated_count: updatedCount,
      snapshot_count: snapshotCount,
      execution_time_ms: executionTime,
      executed_at: new Date().toISOString()
    };

    console.log('✅ Cron job completed:', logEntry);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Courier rankings updated successfully',
      execution_time_ms: executionTime,
      results: {
        rankings_updated: updatedCount,
        snapshots_saved: snapshotCount,
        top_couriers: stats?.slice(0, 5).map(s => ({
          courier_id: s.courier_id,
          postal_area: s.postal_area || 'all',
          score: parseFloat(s.final_ranking_score || '0').toFixed(4),
          last_updated: s.last_calculated
        })) || []
      },
      next_run: 'Tomorrow at midnight UTC'
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    console.error('❌ Cron job failed:', error);

    // Log failure (optional - for monitoring)
    const logEntry = {
      job_name: 'update_courier_rankings',
      status: 'failed',
      error_message: error.message,
      execution_time_ms: executionTime,
      executed_at: new Date().toISOString()
    };

    console.error('Failed cron job:', logEntry);

    return res.status(500).json({
      error: 'Cron job failed',
      message: error.message,
      execution_time_ms: executionTime,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
