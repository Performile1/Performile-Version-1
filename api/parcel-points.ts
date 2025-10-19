/**
 * Parcel Points API
 * Week 4 Phase 5 - Backend APIs
 * 
 * Endpoints:
 * - GET /api/parcel-points - Search parcel points
 * - GET /api/parcel-points/nearby - Find nearby locations
 * - GET /api/parcel-points/coverage - Check delivery coverage
 * - GET /api/parcel-points/hours - Get opening hours
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './lib/db';

const pool = getPool();

/**
 * Main handler for parcel points endpoints
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { action } = req.query;

    switch (action) {
      case 'nearby':
        return await handleNearby(req, res);
      case 'coverage':
        return await handleCoverage(req, res);
      case 'hours':
        return await handleHours(req, res);
      default:
        return await handleSearch(req, res);
    }
  } catch (error: any) {
    console.error('Parcel points API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * GET /api/parcel-points
 * Search parcel points by various criteria
 * 
 * Query params:
 * - postal_code: string (optional)
 * - city: string (optional)
 * - courier_id: UUID (optional)
 * - point_type: 'parcel_shop' | 'parcel_locker' | 'service_point' (optional)
 * - limit: number (default: 20)
 */
async function handleSearch(req: VercelRequest, res: VercelResponse) {
  const {
    postal_code,
    city,
    courier_id,
    point_type,
    limit = '20'
  } = req.query;

  let query = `
    SELECT 
      pps.parcel_point_id,
      pps.courier_id,
      pps.courier_name,
      pps.service_type_id,
      pps.service_type_name,
      pps.point_name,
      pps.point_type,
      pps.street_address,
      pps.postal_code,
      pps.city,
      pps.latitude,
      pps.longitude,
      pps.is_active,
      pps.is_temporarily_closed,
      pps.facilities,
      pps.hours_type,
      pps.total_compartments,
      pps.available_compartments,
      pps.updated_at
    FROM parcel_points_summary pps
    WHERE pps.is_active = true
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (postal_code) {
    query += ` AND pps.postal_code = $${paramIndex}`;
    params.push(postal_code);
    paramIndex++;
  }

  if (city) {
    query += ` AND pps.city ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }

  if (courier_id) {
    query += ` AND pps.courier_id = $${paramIndex}`;
    params.push(courier_id);
    paramIndex++;
  }

  if (point_type) {
    query += ` AND pps.point_type = $${paramIndex}`;
    params.push(point_type);
    paramIndex++;
  }

  query += `
    ORDER BY pps.city, pps.point_name
    LIMIT $${paramIndex}
  `;
  params.push(parseInt(limit as string));

  const result = await pool.query(query, params);

  return res.status(200).json({
    success: true,
    data: result.rows,
    count: result.rows.length
  });
}

/**
 * GET /api/parcel-points?action=nearby
 * Find parcel points near a location
 * 
 * Query params:
 * - latitude: number (required)
 * - longitude: number (required)
 * - radius_km: number (default: 5.0)
 * - courier_id: UUID (optional)
 * - point_type: string (optional)
 */
async function handleNearby(req: VercelRequest, res: VercelResponse) {
  const {
    latitude,
    longitude,
    radius_km = '5.0',
    courier_id,
    point_type
  } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      message: 'latitude and longitude parameters are required'
    });
  }

  const query = `
    SELECT * FROM find_nearby_parcel_points(
      $1::DECIMAL(10,8),
      $2::DECIMAL(11,8),
      $3::DECIMAL(10,2),
      $4::UUID,
      $5::VARCHAR(50)
    )
  `;

  const params = [
    parseFloat(latitude as string),
    parseFloat(longitude as string),
    parseFloat(radius_km as string),
    courier_id || null,
    point_type || null
  ];

  const result = await pool.query(query, params);

  return res.status(200).json({
    success: true,
    data: result.rows,
    count: result.rows.length,
    search_params: {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
      radius_km: parseFloat(radius_km as string)
    }
  });
}

/**
 * GET /api/parcel-points?action=coverage
 * Check delivery coverage for a postal code
 * 
 * Query params:
 * - postal_code: string (required)
 * - courier_id: UUID (optional)
 * - service_type_id: UUID (optional)
 */
