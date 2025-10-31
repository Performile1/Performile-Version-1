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
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
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

    // Query claims with JOIN to orders and stores tables
    // This gets courier_id and merchant_id through the order relationship
    console.log('Querying claims trends for:', entity_type, entity_id, 'from', startDateStr);

    // Use database function for optimized query
    const { data, error } = await supabase.rpc('get_claims_trends', {
      p_entity_type: entity_type,
      p_entity_id: entity_id,
      p_start_date: startDateStr
    });

    if (error) {
      console.error('Claims trends query error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch claims trends',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Transform data to match expected format
    const transformedData = (data || []).map((row: any) => ({
      date: row.trend_date,
      total_claims: parseInt(row.total_claims) || 0,
      draft_claims: parseInt(row.draft_claims) || 0,
      submitted_claims: parseInt(row.submitted_claims) || 0,
      under_review_claims: parseInt(row.under_review_claims) || 0,
      approved_claims: parseInt(row.approved_claims) || 0,
      rejected_claims: parseInt(row.rejected_claims) || 0,
      paid_claims: parseInt(row.paid_claims) || 0,
      closed_claims: parseInt(row.closed_claims) || 0,
      total_claimed_amount: parseFloat(row.total_claimed_amount) || 0,
      total_approved_amount: parseFloat(row.total_approved_amount) || 0,
      avg_resolution_days: parseFloat(row.avg_resolution_days) || 0
    }));

    return res.status(200).json({
      success: true,
      data: transformedData,
      meta: {
        entity_type,
        entity_id,
        period,
        tier: userTier,
        days_returned: transformedData.length,
        source: 'join_query',
        start_date: startDateStr
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
