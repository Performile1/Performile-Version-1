/**
 * PERFORMANCE BY LOCATION API
 * Purpose: Fetch courier performance data by location with subscription limits
 * Endpoint: GET /api/analytics/performance-by-location
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

// Helper function to aggregate data by postal code
function aggregateByPostalCode(data: any[]) {
  const grouped = data.reduce((acc, row) => {
    const key = `${row.delivery_postal_code}-${row.courier_id}`;
    if (!acc[key]) {
      acc[key] = {
        courierId: row.courier_id,
        courierName: row.courier_name || 'Unknown',
        postalCode: row.delivery_postal_code,
        city: row.delivery_city,
        country: row.delivery_country,
        displayCount: 0,
        selectionCount: 0
      };
    }
    acc[key].displayCount++;
    if (row.was_selected) {
      acc[key].selectionCount++;
    }
    return acc;
  }, {});

  return Object.values(grouped).map((item: any) => ({
    ...item,
    selectionRate: item.displayCount > 0 
      ? parseFloat((item.selectionCount / item.displayCount * 100).toFixed(1))
      : 0
  }));
}

/**
 * GET /api/analytics/performance-by-location
 * Fetch performance data by location with subscription limits
 * 
 * Query Parameters:
 * - country (required): ISO country code (e.g., 'NO', 'SE')
 * - daysBack (optional): Number of days (default: 30)
 * 
 * Response (Success):
 * {
 *   data: [...],
 *   limits: { maxCountries, maxDays, maxRows, appliedLimits },
 *   subscription: { hasAccess, reason }
 * }
 * 
 * Response (Access Denied):
 * {
 *   error: 'Subscription limit reached',
 *   reason: '...',
 *   limits: { ... },
 *   upgradeUrl: '/subscription-plans',
 *   currentPlan: '...'
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

    // Get query parameters
    const { country, daysBack = '30' } = req.query;
    
    if (!country || typeof country !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Country parameter required' 
      });
    }

    const days = parseInt(daysBack as string);
    if (isNaN(days) || days < 1) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid daysBack parameter' 
      });
    }

    // Admin bypass: Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_role')
      .eq('user_id', user.userId)
      .single();

    const isAdmin = userData?.user_role === 'admin';

    // Check subscription limits using database function (skip for admin)
    let accessCheck: any;
    let accessError: any;

    if (!isAdmin) {
      const result = await supabase
        .rpc('check_performance_view_access', {
          p_user_id: user.userId,
          p_country_code: country,
          p_days_back: days
        });
      accessCheck = result.data;
      accessError = result.error;
    } else {
      // Admin has unlimited access
      accessCheck = [{
        has_access: true,
        reason: 'Admin access - unlimited',
        max_countries: 999,
        max_days: 999,
        max_rows: 999999
      }];
    }

    if (accessError) {
      console.error('Access check error:', accessError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to check access' 
      });
    }

    if (!accessCheck || accessCheck.length === 0) {
      return res.status(500).json({ 
        success: false,
        error: 'Invalid access check response' 
      });
    }

    const access = accessCheck[0];

    // If access denied, return 403 with upgrade info
    if (!access.has_access) {
      // Get user's current plan
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_plans!plan_id (
            plan_name
          )
        `)
        .eq('user_id', user.userId)
        .eq('status', 'active')
        .single();

      const planData = subscription?.subscription_plans as any;
      const currentPlan = planData?.plan_name || 'Starter';

      return res.status(403).json({
        success: false,
        error: 'Subscription limit reached',
        reason: access.reason,
        limits: {
          maxCountries: access.max_countries,
          maxDays: access.max_days,
          maxRows: access.max_rows
        },
        upgradeUrl: '/subscription-plans',
        currentPlan: currentPlan
      });
    }

    // Fetch performance data with limits
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: performanceData, error: dataError } = await supabase
      .from('checkout_courier_analytics')
      .select(`
        courier_id,
        delivery_postal_code,
        delivery_city,
        delivery_country,
        event_timestamp,
        was_selected,
        couriers!courier_id (
          courier_name
        )
      `)
      .eq('delivery_country', country)
      .gte('event_timestamp', startDate.toISOString())
      .order('event_timestamp', { ascending: false })
      .limit(access.max_rows);

    if (dataError) {
      console.error('Data fetch error:', dataError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch data' 
      });
    }

    // Transform data to include courier name
    const transformedData = (performanceData || []).map(row => {
      const courierData = row.couriers as any;
      return {
        courier_id: row.courier_id,
        courier_name: courierData?.courier_name || 'Unknown',
        delivery_postal_code: row.delivery_postal_code,
        delivery_city: row.delivery_city,
        delivery_country: row.delivery_country,
        event_timestamp: row.event_timestamp,
        was_selected: row.was_selected
      };
    });

    // Aggregate by postal code
    const aggregated = aggregateByPostalCode(transformedData);

    // Return data with limits info
    return res.status(200).json({
      success: true,
      data: aggregated,
      limits: {
        maxCountries: access.max_countries,
        maxDays: access.max_days,
        maxRows: access.max_rows,
        appliedLimits: {
          country: country,
          daysBack: days,
          rowsReturned: aggregated.length
        }
      },
      subscription: {
        hasAccess: true,
        reason: access.reason
      }
    });

  } catch (error: any) {
    console.error('Performance API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
}
