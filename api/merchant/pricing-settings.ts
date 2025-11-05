import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    switch (req.method) {
      case 'GET':
        return await getPricingSettings(merchantId, res);
      case 'POST':
        return await updatePricingSettings(merchantId, req.body, res);
      case 'PUT':
        return await updatePricingSettings(merchantId, req.body, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Pricing settings error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get merchant pricing settings
async function getPricingSettings(merchantId: string, res: VercelResponse) {
  const { data, error } = await supabase
    .from('merchant_pricing_settings')
    .select('*')
    .eq('merchant_id', merchantId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    throw error;
  }

  // Return default settings if none exist
  if (!data) {
    return res.status(200).json({
      success: true,
      settings: {
        default_margin_type: 'percentage',
        default_margin_value: 0,
        round_prices: true,
        round_to: 1.00,
        min_delivery_price: null,
        max_delivery_price: null,
        show_original_price: false,
        show_savings: true,
        currency: 'NOK'
      }
    });
  }

  return res.status(200).json({
    success: true,
    settings: data
  });
}

// Update merchant pricing settings
async function updatePricingSettings(
  merchantId: string,
  body: any,
  res: VercelResponse
) {
  const {
    default_margin_type,
    default_margin_value,
    round_prices,
    round_to,
    min_delivery_price,
    max_delivery_price,
    show_original_price,
    show_savings,
    currency
  } = body;

  // Validation
  if (default_margin_type && !['percentage', 'fixed'].includes(default_margin_type)) {
    return res.status(400).json({ error: 'Invalid margin type' });
  }

  if (default_margin_value !== undefined && default_margin_value < 0) {
    return res.status(400).json({ error: 'Margin value must be positive' });
  }

  if (round_to !== undefined && round_to <= 0) {
    return res.status(400).json({ error: 'Round to must be positive' });
  }

  if (min_delivery_price !== undefined && min_delivery_price < 0) {
    return res.status(400).json({ error: 'Min price must be positive' });
  }

  if (max_delivery_price !== undefined && min_delivery_price !== undefined) {
    if (max_delivery_price < min_delivery_price) {
      return res.status(400).json({ error: 'Max price must be >= min price' });
    }
  }

  // Upsert settings
  const { data, error } = await supabase
    .from('merchant_pricing_settings')
    .upsert({
      merchant_id: merchantId,
      default_margin_type,
      default_margin_value,
      round_prices,
      round_to,
      min_delivery_price,
      max_delivery_price,
      show_original_price,
      show_savings,
      currency,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'merchant_id'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return res.status(200).json({
    success: true,
    settings: data
  });
}
