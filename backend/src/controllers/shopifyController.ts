import { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

interface ShopifyWebhookRequest extends Request {
  body: {
    id: number;
    order_id: number;
    order_number: string;
    status: string;
    carrier_identifier: string;
    service: string;
    tracking_number: string;
    tracking_numbers: string[];
    tracking_urls: string[];
    tracking_company: string;
    location_id: number;
    origin_address: {
      first_name: string;
      last_name: string;
      company: string;
      address1: string;
      address2: string;
      city: string;
      province: string;
      country: string;
      zip: string;
      phone: string;
    };
    destination: {
      first_name: string;
      last_name: string;
      company: string;
      address1: string;
      address2: string;
      city: string;
      province: string;
      country: string;
      zip: string;
      phone: string;
    };
    line_items: Array<{
      id: number;
      variant_id: number;
      title: string;
      quantity: number;
      sku: string;
      variant_title: string;
      vendor: string;
      fulfillment_service: string;
      product_id: number;
      requires_shipping: boolean;
      taxable: boolean;
      gift_card: boolean;
      name: string;
      variant_inventory_management: string;
      properties: any[];
      product_exists: boolean;
      fulfillable_quantity: number;
      grams: number;
      price: string;
      total_discount: string;
      fulfillment_status: string;
    }>;
    receipt: {
      testcase: boolean;
      authorization: string;
    };
    name: string;
    admin_graphql_api_id: string;
    created_at: string;
    updated_at: string;
    email: string;
    notify_customer: boolean;
    shipment_status: string;
  };
}

// Verify Shopify webhook signature
const verifyShopifyWebhook = (data: string, signature: string, secret: string): boolean => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data, 'utf8');
  const calculatedSignature = hmac.digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
};

// Handle Shopify fulfillment creation webhook
export const handleFulfillmentCreated = async (req: ShopifyWebhookRequest, res: Response) => {
  try {
    const signature = req.headers['x-shopify-hmac-sha256'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    
    if (!signature || !shopDomain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required headers',
      });
    }

    // Get shop configuration
    const shopQuery = await db.query(
      'SELECT * FROM shopify_integrations WHERE shop_domain = $1 AND is_active = true',
      [shopDomain]
    );

    if (shopQuery.rows.length === 0) {
      logger.warn(`Webhook from unregistered shop: ${shopDomain}`);
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
      });
    }

    const shop = shopQuery.rows[0];
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyShopifyWebhook(rawBody, signature, shop.webhook_secret)) {
      logger.warn(`Invalid webhook signature from shop: ${shopDomain}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    const fulfillment = req.body;
    
    // Map Shopify carrier to our courier system
    const courierMapping = await mapShopifyCarrierToCourier(fulfillment.tracking_company);
    
    if (!courierMapping) {
      logger.warn(`Unknown carrier: ${fulfillment.tracking_company} for shop: ${shopDomain}`);
      // Still create the order but mark as unmapped carrier
    }

    // Create order in our system
    const orderId = uuidv4();
    const orderData = {
      order_id: orderId,
      store_id: shop.store_id,
      courier_id: courierMapping?.courier_id || null,
      tracking_number: fulfillment.tracking_number,
      order_number: fulfillment.order_number,
      shopify_order_id: fulfillment.order_id.toString(),
      shopify_fulfillment_id: fulfillment.id.toString(),
      estimated_delivery_date: null, // Will be updated when available
      pickup_address: JSON.stringify(fulfillment.origin_address),
      delivery_address: JSON.stringify(fulfillment.destination),
      package_details: JSON.stringify({
        line_items: fulfillment.line_items,
        service: fulfillment.service,
        carrier_identifier: fulfillment.carrier_identifier,
      }),
      status: mapShopifyStatusToOurStatus(fulfillment.status),
      integration_source: 'shopify',
      created_at: new Date(fulfillment.created_at),
    };

    const insertQuery = `
      INSERT INTO orders (
        order_id, store_id, courier_id, tracking_number, order_number,
        shopify_order_id, shopify_fulfillment_id, estimated_delivery_date,
        pickup_address, delivery_address, package_details, status,
        integration_source, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      orderData.order_id,
      orderData.store_id,
      orderData.courier_id,
      orderData.tracking_number,
      orderData.order_number,
      orderData.shopify_order_id,
      orderData.shopify_fulfillment_id,
      orderData.estimated_delivery_date,
      orderData.pickup_address,
      orderData.delivery_address,
      orderData.package_details,
      orderData.status,
      orderData.integration_source,
      orderData.created_at,
    ]);

    logger.info(`Shopify fulfillment created: ${fulfillment.id} -> Order: ${orderId}`, {
      shop: shopDomain,
      order_number: fulfillment.order_number,
      tracking_number: fulfillment.tracking_number,
      carrier: fulfillment.tracking_company,
    });

    // If we have a courier mapping, start tracking
    if (courierMapping) {
      await initializeOrderTracking(orderId, courierMapping.courier_id);
    }

    return res.status(200).json({
      success: true,
      data: {
        order_id: orderId,
        message: 'Fulfillment processed successfully',
      },
    });

  } catch (error) {
    logger.error('Error processing Shopify fulfillment webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process fulfillment',
    });
  }
};

