import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import jwt from 'jsonwebtoken';

// Inline JWT helper
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      return 'development-fallback-secret-min-32-chars-long-for-testing';
    }
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
}

const pool = getPool();

// Verify user token
const verifyUser = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, getJWTSecret()) as any;
  
  return decoded;
};

// Convert array of objects to CSV
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape values that contain commas or quotes
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = verifyUser(req);
    const userId = user.user_id;
    const { report_type, date_from, date_to, filters = {} } = req.body;

    if (!report_type) {
      return res.status(400).json({
        success: false,
        message: 'report_type is required',
      });
    }

    const client = await pool.connect();
    try {
      let data: any[] = [];
      let filename = `${report_type}_${new Date().toISOString().split('T')[0]}.csv`;

      // Generate CSV based on report type
      switch (report_type) {
        case 'platform_overview':
          if (user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Admin access required',
            });
          }
          const platformResult = await client.query(`
            SELECT 
              metric_date,
              total_orders,
              delivered_orders,
              in_transit_orders,
              pending_orders,
              total_couriers,
              active_couriers,
              total_stores,
              active_stores,
              avg_rating,
              avg_trust_score,
              avg_completion_rate,
              avg_on_time_rate
            FROM platform_analytics
            WHERE ($1::date IS NULL OR metric_date >= $1)
              AND ($2::date IS NULL OR metric_date <= $2)
            ORDER BY metric_date DESC
          `, [date_from || null, date_to || null]);
          data = platformResult.rows;
          break;

        case 'shop_performance':
          const shopId = filters.shop_id;
          if (!shopId) {
            return res.status(400).json({
              success: false,
              message: 'shop_id is required in filters',
            });
          }
          const shopResult = await client.query(`
            SELECT 
              snapshot_date,
              period_type,
              total_orders,
              completed_orders,
              cancelled_orders,
              pending_orders,
              total_revenue,
              average_order_value,
              courier_count,
              home_delivery_count,
              parcel_shop_count,
              parcel_locker_count,
              average_delivery_time_hours,
              on_time_delivery_rate,
              customer_satisfaction_score
            FROM shopanalyticssnapshots
            WHERE shop_id = $1
              AND ($2::date IS NULL OR snapshot_date >= $2)
              AND ($3::date IS NULL OR snapshot_date <= $3)
            ORDER BY snapshot_date DESC
          `, [shopId, date_from || null, date_to || null]);
          data = shopResult.rows;
          break;

        case 'courier_performance':
          const courierResult = await client.query(`
            SELECT 
              courier_name,
              total_orders,
              delivered_orders,
              in_transit_orders,
              pending_orders,
              cancelled_orders,
              completion_rate,
              on_time_rate,
              total_reviews,
              avg_rating,
              trust_score,
              avg_delivery_days,
              customer_count,
              last_order_date
            FROM courier_analytics
            ORDER BY trust_score DESC, avg_rating DESC
          `);
          data = courierResult.rows;
          break;

        case 'order_details':
          const orderResult = await client.query(`
            SELECT 
              order_id,
              tracking_number,
              order_status,
              customer_name,
              customer_email,
              postal_code,
              city,
              country,
              delivery_address,
              created_at
            FROM orders
            WHERE ($1::timestamp IS NULL OR created_at >= $1)
              AND ($2::timestamp IS NULL OR created_at <= $2)
            ORDER BY created_at DESC
            LIMIT 1000
          `, [date_from || null, date_to || null]);
          data = orderResult.rows;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type',
          });
      }

      // Convert to CSV
      const csv = arrayToCSV(data);

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return res.status(200).send(csv);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Export CSV API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}
