import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import axios from 'axios';
import db from '../config/database';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

// Generate API key for integration
export const generateApiKey = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.user!;
    const { integration_name, callback_url, webhook_secret } = req.body;

    const api_key = `pk_${crypto.randomBytes(32).toString('hex')}`;
    const integration_id = uuidv4();

    const query = `
      INSERT INTO integrations (
        integration_id, user_id, integration_name, api_key, 
        callback_url, webhook_secret, is_active, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query(query, [
      integration_id,
      user_id,
      integration_name,
      api_key,
      callback_url,
      webhook_secret || crypto.randomBytes(32).toString('hex'),
    ]);

    logger.info(`API key generated for user ${user_id}: ${integration_name}`);

    const response: ApiResponse = {
      success: true,
      data: result.rows[0],
      message: 'API key generated successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key',
    });
  }
};

// Get carrier ratings for checkout display
export const getCarrierRatings = async (req: Request, res: Response) => {
  try {
    const { api_key } = req.headers;
    const { service_area, limit = 10 } = req.query;

    // Validate API key
    const integration = await db.query(
      'SELECT * FROM integrations WHERE api_key = $1 AND is_active = true',
      [api_key]
    );

    if (integration.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    let whereClause = 'WHERE c.is_active = true';
    const queryParams: any[] = [];

    if (service_area) {
      queryParams.push(`%${service_area}%`);
      whereClause += ` AND c.service_areas::text ILIKE $${queryParams.length}`;
    }

    const query = `
      SELECT 
        c.courier_id,
        c.courier_name,
        c.contact_email,
        c.service_areas,
        COALESCE(cts.trust_score, 0) as trust_score,
        COALESCE(cts.rating, 0) as rating,
        COALESCE(cts.completion_rate, 0) as completion_rate,
        COALESCE(cts.on_time_rate, 0) as on_time_rate,
        COALESCE(cts.response_time, 0) as response_time,
        COALESCE(cts.customer_satisfaction, 0) as customer_satisfaction,
        COALESCE(cts.total_orders, 0) as total_orders,
        COALESCE(cts.total_reviews, 0) as total_reviews,
        CASE 
          WHEN cts.trust_score >= 90 THEN 'A+'
          WHEN cts.trust_score >= 80 THEN 'A'
          WHEN cts.trust_score >= 70 THEN 'B+'
          WHEN cts.trust_score >= 60 THEN 'B'
          WHEN cts.trust_score >= 50 THEN 'C+'
          WHEN cts.trust_score >= 40 THEN 'C'
          ELSE 'D'
        END as performance_grade
      FROM couriers c
      LEFT JOIN courier_trust_scores cts ON c.courier_id = cts.courier_id
      ${whereClause}
      ORDER BY cts.trust_score DESC NULLS LAST
      LIMIT $${queryParams.length + 1}
    `;

    queryParams.push(limit);
    const result = await db.query(query, queryParams);

    // Log API usage
    await db.query(
      'UPDATE integrations SET last_used = NOW(), usage_count = usage_count + 1 WHERE api_key = $1',
      [api_key]
    );

    const response: ApiResponse = {
      success: true,
      data: {
        carriers: result.rows,
        total: result.rows.length,
        service_area: service_area || 'all',
      },
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error fetching carrier ratings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch carrier ratings',
    });
  }
};

// Submit order for tracking
export const submitOrder = async (req: Request, res: Response) => {
  try {
    const { api_key } = req.headers;
    const {
      order_reference,
      courier_id,
      pickup_address,
      delivery_address,
      package_details,
      estimated_delivery,
      callback_url,
    } = req.body;

    // Validate API key and get store info
    const integration = await db.query(`
      SELECT i.*, s.store_id 
      FROM integrations i
      LEFT JOIN stores s ON i.user_id = s.user_id
      WHERE i.api_key = $1 AND i.is_active = true
    `, [api_key]);

    if (integration.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    const { user_id, integration_id } = integration.rows[0];
    const store_id = integration.rows[0].store_id;

    const order_id = uuidv4();

    const query = `
      INSERT INTO orders (
        order_id, store_id, courier_id, order_reference,
        pickup_address, delivery_address, package_details,
        estimated_delivery_date, status, integration_id,
        callback_url, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query(query, [
      order_id,
      store_id,
      courier_id,
      order_reference,
      JSON.stringify(pickup_address),
      JSON.stringify(delivery_address),
      JSON.stringify(package_details),
      estimated_delivery,
      integration_id,
      callback_url,
    ]);

    logger.info(`Order submitted via API: ${order_reference} (${order_id})`);

    // Send callback notification
    if (callback_url) {
      try {
        await axios.post(callback_url, {
          event: 'order.created',
          order_id: order_id,
          order_reference: order_reference,
          status: 'pending',
          timestamp: new Date().toISOString(),
        }, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'X-Performile-Signature': generateWebhookSignature(
              JSON.stringify({ order_id, status: 'pending' }),
              integration.rows[0].webhook_secret
            ),
          },
        });
      } catch (callbackError) {
        logger.warn(`Failed to send callback for order ${order_id}:`, callbackError);
      }
    }

    const response: ApiResponse = {
      success: true,
      data: result.rows[0],
      message: 'Order submitted successfully',
    };

    return res.status(201).json(response);
  } catch (error) {
    logger.error('Error submitting order:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit order',
    });
  }
};

