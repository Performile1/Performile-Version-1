import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
        return await getCourierMargins(merchantId, res);
      case 'POST':
        return await updateCourierMargins(merchantId, req.body, res);
      case 'PUT':
        return await updateCourierMargins(merchantId, req.body, res);
      case 'DELETE':
        return await deleteCourierMargin(merchantId, req.query, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Courier margins error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get all courier margins for merchant
async function getCourierMargins(merchantId: string, res: VercelResponse) {
  // Get all selected couriers with their margins
  const { data: selections, error: selectionsError } = await supabase
    .from('merchant_courier_selections')
    .select(`
      courier_id,
      couriers (
        courier_id,
        courier_name,
        logo_url,
        courier_code
      )
    `)
    .eq('merchant_id', merchantId)
    .eq('is_active', true);

  if (selectionsError) {
    throw selectionsError;
  }

  // Get service margins for each courier
  const courierIds = selections?.map(s => s.courier_id) || [];
  
  const { data: margins, error: marginsError } = await supabase
    .from('courier_service_margins')
    .select('*')
    .eq('merchant_id', merchantId)
    .in('courier_id', courierIds);

  if (marginsError) {
    throw marginsError;
  }

  // Group margins by courier
  const courierMargins = selections?.map(selection => {
    const courier = selection.couriers as any;
    const courierServiceMargins = margins?.filter(m => m.courier_id === selection.courier_id) || [];

    return {
      courier_id: courier.courier_id,
      courier_name: courier.courier_name,
      logo_url: courier.logo_url,
      courier_code: courier.courier_code,
      services: courierServiceMargins.map(m => ({
        service_type: m.service_type,
        margin_type: m.margin_type,
        margin_value: m.margin_value,
        fixed_price: m.fixed_price,
        is_active: m.is_active
      }))
    };
  }) || [];

  return res.status(200).json({
    success: true,
    couriers: courierMargins
  });
}

// Update courier margins
async function updateCourierMargins(
  merchantId: string,
  body: any,
  res: VercelResponse
) {
  const { courier_id, services } = body;

  if (!courier_id) {
    return res.status(400).json({ error: 'courier_id required' });
  }

  if (!services || !Array.isArray(services)) {
    return res.status(400).json({ error: 'services array required' });
  }

  // Validate service types
  const validServiceTypes = ['express', 'standard', 'economy', 'same_day', 'scheduled', 'overnight'];
  for (const service of services) {
    if (!validServiceTypes.includes(service.service_type)) {
      return res.status(400).json({ 
        error: `Invalid service type: ${service.service_type}` 
      });
    }

    if (service.margin_type && !['percentage', 'fixed'].includes(service.margin_type)) {
      return res.status(400).json({ error: 'Invalid margin type' });
    }

    if (service.margin_value !== undefined && service.margin_value < 0) {
      return res.status(400).json({ error: 'Margin value must be positive' });
    }
  }

  // Upsert each service margin
  const upsertPromises = services.map(service => 
    supabase
      .from('courier_service_margins')
      .upsert({
        merchant_id: merchantId,
        courier_id,
        service_type: service.service_type,
        margin_type: service.margin_type || 'percentage',
        margin_value: service.margin_value || 0,
        fixed_price: service.fixed_price,
        is_active: service.is_active !== undefined ? service.is_active : true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'merchant_id,courier_id,service_type'
      })
  );

  const results = await Promise.all(upsertPromises);

  // Check for errors
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }

  return res.status(200).json({
    success: true,
    message: 'Courier margins updated',
    updated: services.length
  });
}

// Delete courier margin
async function deleteCourierMargin(
  merchantId: string,
  query: any,
  res: VercelResponse
) {
  const { courier_id, service_type } = query;

  if (!courier_id || !service_type) {
    return res.status(400).json({ error: 'courier_id and service_type required' });
  }

  const { error } = await supabase
    .from('courier_service_margins')
    .delete()
    .eq('merchant_id', merchantId)
    .eq('courier_id', courier_id)
    .eq('service_type', service_type);

  if (error) {
    throw error;
  }

  return res.status(200).json({
    success: true,
    message: 'Courier margin deleted'
  });
}
