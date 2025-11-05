import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { corsMiddleware } from '../middleware/security';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PUBLIC endpoint for fetching subscription plans
 * Used by registration form - NO AUTHENTICATION REQUIRED
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply CORS middleware
  if (!corsMiddleware(req, res)) {
    return; // CORS check failed
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_type } = req.query;

    // Build query
    let query = supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .order('user_type')
      .order('monthly_price');

    // Filter by user type if provided
    if (user_type && (user_type === 'merchant' || user_type === 'courier')) {
      query = query.eq('user_type', user_type);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      plans: data || []
    });
  } catch (error: any) {
    console.error('Public subscription plans error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
