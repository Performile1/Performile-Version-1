import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { PostNordCourier } from '../lib/couriers/PostNordCourier';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request, res: Response) {
  // Allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const shipmentId = req.method === 'GET' ? req.query.shipmentId : req.body.shipmentId;
    const countryCode = req.method === 'GET' ? req.query.countryCode : req.body.countryCode;
    const orderId = req.method === 'GET' ? req.query.orderId : req.body.orderId;

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

    // Get API key
    const apiKey = process.env.POSTNORD_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'PostNord API key not configured' });
    }

    // Generate tracking URL
    const postnord = new PostNordCourier(apiKey, courier.courier_id);
    const trackingUrl = await postnord.getTrackingUrl(
      shipmentId as string,
      (countryCode as string) || 'SE'
    );

    // Update order if orderId provided (unified approach with courier_metadata)
    if (orderId) {
      // Get current order
      const { data: order } = await supabase
        .from('orders')
        .select('courier_metadata')
        .eq('order_id', orderId)
        .single();

      // Merge PostNord data into courier_metadata
      const courierMetadata = order?.courier_metadata || {};
      if (!courierMetadata.postnord) {
        courierMetadata.postnord = {};
      }
      courierMetadata.postnord.tracking_url = trackingUrl;
      courierMetadata.postnord.shipment_id = shipmentId;

      await supabase
        .from('orders')
        .update({ courier_metadata: courierMetadata })
        .eq('order_id', orderId);
    }

    return res.status(200).json({
      shipmentId,
      trackingUrl,
      countryCode: (countryCode as string) || 'SE'
    });
  } catch (error: any) {
    console.error('Tracking URL generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate tracking URL',
      message: error.message
    });
  }
}
