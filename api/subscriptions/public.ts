/**
 * PUBLIC SUBSCRIPTIONS API
 * Purpose: Fetch subscription plans without authentication
 * Endpoint: GET /api/subscriptions/public
 * Created: October 20, 2025
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/subscriptions/public
 * Fetch all active subscription plans (no authentication required)
 * 
 * Query Parameters:
 * - user_type: 'merchant' | 'courier' (optional) - Filter by user type
 * 
 * Response:
 * {
 *   success: true,
 *   plans: SubscriptionPlan[]
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { user_type } = req.query;

    // Build query - select specific columns
    let query = supabase
      .from('subscription_plans')
      .select(`
        plan_id,
        plan_name,
        plan_slug,
        description,
        user_type,
        tier,
        monthly_price,
        annual_price,
        features,
        max_orders_per_month,
        max_emails_per_month,
        max_sms_per_month,
        max_push_notifications_per_month,
        max_couriers,
        max_team_members,
        max_shops,
        is_popular,
        is_active,
        display_order,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('user_type', { ascending: true })
      .order('tier', { ascending: true });

    // Filter by user type if provided
    if (user_type && (user_type === 'merchant' || user_type === 'courier')) {
      query = query.eq('user_type', user_type);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }

    // Return plans
    return res.status(200).json({
      success: true,
      plans: plans || [],
      count: (plans || []).length,
    });

  } catch (error: any) {
    console.error('Public subscriptions API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans',
      message: error.message,
    });
  }
}

/**
 * Alternative export for different server setups
 */
export const getPublicPlans = handler;
