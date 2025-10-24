/**
 * Claims Trends Analytics API
 * Returns daily claim aggregations for analytics charts
 * 
 * Phase: Dashboard Analytics - Phase 1.6
 * Created: October 18, 2025, 7:19 PM
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

interface ClaimTrendQuery {
  entity_type: 'courier' | 'merchant';
  entity_id: string;
  period: '7d' | '30d' | '90d' | '1y';
}

// Get subscription tier limits
const getTierLimits = (tier: string = 'tier1') => {
  switch (tier) {
    case 'tier1':
      return { maxDays: 7 };
    case 'tier2':
      return { maxDays: 30 };
    case 'tier3':
      return { maxDays: 365 * 10 };
    default:
      return { maxDays: 7 };
  }
};

// Convert period to days
const periodToDays = (period: string): number => {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    default: return 7;
  }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Get query parameters
    const { entity_type, entity_id, period = '30d' } = req.query as Partial<ClaimTrendQuery>;

    // Validate required parameters
    if (!entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: entity_type and entity_id'
      });
    }

    if (!['courier', 'merchant'].includes(entity_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity_type. Must be "courier" or "merchant"'
      });
    }

    // Get user's subscription tier from auth token
    const authHeader = req.headers.authorization;
    let userTier = 'tier1';
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_tier')
          .eq('user_id', user.id)
          .single();
        
        userTier = userData?.subscription_tier || 'tier1';
      }
    }

    // Apply tier limits
    const limits = getTierLimits(userTier);
    const requestedDays = periodToDays(period as string);
    const allowedDays = Math.min(requestedDays, limits.maxDays);

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - allowedDays);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Query claim_trends materialized view
    let query = supabase
      .from('claim_trends')
      .select('*')
      .gte('trend_date', startDateStr)
      .order('trend_date', { ascending: true });

    // Filter by entity type
    if (entity_type === 'courier') {
      query = query.eq('courier_id', entity_id);
    } else {
      query = query.eq('merchant_id', entity_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch claim trends',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // If no data from materialized view, return empty data
    // Note: Claims table doesn't have courier_id/merchant_id columns directly
    // Would need to join with orders table, but for now return empty to avoid 500 error
    if (!data || data.length === 0) {
      console.log('No data in materialized view, returning empty data');
      
      return res.status(200).json({
        success: true,
        data: [],
        meta: {
          entity_type,
          entity_id,
          period,
          tier: userTier,
          days_returned: 0,
          source: 'no_data',
          message: 'No claims data available for this period'
        }
      });
    }

    // Fallback code (kept for reference but won't execute)
    if (false) {
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select('created_at')
        .gte('created_at', startDateStr)
        .limit(1);

      // This code is disabled - see above
    }

    // Return data from materialized view
    return res.status(200).json({
      success: true,
      data: data.map(row => ({
        date: row.trend_date,
        total_claims: row.total_claims || 0,
        open_claims: row.open_claims || 0,
        in_review_claims: row.in_review_claims || 0,
        approved_claims: row.approved_claims || 0,
        declined_claims: row.declined_claims || 0,
        closed_claims: row.closed_claims || 0,
        avg_resolution_days: parseFloat(row.avg_resolution_days || 0)
      })),
      meta: {
        entity_type,
        entity_id,
        period,
        tier: userTier,
        days_returned: data.length,
        source: 'materialized_view'
      }
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