async function handleCoverage(req: VercelRequest, res: VercelResponse) {
  const {
    postal_code,
    courier_id,
    service_type_id
  } = req.query;

  if (!postal_code) {
    return res.status(400).json({
      message: 'postal_code parameter is required'
    });
  }

  const query = `
    SELECT * FROM check_delivery_coverage(
      $1::VARCHAR(10),
      $2::UUID,
      $3::UUID
    )
  `;

  const params = [
    postal_code,
    courier_id || null,
    service_type_id || null
  ];

  const result = await pool.query(query, params);

  // Get nearby parcel points for this postal code
  const parcelPointsQuery = `
    SELECT 
      pp.parcel_point_id,
      pp.point_name,
      pp.point_type,
      pp.street_address,
      pp.city,
      c.courier_name,
      pp.latitude,
      pp.longitude
    FROM parcel_points pp
    JOIN couriers c ON pp.courier_id = c.courier_id
    WHERE pp.postal_code = $1
      AND pp.is_active = true
      ${courier_id ? 'AND pp.courier_id = $2' : ''}
    ORDER BY pp.point_type, pp.point_name
    LIMIT 10
  `;

  const parcelPointsParams = courier_id ? [postal_code, courier_id] : [postal_code];
  const parcelPointsResult = await pool.query(parcelPointsQuery, parcelPointsParams);

  return res.status(200).json({
    success: true,
    coverage: result.rows,
    parcel_points: parcelPointsResult.rows,
    postal_code: postal_code,
    summary: {
      total_couriers: result.rows.length,
      home_delivery_available: result.rows.filter(r => r.home_delivery_available).length,
      parcel_shop_available: result.rows.filter(r => r.parcel_shop_available).length,
      parcel_locker_available: result.rows.filter(r => r.parcel_locker_available).length,
      fastest_delivery: result.rows.length > 0 
        ? Math.min(...result.rows.map(r => r.standard_delivery_days).filter(d => d !== null))
        : null
    }
  });
}

/**
 * GET /api/parcel-points?action=hours
 * Get opening hours for a parcel point
 * 
 * Query params:
 * - parcel_point_id: UUID (required)
 */
async function handleHours(req: VercelRequest, res: VercelResponse) {
  const { parcel_point_id } = req.query;

  if (!parcel_point_id) {
    return res.status(400).json({
      message: 'parcel_point_id parameter is required'
    });
  }

  // Get parcel point details
  const pointQuery = `
    SELECT 
      pp.parcel_point_id,
      pp.point_name,
      pp.point_type,
      pp.street_address,
      pp.postal_code,
      pp.city,
      pp.phone,
      pp.email,
      c.courier_name,
      pp.is_active,
      pp.is_temporarily_closed,
      pp.closure_reason
    FROM parcel_points pp
    JOIN couriers c ON pp.courier_id = c.courier_id
    WHERE pp.parcel_point_id = $1
  `;

  const pointResult = await pool.query(pointQuery, [parcel_point_id]);

  if (pointResult.rows.length === 0) {
    return res.status(404).json({
      message: 'Parcel point not found'
    });
  }

  // Get opening hours
  const hoursQuery = `
    SELECT 
      day_of_week,
      opens_at,
      closes_at,
      is_closed,
      is_24_hours,
      notes,
      CASE day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
      END as day_name
    FROM parcel_point_hours
    WHERE parcel_point_id = $1
    ORDER BY day_of_week
  `;

  const hoursResult = await pool.query(hoursQuery, [parcel_point_id]);

  // Get facilities
  const facilitiesQuery = `
    SELECT 
      facility_type,
      is_available,
      description
    FROM parcel_point_facilities
    WHERE parcel_point_id = $1
      AND is_available = true
    ORDER BY facility_type
  `;

  const facilitiesResult = await pool.query(facilitiesQuery, [parcel_point_id]);

  // Check if open now
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const todayHours = hoursResult.rows.find(h => h.day_of_week === currentDay);
  let isOpenNow = false;

  if (todayHours) {
    if (todayHours.is_24_hours) {
      isOpenNow = true;
    } else if (!todayHours.is_closed && todayHours.opens_at && todayHours.closes_at) {
      isOpenNow = currentTime >= todayHours.opens_at && currentTime <= todayHours.closes_at;
    }
  }

  return res.status(200).json({
    success: true,
    parcel_point: pointResult.rows[0],
    opening_hours: hoursResult.rows,
    facilities: facilitiesResult.rows,
    status: {
      is_open_now: isOpenNow && !pointResult.rows[0].is_temporarily_closed,
      is_temporarily_closed: pointResult.rows[0].is_temporarily_closed,
      closure_reason: pointResult.rows[0].closure_reason,
      today_hours: todayHours || null
    }
  });
}
