/**
 * Service Performance API
 * Week 4 Phase 4 - Backend APIs
 * 
 * Endpoints:
 * - GET /api/service-performance - Get service performance metrics
 * - GET /api/service-performance/compare - Compare services
 * - GET /api/service-performance/geographic - Geographic breakdown
 * - GET /api/service-performance/reviews - Service-specific reviews
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './lib/db';

const pool = getPool();

/**
 * Main handler for service performance endpoints
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
      case 'compare':
        return await handleCompare(req, res);
      case 'geographic':
        return await handleGeographic(req, res);
      case 'reviews':
        return await handleReviews(req, res);
      default:
        return await handleGetPerformance(req, res);
    }
  } catch (error: any) {
    console.error('Service performance API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * GET /api/service-performance
 * Get service performance metrics
 * 
 * Query params:
 * - courier_id: UUID (optional)
 * - service_type_id: UUID (optional)
 * - period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' (default: 'monthly')
 * - limit: number (default: 10)
 */
async function handleGetPerformance(req: VercelRequest, res: VercelResponse) {
  const {
    courier_id,
    service_type_id,
    period_type = 'monthly',
    limit = '10'
  } = req.query;

  let query = `
    SELECT 
      sp.performance_id,
      sp.courier_id,
      c.courier_name,
      sp.service_type_id,
      st.service_name,
      st.service_code,
      sp.period_start,
      sp.period_end,
      sp.period_type,
      sp.total_orders,
      sp.completed_orders,
      sp.cancelled_orders,
      sp.completion_rate,
      sp.on_time_rate,
      sp.avg_delivery_days,
      sp.total_reviews,
      sp.avg_rating,
      sp.avg_delivery_speed_rating,
      sp.avg_package_condition_rating,
      sp.avg_communication_rating,
      sp.trust_score,
      sp.trust_score_grade,
      sp.unique_customers,
      sp.customer_satisfaction_score,
      sp.coverage_area_count,
      sp.top_city,
      sp.last_calculated
    FROM service_performance sp
    JOIN couriers c ON sp.courier_id = c.courier_id
    JOIN servicetypes st ON sp.service_type_id = st.service_type_id
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (courier_id) {
    query += ` AND sp.courier_id = $${paramIndex}`;
    params.push(courier_id);
    paramIndex++;
  }

  if (service_type_id) {
    query += ` AND sp.service_type_id = $${paramIndex}`;
    params.push(service_type_id);
    paramIndex++;
  }

  query += ` AND sp.period_type = $${paramIndex}`;
  params.push(period_type);
  paramIndex++;

  query += `
    ORDER BY sp.trust_score DESC, sp.completion_rate DESC
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
 * GET /api/service-performance?action=compare
 * Compare multiple services
 * 
 * Query params:
 * - courier_ids: comma-separated UUIDs
 * - service_type_id: UUID (optional)
 * - period_type: 'monthly' (default)
 */
async function handleCompare(req: VercelRequest, res: VercelResponse) {
  const {
    courier_ids,
    service_type_id,
    period_type = 'monthly'
  } = req.query;

  if (!courier_ids) {
    return res.status(400).json({
      message: 'courier_ids parameter is required'
    });
  }

  const courierIdArray = (courier_ids as string).split(',');

  const query = `
    SELECT 
      sp.courier_id,
      c.courier_name,
      sp.service_type_id,
      st.service_name,
      st.service_code,
      sp.total_orders,
      sp.completion_rate,
      sp.on_time_rate,
      sp.avg_delivery_days,
      sp.avg_rating,
      sp.trust_score,
      sp.trust_score_grade,
      sp.customer_satisfaction_score,
      sp.coverage_area_count,
      
      -- Rankings
      RANK() OVER (ORDER BY sp.trust_score DESC) as trust_score_rank,
      RANK() OVER (ORDER BY sp.completion_rate DESC) as completion_rate_rank,
      RANK() OVER (ORDER BY sp.on_time_rate DESC) as on_time_rate_rank,
      RANK() OVER (ORDER BY sp.avg_rating DESC) as rating_rank,
      
      sp.period_start,
      sp.period_end
    FROM service_performance sp
    JOIN couriers c ON sp.courier_id = c.courier_id
    JOIN servicetypes st ON sp.service_type_id = st.service_type_id
    WHERE sp.courier_id = ANY($1)
      AND sp.period_type = $2
      ${service_type_id ? 'AND sp.service_type_id = $3' : ''}
      AND sp.period_end >= CURRENT_DATE - INTERVAL '3 months'
    ORDER BY sp.trust_score DESC
  `;

  const params: any[] = [courierIdArray, period_type];
  if (service_type_id) {
    params.push(service_type_id);
  }

  const result = await pool.query(query, params);

  return res.status(200).json({
    success: true,
    data: result.rows,
    count: result.rows.length,
    comparison: {
      best_trust_score: result.rows[0]?.courier_name,
      best_completion_rate: result.rows.sort((a, b) => b.completion_rate - a.completion_rate)[0]?.courier_name,
      best_on_time_rate: result.rows.sort((a, b) => b.on_time_rate - a.on_time_rate)[0]?.courier_name,
      fastest_delivery: result.rows.sort((a, b) => a.avg_delivery_days - b.avg_delivery_days)[0]?.courier_name
    }
  });
}

/**
 * GET /api/service-performance?action=geographic
 * Get geographic performance breakdown
 * 
 * Query params:
 * - courier_id: UUID (required)
 * - service_type_id: UUID (optional)
 * - postal_code: string (optional)
 * - city: string (optional)
 * - limit: number (default: 20)
 */
async function handleGeographic(req: VercelRequest, res: VercelResponse) {
  const {
    courier_id,
    service_type_id,
    postal_code,
    city,
    limit = '20'
  } = req.query;

  if (!courier_id) {
    return res.status(400).json({
      message: 'courier_id parameter is required'
    });
  }

  let query = `
    SELECT 
      spg.geo_performance_id,
      spg.courier_id,
      c.courier_name,
      spg.service_type_id,
      st.service_name,
      spg.postal_code,
      spg.city,
      spg.region,
      spg.country,
      spg.total_deliveries,
      spg.successful_deliveries,
      spg.failed_deliveries,
      spg.avg_delivery_time_hours,
      spg.on_time_rate,
      spg.avg_rating,
      spg.total_reviews,
      spg.area_trust_score,
      spg.period_start,
      spg.period_end,
      spg.last_calculated
    FROM service_performance_geographic spg
    JOIN couriers c ON spg.courier_id = c.courier_id
    JOIN servicetypes st ON spg.service_type_id = st.service_type_id
    WHERE spg.courier_id = $1
  `;

  const params: any[] = [courier_id];
  let paramIndex = 2;

  if (service_type_id) {
    query += ` AND spg.service_type_id = $${paramIndex}`;
    params.push(service_type_id);
    paramIndex++;
  }

  if (postal_code) {
    query += ` AND spg.postal_code = $${paramIndex}`;
    params.push(postal_code);
    paramIndex++;
  }

  if (city) {
    query += ` AND spg.city ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }

  query += `
    ORDER BY spg.area_trust_score DESC, spg.total_deliveries DESC
    LIMIT $${paramIndex}
  `;
  params.push(parseInt(limit as string));

  const result = await pool.query(query, params);

  // Calculate summary statistics
  const summary = {
    total_areas: result.rows.length,
    avg_trust_score: result.rows.reduce((sum, row) => sum + parseFloat(row.area_trust_score || 0), 0) / result.rows.length || 0,
    avg_on_time_rate: result.rows.reduce((sum, row) => sum + parseFloat(row.on_time_rate || 0), 0) / result.rows.length || 0,
    total_deliveries: result.rows.reduce((sum, row) => sum + parseInt(row.total_deliveries || 0), 0),
    best_performing_area: result.rows[0]?.city || null
  };

  return res.status(200).json({
    success: true,
    data: result.rows,
    count: result.rows.length,
    summary
  });
}

/**
 * GET /api/service-performance?action=reviews
 * Get service-specific reviews
 * 
 * Query params:
 * - service_type_id: UUID (required)
 * - courier_id: UUID (optional)
 * - min_rating: number 1-5 (optional)
 * - limit: number (default: 20)
 */
async function handleReviews(req: VercelRequest, res: VercelResponse) {
  const {
    service_type_id,
    courier_id,
    min_rating,
    limit = '20'
  } = req.query;

  if (!service_type_id) {
    return res.status(400).json({
      message: 'service_type_id parameter is required'
    });
  }

  let query = `
    SELECT 
      sr.service_review_id,
      sr.review_id,
      sr.service_type_id,
      st.service_name,
      r.order_id,
      r.courier_id,
      c.courier_name,
      r.rating,
      r.review_text,
      r.delivery_speed_rating,
      r.package_condition_rating,
      r.communication_rating,
      sr.service_quality_rating,
      sr.location_convenience_rating,
      sr.facility_condition_rating,
      sr.staff_helpfulness_rating,
      sr.service_comment,
      r.is_verified,
      r.is_public,
      r.created_at
    FROM service_reviews sr
    JOIN reviews r ON sr.review_id = r.review_id
    JOIN servicetypes st ON sr.service_type_id = st.service_type_id
    JOIN couriers c ON r.courier_id = c.courier_id
    WHERE sr.service_type_id = $1
      AND r.is_public = true
  `;

  const params: any[] = [service_type_id];
  let paramIndex = 2;

  if (courier_id) {
    query += ` AND r.courier_id = $${paramIndex}`;
    params.push(courier_id);
    paramIndex++;
  }

  if (min_rating) {
    query += ` AND r.rating >= $${paramIndex}`;
    params.push(parseInt(min_rating as string));
    paramIndex++;
  }

  query += `
    ORDER BY r.created_at DESC
    LIMIT $${paramIndex}
  `;
  params.push(parseInt(limit as string));

  const result = await pool.query(query, params);

  // Calculate review statistics
  const stats = {
    total_reviews: result.rows.length,
    avg_rating: result.rows.reduce((sum, row) => sum + parseFloat(row.rating || 0), 0) / result.rows.length || 0,
    avg_service_quality: result.rows.reduce((sum, row) => sum + parseFloat(row.service_quality_rating || 0), 0) / result.rows.filter(r => r.service_quality_rating).length || 0,
    verified_count: result.rows.filter(r => r.is_verified).length,
    rating_distribution: {
      5: result.rows.filter(r => r.rating === 5).length,
      4: result.rows.filter(r => r.rating === 4).length,
      3: result.rows.filter(r => r.rating === 3).length,
      2: result.rows.filter(r => r.rating === 2).length,
      1: result.rows.filter(r => r.rating === 1).length
    }
  };

  return res.status(200).json({
    success: true,
    data: result.rows,
    count: result.rows.length,
    stats
  });
}
