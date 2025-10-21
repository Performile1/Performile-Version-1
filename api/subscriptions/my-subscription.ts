/**
 * MY SUBSCRIPTION API
 * Purpose: Fetch current user's subscription details
 * Endpoint: GET /api/subscriptions/my-subscription
 * Created: October 21, 2025
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Verify JWT token
function verifyToken(authHeader: string | undefined): any {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/subscriptions/my-subscription
 * Fetch current user's subscription details
 * 
 * Response:
 * {
 *   success: true,
 *   subscription: {
 *     plan_name, tier, prices, limits, usage, etc.
 *   }
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
    // Verify authentication
    const user = verifyToken(req.headers.authorization);
    
    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Fetch user's active subscription
    const { data: userSubscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        subscription_id,
        subscription_plan_id,
        status,
        current_period_start,
        current_period_end,
        orders_used_this_month,
        cancel_at_period_end,
        stripe_subscription_id
      `)
      .eq('user_id', user.userId)
      .eq('status', 'active')
      .single();

    if (subError || !userSubscription) {
      console.error('No active subscription found:', subError);
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
        message: 'You do not have an active subscription. Please subscribe to a plan.'
      });
    }

    // Fetch plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_id', userSubscription.subscription_plan_id)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }

    // Determine billing cycle (default to monthly if not specified)
    const billingCycle = userSubscription.stripe_subscription_id?.includes('year') ? 'yearly' : 'monthly';

    // Combine subscription and plan data
    const subscriptionData = {
      // Plan details
      plan_name: plan.plan_name,
      plan_slug: plan.plan_slug,
      user_type: plan.user_type,
      tier: plan.tier,
      monthly_price: plan.monthly_price,
      annual_price: plan.annual_price,
      
      // Subscription details
      status: userSubscription.status,
      billing_cycle: billingCycle,
      current_period_start: userSubscription.current_period_start,
      current_period_end: userSubscription.current_period_end,
      cancel_at_period_end: userSubscription.cancel_at_period_end,
      
      // Limits
      max_orders_per_month: plan.max_orders_per_month,
      max_emails_per_month: plan.max_emails_per_month,
      max_sms_per_month: plan.max_sms_per_month,
      max_shops: plan.max_shops,
      max_couriers: plan.max_couriers,
      max_team_members: plan.max_team_members,
      
      // Usage
      orders_used_this_month: userSubscription.orders_used_this_month || 0,
      
      // Features (from JSONB)
      features: plan.features || [],
    };

    return res.status(200).json({
      success: true,
      subscription: subscriptionData
    });

  } catch (error: any) {
    console.error('My subscription API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription',
      message: error.message
    });
  }
}
