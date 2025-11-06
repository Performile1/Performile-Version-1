/**
 * MARKETS SUMMARY API
 * Purpose: Fetch summary statistics for all available markets
 * Endpoint: GET /api/analytics/markets-summary
 * Created: November 6, 2025
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
 * GET /api/analytics/markets-summary
 * Fetch summary statistics for all markets
 * 
 * Response:
 * {
 *   data: [
 *     {
 *       country: 'NO',
 *       total_orders: 150,
 *       total_couriers: 12,
 *       avg_on_time_rate: 95.5
 *     },
 *     ...
 *   ]
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

    // Query to get market summary statistics
    const { data: marketData, error: marketError } = await supabase
      .from('orders')
      .select(`
        delivery_country,
        order_id,
        courier_id,
        status,
        delivered_at,
        estimated_delivery_date
      `)
      .not('delivery_country', 'is', null);

    if (marketError) {
      console.error('Market data error:', marketError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch market data' 
      });
    }

    // Aggregate data by country
    const marketStats: { [key: string]: any } = {};

    (marketData || []).forEach((order: any) => {
      const country = order.delivery_country;
      
      if (!marketStats[country]) {
        marketStats[country] = {
          country,
          total_orders: 0,
          delivered_orders: 0,
          unique_couriers: new Set(),
          on_time_orders: 0
        };
      }

      marketStats[country].total_orders++;
      
      if (order.courier_id) {
        marketStats[country].unique_couriers.add(order.courier_id);
      }

      if (order.status === 'delivered') {
        marketStats[country].delivered_orders++;
        
        // Check if delivered on time
        if (order.delivered_at && order.estimated_delivery_date) {
          const deliveredDate = new Date(order.delivered_at);
          const estimatedDate = new Date(order.estimated_delivery_date);
          
          if (deliveredDate <= estimatedDate) {
            marketStats[country].on_time_orders++;
          }
        }
      }
    });

    // Transform to array and calculate percentages
    const markets = Object.values(marketStats).map((market: any) => ({
      country: market.country,
      total_orders: market.total_orders,
      total_couriers: market.unique_couriers.size,
      avg_on_time_rate: market.delivered_orders > 0 
        ? (market.on_time_orders / market.delivered_orders) * 100 
        : 0
    }));

    return res.status(200).json({
      success: true,
      data: markets
    });

  } catch (error: any) {
    console.error('Markets summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
