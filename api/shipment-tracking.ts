import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Shipment Tracking API
 * Manages shipment events and real-time tracking
 * 
 * Endpoints:
 * - GET /api/shipment-tracking?action=events&order_id=xxx - Get all events for an order
 * - GET /api/shipment-tracking?action=latest&order_id=xxx - Get latest event for an order
 * - GET /api/shipment-tracking?action=timeline&order_id=xxx - Get formatted timeline
 * - POST /api/shipment-tracking?action=add_event - Add new tracking event
 * - GET /api/shipment-tracking?action=exceptions - Get all exception events
 * - GET /api/shipment-tracking?action=delayed_orders - Get delayed orders
 * - POST /api/shipment-tracking?action=webhook - Receive webhook from courier
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Webhook-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const action = req.query.action as string;

    // Webhook endpoint doesn't require authentication
    if (action === 'webhook') {
      return await handleWebhook(req, res);
    }

    // Extract JWT token for authenticated endpoints
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (action) {
      case 'events':
        return await getOrderEvents(req, res, user.id);
      case 'latest':
        return await getLatestEvent(req, res, user.id);
      case 'timeline':
        return await getOrderTimeline(req, res, user.id);
      case 'add_event':
        return await addTrackingEvent(req, res, user.id);
      case 'exceptions':
        return await getExceptions(req, res, user.id);
      case 'delayed_orders':
        return await getDelayedOrders(req, res, user.id);
      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error: any) {
    console.error('Shipment tracking API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Get all tracking events for an order
 */
async function getOrderEvents(req: VercelRequest, res: VercelResponse, userId: string) {
  const orderId = req.query.order_id as string;

  if (!orderId) {
    return res.status(400).json({ error: 'order_id is required' });
  }

  // Verify user has access to this order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('order_id, store_id')
    .eq('order_id', orderId)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Check if user owns the store
  const { data: store } = await supabase
    .from('stores')
    .select('owner_user_id')
    .eq('store_id', order.store_id)
    .single();

  if (!store || store.owner_user_id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get all events
  const { data: events, error } = await supabase
    .from('shipment_events')
    .select('*')
    .eq('order_id', orderId)
    .order('event_timestamp', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ events });
}

/**
 * Get latest tracking event for an order
 */
async function getLatestEvent(req: VercelRequest, res: VercelResponse, userId: string) {
  const orderId = req.query.order_id as string;

  if (!orderId) {
    return res.status(400).json({ error: 'order_id is required' });
  }

  // Verify user has access to this order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('order_id, store_id')
    .eq('order_id', orderId)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Check if user owns the store
  const { data: store } = await supabase
    .from('stores')
    .select('owner_user_id')
    .eq('store_id', order.store_id)
    .single();

  if (!store || store.owner_user_id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get latest event
  const { data: event, error } = await supabase
    .from('shipment_events')
    .select('*')
    .eq('order_id', orderId)
    .order('event_timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return res.status(404).json({ error: 'No events found' });
  }

  return res.status(200).json({ event });
}

/**
 * Get formatted timeline for an order
 */
async function getOrderTimeline(req: VercelRequest, res: VercelResponse, userId: string) {
  const orderId = req.query.order_id as string;

  if (!orderId) {
    return res.status(400).json({ error: 'order_id is required' });
  }

  // Verify user has access to this order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('order_id, store_id, order_number, tracking_number, created_at')
    .eq('order_id', orderId)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Check if user owns the store
  const { data: store } = await supabase
    .from('stores')
    .select('owner_user_id')
    .eq('store_id', order.store_id)
    .single();

  if (!store || store.owner_user_id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get all events
  const { data: events, error } = await supabase
    .from('shipment_events')
    .select('*')
    .eq('order_id', orderId)
    .order('event_timestamp', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Format timeline
  const timeline = {
    order_id: order.order_id,
    order_number: order.order_number,
    tracking_number: order.tracking_number,
    created_at: order.created_at,
    events: events.map(event => ({
      timestamp: event.event_timestamp,
      type: event.event_type,
      description: event.event_description,
      location: event.location_city ? `${event.location_city}, ${event.location_country}` : null,
      status: event.status,
      is_exception: event.is_exception,
      exception_type: event.exception_type
    }))
  };

  return res.status(200).json({ timeline });
}

/**
 * Add a new tracking event
 */
async function addTrackingEvent(req: VercelRequest, res: VercelResponse, userId: string) {
  const {
    order_id,
    tracking_number,
    event_type,
    event_code,
    event_description,
    event_timestamp,
    location_city,
    location_country,
    location_postal_code,
    location_facility,
    status,
    substatus,
    is_exception,
    exception_type,
    exception_description,
    raw_event_data
  } = req.body;

  // Validate required fields
  if (!order_id || !tracking_number || !event_type || !event_timestamp || !status) {
    return res.status(400).json({ 
      error: 'order_id, tracking_number, event_type, event_timestamp, and status are required' 
    });
  }

  // Verify user has access to this order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('order_id, store_id, courier_id')
    .eq('order_id', order_id)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Check if user owns the store
  const { data: store } = await supabase
    .from('stores')
    .select('owner_user_id')
    .eq('store_id', order.store_id)
    .single();

  if (!store || store.owner_user_id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Insert event
  const { data: event, error } = await supabase
    .from('shipment_events')
    .insert({
      order_id,
      courier_id: order.courier_id,
      tracking_number,
      event_type,
      event_code,
      event_description,
      event_timestamp,
      location_city,
      location_country,
      location_postal_code,
      location_facility,
      status,
      substatus,
      is_exception: is_exception || false,
      exception_type,
      exception_description,
      raw_event_data
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ 
    event,
    message: 'Tracking event added successfully' 
  });
}

/**
 * Get all exception events
 */
async function getExceptions(req: VercelRequest, res: VercelResponse, userId: string) {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  // Get user's stores
  const { data: stores } = await supabase
    .from('stores')
    .select('store_id')
    .eq('owner_user_id', userId);

  if (!stores || stores.length === 0) {
    return res.status(200).json({ exceptions: [] });
  }

  const storeIds = stores.map(s => s.store_id);

  // Get exception events for user's orders
  const { data: exceptions, error } = await supabase
    .from('shipment_events')
    .select(`
      *,
      order:orders!inner(order_id, order_number, store_id)
    `)
    .in('order.store_id', storeIds)
    .eq('is_exception', true)
    .order('event_timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ exceptions });
}

/**
 * Get delayed orders
 */
async function getDelayedOrders(req: VercelRequest, res: VercelResponse, userId: string) {
  // Get user's stores
  const { data: stores } = await supabase
    .from('stores')
    .select('store_id')
    .eq('owner_user_id', userId);

  if (!stores || stores.length === 0) {
    return res.status(200).json({ delayed_orders: [] });
  }

  const storeIds = stores.map(s => s.store_id);

  // Get delayed orders using the view
  const { data: delayedOrders, error } = await supabase
    .from('active_shipments_with_events')
    .select('*')
    .in('store_id', storeIds)
    .eq('is_delayed', true)
    .order('days_since_last_scan', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ delayed_orders: delayedOrders });
}

/**
 * Handle webhook from courier
 */
async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook signature (implement based on courier's requirements)
  const signature = req.headers['x-webhook-signature'] as string;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  // TODO: Implement signature verification
  // For now, just log the webhook
  console.log('Received webhook:', {
    signature,
    body: req.body
  });

  // Parse webhook data (format varies by courier)
  const {
    tracking_number,
    event_type,
    event_timestamp,
    status,
    location,
    courier_code
  } = req.body;

  if (!tracking_number) {
    return res.status(400).json({ error: 'tracking_number is required' });
  }

  // Find order by tracking number
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('order_id, courier_id, store_id')
    .eq('tracking_number', tracking_number)
    .single();

  if (orderError || !order) {
    console.log('Order not found for tracking number:', tracking_number);
    return res.status(404).json({ error: 'Order not found' });
  }

  // Insert event
  const { data: event, error } = await supabase
    .from('shipment_events')
    .insert({
      order_id: order.order_id,
      courier_id: order.courier_id,
      tracking_number,
      event_type: event_type || 'unknown',
      event_timestamp: event_timestamp || new Date().toISOString(),
      status: status || 'in_transit',
      location_city: location?.city,
      location_country: location?.country,
      raw_event_data: req.body,
      processed: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting webhook event:', error);
    return res.status(500).json({ error: error.message });
  }

  // TODO: Trigger notification rules evaluation

  return res.status(200).json({ 
    message: 'Webhook processed successfully',
    event_id: event.event_id
  });
}
