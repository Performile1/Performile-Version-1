// Shopify App for Performile Integration
// This creates a Shopify app that merchants can install to automatically sync shipments

import { Shopify } from '@shopify/shopify-api';
import { shopifyApp } from '@shopify/shopify-app-express';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';
import { restResources } from '@shopify/shopify-api/rest/admin/2023-10';
import express from 'express';
import axios from 'axios';

const PORT = process.env.PORT || 3001;
const PERFORMILE_API_BASE = process.env.PERFORMILE_API_BASE || 'http://localhost:3000';

// Initialize Shopify configuration
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: [
    'read_orders',
    'read_fulfillments',
    'write_fulfillments',
    'read_shipping',
    'write_shipping',
  ].join(','),
  HOST_NAME: process.env.SHOPIFY_APP_URL.replace(/https?:\/\//, ''),
  HOST_SCHEME: 'https',
  API_VERSION: '2023-10',
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new SQLiteSessionStorage('shopify_sessions.db'),
});

// Create Shopify app instance
const shopify = shopifyApp({
  api: {
    restResources,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
});

const app = express();

// Use Shopify middleware
app.use(shopify.config.auth.path, shopify.auth.begin());
app.use(shopify.config.auth.callbackPath, shopify.auth.callback(), async (req, res) => {
  // After successful authentication, register with Performile
  try {
    const session = res.locals.shopify.session;
    
    // Register the store with Performile
    await axios.post(`${PERFORMILE_API_BASE}/api/shopify/register`, {
      shop_domain: session.shop,
      access_token: session.accessToken,
      webhook_secret: process.env.SHOPIFY_WEBHOOK_SECRET,
      store_name: session.shop,
      email: '', // Will be populated from shop data
      plan_name: 'basic',
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERFORMILE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Store registered with Performile: ${session.shop}`);
  } catch (error) {
    console.error('Failed to register store with Performile:', error.message);
  }

  res.redirect(`/?shop=${res.locals.shopify.session.shop}&host=${req.query.host}`);
});

// Webhook handler
app.use(shopify.config.webhooks.path, shopify.processWebhooks({
  webhookHandlers: {
    FULFILLMENTS_CREATE: {
      deliveryMethod: 'http',
      callbackUrl: '/api/webhooks/fulfillments/create',
      callback: async (topic, shop, body, webhookId) => {
        console.log(`Received ${topic} webhook for ${shop}`);
        
        try {
          // Forward to Performile API
          await axios.post(`${PERFORMILE_API_BASE}/api/shopify/webhooks/fulfillments/create`, body, {
            headers: {
              'X-Shopify-Shop-Domain': shop,
              'X-Shopify-Webhook-Id': webhookId,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Failed to forward webhook to Performile:', error.message);
        }
      },
    },
    FULFILLMENTS_UPDATE: {
      deliveryMethod: 'http',
      callbackUrl: '/api/webhooks/fulfillments/update',
      callback: async (topic, shop, body, webhookId) => {
        console.log(`Received ${topic} webhook for ${shop}`);
        
        try {
          await axios.post(`${PERFORMILE_API_BASE}/api/shopify/webhooks/fulfillments/update`, body, {
            headers: {
              'X-Shopify-Shop-Domain': shop,
              'X-Shopify-Webhook-Id': webhookId,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Failed to forward webhook to Performile:', error.message);
        }
      },
    },
    ORDERS_CANCELLED: {
      deliveryMethod: 'http',
      callbackUrl: '/api/webhooks/orders/cancelled',
      callback: async (topic, shop, body, webhookId) => {
        console.log(`Received ${topic} webhook for ${shop}`);
        
        try {
          await axios.post(`${PERFORMILE_API_BASE}/api/shopify/webhooks/orders/cancelled`, body, {
            headers: {
              'X-Shopify-Shop-Domain': shop,
              'X-Shopify-Webhook-Id': webhookId,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Failed to forward webhook to Performile:', error.message);
        }
      },
    },
  },
}));

// Serve the React app for embedded app pages
app.get('/', shopify.ensureInstalledOnShop(), async (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Performile - Delivery Performance Tracking</title>
        <meta charset="utf-8" />
        <base target="_top" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://unpkg.com/@shopify/app-bridge@3"></script>
        <script src="https://unpkg.com/@shopify/app-bridge-utils@3"></script>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 20px;
                background: #f6f6f7;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                margin: 0 auto 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
            }
            .status {
                padding: 12px 20px;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: 500;
            }
            .status.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .feature {
                display: flex;
                align-items: center;
                margin: 15px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 6px;
            }
            .feature-icon {
                width: 40px;
                height: 40px;
                background: #667eea;
                border-radius: 8px;
                margin-right: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 18px;
            }
            .btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                text-decoration: none;
                display: inline-block;
                margin: 10px 10px 10px 0;
            }
            .btn:hover {
                background: #5a67d8;
            }
            .btn.secondary {
                background: #6c757d;
            }
            .btn.secondary:hover {
                background: #5a6268;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">P</div>
                <h1>Performile Integration</h1>
                <p>Delivery performance tracking for your Shopify store</p>
            </div>

            <div class="status success">
                ✅ Successfully connected to Performile! Your shipments will now be automatically tracked.
            </div>

            <h3>What happens next?</h3>
            
            <div class="feature">
                <div class="feature-icon">📦</div>
                <div>
                    <strong>Automatic Tracking</strong><br>
                    When you create fulfillments in Shopify, they'll automatically appear in Performile for performance tracking.
                </div>
            </div>

            <div class="feature">
                <div class="feature-icon">📊</div>
                <div>
                    <strong>Performance Analytics</strong><br>
                    View detailed analytics about your delivery performance, carrier ratings, and customer satisfaction.
                </div>
            </div>

            <div class="feature">
                <div class="feature-icon">⭐</div>
                <div>
                    <strong>Trust Scores</strong><br>
                    Build trust with customers by displaying carrier performance ratings during checkout.
                </div>
            </div>

            <div class="feature">
                <div class="feature-icon">🔔</div>
                <div>
                    <strong>Real-time Updates</strong><br>
                    Get notified about delivery issues and track resolution times automatically.
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="${PERFORMILE_API_BASE}/dashboard" class="btn" target="_blank">
                    Open Performile Dashboard
                </a>
                <a href="https://docs.performile.com/shopify" class="btn secondary" target="_blank">
                    View Documentation
                </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@performile.com">support@performile.com</a>
            </div>
        </div>

        <script>
            // Initialize Shopify App Bridge
            var AppBridge = window['app-bridge'];
            var createApp = AppBridge.default;
            var Redirect = AppBridge.actions.Redirect;
            
            var app = createApp({
                apiKey: '${process.env.SHOPIFY_API_KEY}',
                host: '${Buffer.from(req.query.host, 'base64').toString()}',
            });

            // Handle navigation to external links
            document.querySelectorAll('a[target="_blank"]').forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    var redirect = Redirect.create(app);
                    redirect.dispatch(Redirect.Action.REMOTE, {
                        url: this.href,
                        newContext: true,
                    });
                });
            });
        </script>
    </body>
    </html>
  `);
});

// API endpoint to get integration status
app.get('/api/status', shopify.ensureInstalledOnShop(), async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    // Check if store is registered with Performile
    const response = await axios.get(`${PERFORMILE_API_BASE}/api/shopify/analytics`, {
      headers: {
        'Authorization': `Bearer ${process.env.PERFORMILE_API_TOKEN}`,
      },
      params: {
        shop_domain: session.shop,
      },
    });

    res.json({
      success: true,
      data: {
        shop: session.shop,
        connected: true,
        analytics: response.data,
      },
    });
  } catch (error) {
    res.json({
      success: false,
      error: 'Failed to fetch status',
      data: {
        shop: res.locals.shopify.session?.shop,
        connected: false,
      },
    });
  }
});

app.listen(PORT, () => {
  console.log(`Shopify app listening on port ${PORT}`);
});
