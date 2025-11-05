import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get user from auth header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const merchantId = user.id;

  try {
    const { courier_id, service_type, base_price } = req.body;

    // Validation
    if (!courier_id || !service_type || base_price === undefined) {
      return res.status(400).json({ 
        error: 'courier_id, service_type, and base_price required' 
      });
    }

    if (base_price < 0) {
      return res.status(400).json({ error: 'base_price must be positive' });
    }

    // Call the calculate_final_price function
    const { data, error } = await supabase.rpc('calculate_final_price', {
      p_merchant_id: merchantId,
      p_courier_id: courier_id,
      p_service_type: service_type,
      p_base_price: base_price
    });

    if (error) {
      throw error;
    }

    // The function returns a single row
    const result = Array.isArray(data) ? data[0] : data;

    return res.status(200).json({
      success: true,
      calculation: {
        base_price: parseFloat(result.base_price),
        margin_type: result.margin_type,
        margin_value: parseFloat(result.margin_value),
        margin_amount: parseFloat(result.margin_amount),
        final_price: parseFloat(result.final_price),
        rounded_price: parseFloat(result.rounded_price),
        savings: parseFloat(result.base_price) - parseFloat(result.rounded_price) < 0 
          ? Math.abs(parseFloat(result.base_price) - parseFloat(result.rounded_price))
          : 0
      }
    });
  } catch (error: any) {
    console.error('Price calculation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