// Handle Shopify fulfillment update webhook
export const handleFulfillmentUpdated = async (req: ShopifyWebhookRequest, res: Response) => {
  try {
    const signature = req.headers['x-shopify-hmac-sha256'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    
    const shop = await db.query(
      'SELECT * FROM shopify_integrations WHERE shop_domain = $1 AND is_active = true',
      [shopDomain]
    );

    if (shop.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    const rawBody = JSON.stringify(req.body);
    if (!verifyShopifyWebhook(rawBody, signature, shop.rows[0].webhook_secret)) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const fulfillment = req.body;

    // Update existing order
    const updateQuery = `
      UPDATE orders 
      SET status = $1, 
          package_details = $2,
          updated_at = NOW()
      WHERE shopify_fulfillment_id = $3
      RETURNING *
    `;

    const result = await db.query(updateQuery, [
      mapShopifyStatusToOurStatus(fulfillment.status),
      JSON.stringify({
        line_items: fulfillment.line_items,
        service: fulfillment.service,
        carrier_identifier: fulfillment.carrier_identifier,
        shipment_status: fulfillment.shipment_status,
      }),
      fulfillment.id.toString(),
    ]);

    if (result.rows.length === 0) {
      logger.warn(`Order not found for Shopify fulfillment: ${fulfillment.id}`);
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    logger.info(`Shopify fulfillment updated: ${fulfillment.id}`, {
      shop: shopDomain,
      status: fulfillment.status,
      shipment_status: fulfillment.shipment_status,
    });

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    logger.error('Error processing Shopify fulfillment update:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process fulfillment update',
    });
  }
};

// Register Shopify store integration
export const registerShopifyStore = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.user!;
    const {
      shop_domain,
      access_token,
      webhook_secret,
      store_name,
      email,
      plan_name,
    } = req.body;

    // Verify the shop exists and token is valid
    try {
      const shopifyResponse = await axios.get(`https://${shop_domain}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': access_token,
        },
      });

      if (!shopifyResponse.data.shop) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Shopify credentials',
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to verify Shopify store',
      });
    }

    const integrationId = uuidv4();

    // Create or update Shopify integration
    const query = `
      INSERT INTO shopify_integrations (
        integration_id, user_id, shop_domain, access_token, webhook_secret,
        store_name, email, plan_name, is_active, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
      ON CONFLICT (shop_domain) 
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        webhook_secret = EXCLUDED.webhook_secret,
        store_name = EXCLUDED.store_name,
        email = EXCLUDED.email,
        plan_name = EXCLUDED.plan_name,
        is_active = true,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await db.query(query, [
      integrationId,
      user_id,
      shop_domain,
      access_token,
      webhook_secret,
      store_name,
      email,
      plan_name,
    ]);

    // Create webhooks in Shopify
    await createShopifyWebhooks(shop_domain, access_token);

    logger.info(`Shopify store registered: ${shop_domain}`, {
      user_id,
      store_name,
    });

    const response: ApiResponse = {
      success: true,
      data: result.rows[0],
      message: 'Shopify store registered successfully',
    };

    return res.status(201).json(response);
  } catch (error) {
    logger.error('Error registering Shopify store:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register store',
    });
  }
};

// Create webhooks in Shopify
const createShopifyWebhooks = async (shopDomain: string, accessToken: string) => {
  const webhooks = [
    {
      topic: 'fulfillments/create',
      address: `${process.env.API_BASE_URL}/api/shopify/webhooks/fulfillments/create`,
      format: 'json',
    },
    {
      topic: 'fulfillments/update',
      address: `${process.env.API_BASE_URL}/api/shopify/webhooks/fulfillments/update`,
      format: 'json',
    },
    {
      topic: 'orders/cancelled',
      address: `${process.env.API_BASE_URL}/api/shopify/webhooks/orders/cancelled`,
      format: 'json',
    },
  ];

  for (const webhook of webhooks) {
    try {
      await axios.post(
        `https://${shopDomain}/admin/api/2023-10/webhooks.json`,
        { webhook },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
      logger.info(`Created webhook: ${webhook.topic} for ${shopDomain}`);
    } catch (error) {
      logger.warn(`Failed to create webhook ${webhook.topic} for ${shopDomain}:`, error);
    }
  }
};

// Map Shopify carrier names to our courier system
const mapShopifyCarrierToCourier = async (carrierName: string) => {
  const carrierMappings: { [key: string]: string[] } = {
    'fedex': ['FedEx', 'Federal Express'],
    'ups': ['UPS', 'United Parcel Service'],
    'usps': ['USPS', 'United States Postal Service'],
    'dhl': ['DHL', 'DHL Express'],
    'canada_post': ['Canada Post'],
    'purolator': ['Purolator'],
  };

  for (const [key, variations] of Object.entries(carrierMappings)) {
    if (variations.some(variation => 
      carrierName.toLowerCase().includes(variation.toLowerCase())
    )) {
      const courier = await db.query(
        'SELECT courier_id FROM couriers WHERE LOWER(courier_name) LIKE $1 AND is_active = true',
        [`%${key}%`]
      );
      
      if (courier.rows.length > 0) {
        return { courier_id: courier.rows[0].courier_id };
      }
    }
  }

  return null;
};

// Map Shopify fulfillment status to our order status
const mapShopifyStatusToOurStatus = (shopifyStatus: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'pending',
    'open': 'confirmed',
    'success': 'picked_up',
    'cancelled': 'cancelled',
    'error': 'failed',
    'failure': 'failed',
  };

  return statusMap[shopifyStatus] || 'pending';
};

// Initialize order tracking
const initializeOrderTracking = async (orderId: string, courierId: string) => {
  try {
    // This would integrate with courier APIs to start tracking
    logger.info(`Initializing tracking for order: ${orderId} with courier: ${courierId}`);
    
    // Update order status to indicate tracking has started
    await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2',
      ['in_transit', orderId]
    );
  } catch (error) {
    logger.error(`Failed to initialize tracking for order ${orderId}:`, error);
  }
};

// Get Shopify integration analytics
export const getShopifyAnalytics = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.user!;
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        si.shop_domain,
        si.store_name,
        si.created_at as integration_date,
        COUNT(o.order_id) as total_orders,
        COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN o.created_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_orders,
        AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating END) as avg_rating,
        COUNT(DISTINCT o.courier_id) as unique_carriers
      FROM shopify_integrations si
      LEFT JOIN orders o ON si.store_id = o.store_id AND o.integration_source = 'shopify'
      LEFT JOIN reviews r ON o.order_id = r.order_id
      WHERE si.user_id = $1 AND si.is_active = true
      GROUP BY si.integration_id, si.shop_domain, si.store_name, si.created_at
      ORDER BY si.created_at DESC
    `;

    const result = await db.query(query, [user_id]);

    const response: ApiResponse = {
      success: true,
      data: {
        integrations: result.rows,
        period_days: days,
      },
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error fetching Shopify analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
};

