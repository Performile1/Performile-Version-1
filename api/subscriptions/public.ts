/**
 * PUBLIC SUBSCRIPTIONS API
 * Purpose: Fetch subscription plans without authentication
 * Endpoint: GET /api/subscriptions/public
 * Created: October 20, 2025
 */

import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
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
export default async function handler(req: Request, res: Response) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { user_type } = req.query;

    // Build query
    let query = supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price', { ascending: true });

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
      count: plans?.length || 0,
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