// Update order status (for couriers)
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;
    const { status, location, notes, estimated_delivery } = req.body;
    const { user_id } = req.user!;

    // Verify courier owns this order
    const orderCheck = await db.query(`
      SELECT o.*, c.courier_name, i.callback_url, i.webhook_secret
      FROM orders o
      JOIN couriers c ON o.courier_id = c.courier_id
      LEFT JOIN integrations i ON o.integration_id = i.integration_id
      WHERE o.order_id = $1 AND c.courier_id IN (
        SELECT courier_id FROM couriers WHERE contact_email = (
          SELECT email FROM users WHERE user_id = $2
        )
      )
    `, [order_id, user_id]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or access denied',
      });
    }

    const order = orderCheck.rows[0];

    // Update order status
    const updateQuery = `
      UPDATE orders 
      SET status = $1, current_location = $2, status_notes = $3,
          estimated_delivery_date = COALESCE($4, estimated_delivery_date),
          updated_at = NOW()
      WHERE order_id = $5
      RETURNING *
    `;

    const result = await db.query(updateQuery, [
      status,
      location ? JSON.stringify(location) : null,
      notes,
      estimated_delivery,
      order_id,
    ]);

    // Send callback notification
    if (order.callback_url) {
      try {
        const callbackData = {
          event: 'order.status_updated',
          order_id: order_id,
          order_reference: order.order_reference,
          status: status,
          location: location,
          notes: notes,
          estimated_delivery: estimated_delivery,
          timestamp: new Date().toISOString(),
        };

        await axios.post(order.callback_url, callbackData, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'X-Performile-Signature': generateWebhookSignature(
              JSON.stringify(callbackData),
              order.webhook_secret
            ),
          },
        });
      } catch (callbackError) {
        logger.warn(`Failed to send callback for order ${order_id}:`, callbackError);
      }
    }

    logger.info(`Order status updated: ${order_id} -> ${status}`);

    const response: ApiResponse = {
      success: true,
      data: result.rows[0],
      message: 'Order status updated successfully',
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update order status',
    });
  }
};

// Get integration analytics
export const getIntegrationAnalytics = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.user!;
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        i.integration_name,
        i.usage_count,
        i.last_used,
        COUNT(o.order_id) as total_orders,
        COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN o.created_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_orders,
        AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating END) as avg_rating
      FROM integrations i
      LEFT JOIN orders o ON i.integration_id = o.integration_id
      LEFT JOIN reviews r ON o.order_id = r.order_id
      WHERE i.user_id = $1 AND i.is_active = true
      GROUP BY i.integration_id, i.integration_name, i.usage_count, i.last_used
      ORDER BY i.created_at DESC
    `;

    const result = await db.query(query, [user_id]);

    const response: ApiResponse = {
      success: true,
      data: {
        integrations: result.rows,
        period_days: days,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching integration analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch integration analytics',
    });
  }
};

// Generate webhook signature for security
function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Verify webhook signature
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

