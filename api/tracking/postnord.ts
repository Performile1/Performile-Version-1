import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { PostNordCourier } from '../lib/couriers/PostNordCourier';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request, res: Response) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shipmentId, orderId } = req.body;

    if (!shipmentId) {
      return res.status(400).json({ error: 'shipmentId is required' });
    }

    // Get PostNord courier ID
    const { data: courier } = await supabase
      .from('couriers')
      .select('courier_id')
      .eq('courier_code', 'POSTNORD')
      .single();

    if (!courier) {
      return res.status(404).json({ error: 'PostNord courier not found' });
    }

    // Check cache first
    const { data: cachedData } = await supabase
      .rpc('get_cached_tracking', {
        p_courier_id: courier.courier_id,
        p_tracking_number: shipmentId
      });

    if (cachedData) {
      return res.status(200).json({
        ...cachedData,
        cached: true
      });
    }

    // Get API key from environment
    const apiKey = process.env.POSTNORD_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'PostNord API key not configured' });
    }

    // Create courier instance and track
    const postnord = new PostNordCourier(apiKey, courier.courier_id);
    const trackingData = await postnord.trackByShipmentId(shipmentId);

    // Update cache
    await supabase.rpc('update_tracking_cache', {
      p_courier_id: courier.courier_id,
      p_tracking_number: shipmentId,
      p_order_id: orderId || null,
      p_tracking_response: trackingData,
      p_tracking_status: trackingData.status,
      p_estimated_delivery: trackingData.estimatedDelivery || null,
      p_cache_duration_minutes: 60
    });

    // Update order if orderId provided
    if (orderId) {
      await supabase
        .from('orders')
        .update({
          postnord_shipment_id: shipmentId,
          postnord_tracking_status: trackingData.status,
          postnord_estimated_delivery: trackingData.estimatedDelivery,
          postnord_last_tracking_update: new Date().toISOString()
        })
        .eq('order_id', orderId);
    }

    return res.status(200).json({
      ...trackingData,
      cached: false
    });
  } catch (error: any) {
    console.error('PostNord tracking error:', error);
    return res.status(500).json({
      error: 'Failed to track shipment',
      message: error.message
    });
  }
}
