import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    trackingNumber,
    courier,
    orderId,
    status,
    statusDescription,
    currentLocation,
    estimatedDelivery,
    actualDelivery,
    events,
    rawData
  } = req.body;

  if (!trackingNumber || !courier || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Upsert tracking data
    const trackingResult = await pool.query(
      `INSERT INTO tracking_data (
        order_id, tracking_number, courier, status, status_description,
        current_location, estimated_delivery, actual_delivery, raw_data, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (tracking_number, courier) 
      DO UPDATE SET
        status = EXCLUDED.status,
        status_description = EXCLUDED.status_description,
        current_location = EXCLUDED.current_location,
        estimated_delivery = EXCLUDED.estimated_delivery,
        actual_delivery = EXCLUDED.actual_delivery,
        raw_data = EXCLUDED.raw_data,
        last_updated = NOW(),
        api_call_count = tracking_data.api_call_count + 1
      RETURNING tracking_id`,
      [orderId, trackingNumber, courier, status, statusDescription, 
       currentLocation, estimatedDelivery, actualDelivery, rawData]
    );

    const trackingId = trackingResult.rows[0].tracking_id;

    // Insert tracking events
    if (events && Array.isArray(events)) {
      for (const event of events) {
        await pool.query(
          `INSERT INTO tracking_events (
            tracking_id, event_time, status, status_description,
            location_name, location_city, location_country,
            location_coordinates, courier_event_code, courier_event_description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING`,
          [
            trackingId,
            event.eventTime,
            event.status,
            event.statusDescription,
            event.location?.name,
            event.location?.city,
            event.location?.country,
            event.location?.coordinates,
            event.courierEventCode,
            event.courierEventDescription
          ]
        );
      }
    }

    return res.status(200).json({
      success: true,
      trackingId,
      message: 'Tracking data saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving tracking data:', error);
    return res.status(500).json({
      error: 'Failed to save tracking data',
      message: error.message
    });
  }
}
