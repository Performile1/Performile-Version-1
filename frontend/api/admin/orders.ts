import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    if (userError || userData?.user_role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    if (req.method === 'GET') {
      // Get query parameters for filtering and pagination
      const { 
        page = '1', 
        limit = '50',
        status,
        courier_id,
        merchant_id,
        search
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build query
      let query = supabase
        .from('orders')
        .select(`
          *,
          courier:users!orders_courier_id_fkey(user_id, first_name, last_name, email),
          merchant:users!orders_merchant_id_fkey(user_id, first_name, last_name, email, company_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      // Apply filters
      if (status) {
        query = query.eq('order_status', status);
      }
      if (courier_id) {
        query = query.eq('courier_id', courier_id);
      }
      if (merchant_id) {
        query = query.eq('merchant_id', merchant_id);
      }
      if (search) {
        query = query.or(`tracking_number.ilike.%${search}%,order_id.ilike.%${search}%`);
      }

      const { data: orders, error, count } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }

      return res.status(200).json({
        orders: orders || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum)
        }
      });
    }

    if (req.method === 'POST') {
      // Create new order (admin can create orders on behalf of merchants)
      const orderData = req.body;

      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ error: 'Failed to create order' });
      }

      return res.status(201).json(newOrder);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Update order
      const { order_id, ...updates } = req.body;

      if (!order_id) {
        return res.status(400).json({ error: 'order_id is required' });
      }

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('order_id', order_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        return res.status(500).json({ error: 'Failed to update order' });
      }

      return res.status(200).json(updatedOrder);
    }

    if (req.method === 'DELETE') {
      const { order_id } = req.query;

      if (!order_id) {
        return res.status(400).json({ error: 'order_id is required' });
      }

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('order_id', order_id);

      if (error) {
        console.error('Error deleting order:', error);
        return res.status(500).json({ error: 'Failed to delete order' });
      }

      return res.status(200).json({ message: 'Order deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Admin orders API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
