import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

interface AuthRequest extends VercelRequest {
  userId?: string;
}

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user ID from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const merchantId = user.id;
    const { action, courier_id, is_active, custom_name, custom_description, priority_level, display_order } = req.body;

    switch (action) {
      case 'get_subscription_info': {
        const { data, error } = await supabase.rpc('get_merchant_subscription_info', {
          p_merchant_id: merchantId
        });

        if (error) throw error;
        return res.status(200).json({ data });
      }

      case 'get_selected_couriers': {
        const { data, error } = await supabase
          .from('vw_merchant_courier_preferences')
          .select('*')
          .eq('merchant_id', merchantId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        return res.status(200).json({ couriers: data || [] });
      }

      case 'get_available_couriers': {
        const { data, error } = await supabase.rpc('get_available_couriers_for_merchant', {
          p_merchant_id: merchantId
        });

        if (error) throw error;
        return res.status(200).json({ couriers: data || [] });
      }

      case 'add_courier': {
        if (!courier_id) {
          return res.status(400).json({ error: 'courier_id is required' });
        }

        // Check subscription limit first
        const { data: subInfo } = await supabase.rpc('get_merchant_subscription_info', {
          p_merchant_id: merchantId
        });

        if (!subInfo?.usage?.can_add_courier) {
          return res.status(403).json({ 
            error: 'Courier limit reached',
            message: 'You have reached your courier limit. Please upgrade your subscription to add more couriers.'
          });
        }

        // Add courier selection
        const { error } = await supabase
          .from('merchant_courier_selections')
          .insert({
            merchant_id: merchantId,
            courier_id,
            is_active: true,
            display_order: 0
          });

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({ error: 'Courier already added' });
          }
          throw error;
        }

        return res.status(200).json({ success: true, message: 'Courier added successfully' });
      }

      case 'remove_courier': {
        if (!courier_id) {
          return res.status(400).json({ error: 'courier_id is required' });
        }

        const { error } = await supabase
          .from('merchant_courier_selections')
          .delete()
          .eq('merchant_id', merchantId)
          .eq('courier_id', courier_id);

        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Courier removed successfully' });
      }

      case 'toggle_courier_active': {
        if (!courier_id || is_active === undefined) {
          return res.status(400).json({ error: 'courier_id and is_active are required' });
        }

        const { error } = await supabase
          .from('merchant_courier_selections')
          .update({ is_active, updated_at: new Date().toISOString() })
          .eq('merchant_id', merchantId)
          .eq('courier_id', courier_id);

        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Courier status updated' });
      }

      case 'update_courier_settings': {
        if (!courier_id) {
          return res.status(400).json({ error: 'courier_id is required' });
        }

        const updates: any = { updated_at: new Date().toISOString() };
        if (custom_name !== undefined) updates.custom_name = custom_name;
        if (custom_description !== undefined) updates.custom_description = custom_description;
        if (priority_level !== undefined) updates.priority_level = priority_level;
        if (display_order !== undefined) updates.display_order = display_order;

        const { error } = await supabase
          .from('merchant_courier_selections')
          .update(updates)
          .eq('merchant_id', merchantId)
          .eq('courier_id', courier_id);

        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Courier settings updated' });
      }

      case 'reorder_couriers': {
        const { courier_orders } = req.body; // Array of { courier_id, display_order }
        
        if (!Array.isArray(courier_orders)) {
          return res.status(400).json({ error: 'courier_orders array is required' });
        }

        // Update all display orders in a transaction
        const updates = courier_orders.map(({ courier_id, display_order }) =>
          supabase
            .from('merchant_courier_selections')
            .update({ display_order, updated_at: new Date().toISOString() })
            .eq('merchant_id', merchantId)
            .eq('courier_id', courier_id)
        );

        await Promise.all(updates);
        return res.status(200).json({ success: true, message: 'Courier order updated' });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Merchant preferences API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
