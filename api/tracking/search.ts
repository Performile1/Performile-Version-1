import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Unified Tracking Search API
 * Search tracking across ALL couriers, merchants, stores
 * 
 * Query Parameters:
 * - q: Search query (tracking number, order ID, customer email)
 * - courier: Filter by courier (postnord, bring, budbee, dhl)
 * - status: Filter by status (pending, in_transit, delivered, etc.)
 * - store_id: Filter by store
 * - date_from: Filter by date range (start)
 * - date_to: Filter by date range (end)
 * - page: Page number (default: 1)
 * - per_page: Results per page (default: 20, max: 100)
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    const userRole = userData?.user_role;

    // Extract query parameters
    const {
      q = '',
      courier = '',
      status = '',
      store_id = '',
      date_from = '',
      date_to = '',
      page = '1',
      per_page = '20'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const perPageNum = Math.min(100, Math.max(1, parseInt(per_page as string)));
    const offset = (pageNum - 1) * perPageNum;

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        order_id,
        tracking_number,
        order_status,
        customer_name,
        customer_email,
        delivery_address,
        postal_code,
        city,
        country,
        estimated_delivery,
        created_at,
        courier_metadata,
        store_id,
        courier_id,
        stores!inner (
          store_id,
          store_name,
          owner_user_id
        ),
        couriers!inner (
          courier_id,
          courier_name,
          courier_code,
          logo_url
        )
      `, { count: 'exact' });

    // Role-based filtering
    if (userRole === 'merchant') {
      // Merchants see only their own stores' orders
      query = query.eq('stores.owner_user_id', user.id);
    } else if (userRole === 'courier') {
      // Couriers see only their own orders
      query = query.eq('courier_id', user.id);
    } else if (userRole === 'consumer') {
      // Consumers see only their own orders
      query = query.eq('consumer_id', user.id);
    }
    // Admin sees all

    // Search query (tracking number, order ID, customer email, customer name)
    if (q) {
      const searchTerm = (q as string).trim();
      query = query.or(`tracking_number.ilike.%${searchTerm}%,order_id.eq.${searchTerm},customer_email.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
    }

    // Filter by courier
    if (courier) {
      const courierCode = (courier as string).toUpperCase();
      query = query.eq('couriers.courier_code', courierCode);
    }

    // Filter by status
    if (status) {
      query = query.eq('order_status', status);
    }

    // Filter by store
    if (store_id) {
      query = query.eq('store_id', store_id);
    }

    // Filter by date range
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(offset, offset + perPageNum - 1);

    // Execute query
    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Failed to search tracking' });
    }

    // Get latest tracking event for each order
    const orderIds = orders?.map(o => o.order_id) || [];
    const { data: latestEvents } = await supabase
      .from('tracking_events')
      .select('order_id, event_timestamp, event_description, location')
      .in('order_id', orderIds)
      .order('event_timestamp', { ascending: false });

    // Group events by order_id (get latest)
    const latestEventMap = new Map();
    latestEvents?.forEach(event => {
      if (!latestEventMap.has(event.order_id)) {
        latestEventMap.set(event.order_id, event);
      }
    });

    // Format results
    const results = orders?.map(order => {
      const latestEvent = latestEventMap.get(order.order_id);
      const courierMetadata = order.courier_metadata || {};
      const courierSpecificData = courierMetadata[order.couriers.courier_code.toLowerCase()] || {};

      return {
        order_id: order.order_id,
        tracking_number: order.tracking_number,
        status: order.order_status,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        delivery_address: {
          address: order.delivery_address,
          postal_code: order.postal_code,
          city: order.city,
          country: order.country
        },
        estimated_delivery: order.estimated_delivery,
        created_at: order.created_at,
        store: {
          store_id: order.stores.store_id,
          store_name: order.stores.store_name
        },
        courier: {
          courier_id: order.couriers.courier_id,
          courier_name: order.couriers.courier_name,
          courier_code: order.couriers.courier_code,
          logo_url: order.couriers.logo_url,
          tracking_url: courierSpecificData.tracking_url || null
        },
        last_event: latestEvent ? {
          timestamp: latestEvent.event_timestamp,
          description: latestEvent.event_description,
          location: latestEvent.location
        } : null
      };
    }) || [];

    return res.status(200).json({
      results,
      pagination: {
        page: pageNum,
        per_page: perPageNum,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPageNum)
      },
      filters: {
        query: q || null,
        courier: courier || null,
        status: status || null,
        store_id: store_id || null,
        date_from: date_from || null,
        date_to: date_to || null
      }
    });
  } catch (error: any) {
    console.error('Tracking search error:', error);
    return res.status(500).json({
      error: 'Failed to search tracking',
      message: error.message
    });
  }
}
