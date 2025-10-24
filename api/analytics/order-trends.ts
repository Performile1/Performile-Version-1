/**
 * Order Trends Analytics API
 * Returns daily order aggregations for analytics charts
 * 
 * Phase: Dashboard Analytics - Phase 1.6
 * Created: October 18, 2025, 7:17 PM
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

interface OrderTrendQuery {
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
      return { maxDays: 365 * 10 }; // 10 years
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
    const { entity_type, entity_id, period = '30d' } = req.query as Partial<OrderTrendQuery>;

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
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && user) {
          // Get user's subscription tier
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('subscription_tier')
            .eq('user_id', user.id)
            .single();
          
          if (userError) {
            console.log('Could not fetch subscription tier:', userError.message);
          }
          
          userTier = userData?.subscription_tier || 'tier1';
        }
      } catch (authErr) {
        console.log('Auth error (non-fatal):', authErr);
        // Continue with default tier
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

    // Query order_trends materialized view
    let query = supabase
      .from('order_trends')
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
        error: 'Failed to fetch order trends',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // If no data from materialized view, query orders table directly
    if (!data || data.length === 0) {
      console.log('No data in materialized view, querying orders table directly');
      
      // Build direct query
      let ordersQuery = supabase
        .from('orders')
        .select('created_at, order_status, package_value, shipping_cost, courier_id, store_id')
        .gte('created_at', startDateStr);

      if (entity_type === 'courier') {
        ordersQuery = ordersQuery.eq('courier_id', entity_id);
      } else {
        // For merchant, join with stores table to get owner_user_id (merchant)
        const { data: shops } = await supabase
          .from('stores')
          .select('store_id')
          .eq('owner_user_id', entity_id);
        
        if (shops && shops.length > 0) {
          const shopIds = shops.map(s => s.store_id);
          ordersQuery = ordersQuery.in('store_id', shopIds);
        } else {
          // No shops found for this merchant
          return res.status(200).json({
            success: true,
            data: [],
            meta: {
              entity_type,
              entity_id,
              period,
              tier: userTier,
              days_returned: 0,
              source: 'direct_query'
            }
          });
        }
      }

      const { data: ordersData, error: ordersError } = await ordersQuery;

      if (ordersError) {
        console.error('Orders query error:', ordersError);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch orders',
          details: process.env.NODE_ENV === 'development' ? ordersError.message : undefined
        });
      }

      // Aggregate orders by date
      const aggregated = new Map<string, any>();
      
      ordersData?.forEach(order => {
        const date = order.created_at.split('T')[0];
        
        if (!aggregated.has(date)) {
          aggregated.set(date, {
            date,
            total_orders: 0,
            delivered_orders: 0,
            in_transit_orders: 0,
            pending_orders: 0,
            cancelled_orders: 0,
            total_revenue: 0,
            avg_order_value: 0
          });
        }

        const dayData = aggregated.get(date);
        dayData.total_orders++;
        
        if (order.order_status === 'delivered') dayData.delivered_orders++;
        if (order.order_status === 'in_transit') dayData.in_transit_orders++;
        if (order.order_status === 'pending') dayData.pending_orders++;
        if (order.order_status === 'cancelled') dayData.cancelled_orders++;
        
        const orderValue = parseFloat(order.package_value || 0) + parseFloat(order.shipping_cost || 0);
        dayData.total_revenue += orderValue;
      });

      // Calculate averages
      aggregated.forEach(dayData => {
        dayData.avg_order_value = dayData.total_orders > 0 
          ? dayData.total_revenue / dayData.total_orders 
          : 0;
      });

      const aggregatedData = Array.from(aggregated.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      );

      return res.status(200).json({
        success: true,
        data: aggregatedData,
        meta: {
          entity_type,
          entity_id,
          period,
          tier: userTier,
          days_returned: aggregatedData.length,
          source: 'direct_query'
        }
      });
    }

    // Return data from materialized view
    return res.status(200).json({
      success: true,
      data: data.map(row => ({
        date: row.trend_date,
        total_orders: row.total_orders || 0,
        delivered_orders: row.delivered_orders || 0,
        in_transit_orders: row.in_transit_orders || 0,
        pending_orders: row.pending_orders || 0,
        cancelled_orders: row.cancelled_orders || 0,
        avg_order_value: parseFloat(row.avg_order_value || 0)
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
