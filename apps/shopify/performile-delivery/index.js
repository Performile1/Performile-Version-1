/**
 * Performile Delivery - Shopify App
 * Main server file
 */

require('dotenv').config();
const express = require('express');
const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { restResources } = require('@shopify/shopify-api/rest/admin/2024-01');

const app = express();
const PORT = process.env.PORT || 3000;

// Shopify API configuration
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_orders', 'write_orders', 'read_customers', 'read_shipping'],
  hostName: process.env.HOST.replace(/https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  restResources,
});

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Performile Delivery' });
});

// OAuth routes
app.get('/auth', async (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  const authRoute = await shopify.auth.begin({
    shop: shopify.utils.sanitizeShop(shop, true),
    callbackPath: '/auth/callback',
    isOnline: false,
    rawRequest: req,
    rawResponse: res,
  });

  res.redirect(authRoute);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callback;
    
    // Store session in database
    // TODO: Implement session storage
    
    // Redirect to app
    const host = req.query.host;
    const redirectUrl = `/?shop=${session.shop}&host=${host}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

// API Routes
app.get('/api/courier-ratings', async (req, res) => {
  const { postal_code, limit = 3 } = req.query;
  
  if (!postal_code) {
    return res.status(400).json({ error: 'Postal code required' });
  }

  try {
    const axios = require('axios');
    const response = await axios.get(
      `https://frontend-two-swart-31.vercel.app/api/couriers/ratings-by-postal`,
      {
        params: { postal_code, limit }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching courier ratings:', error);
    res.status(500).json({ error: 'Failed to fetch courier ratings' });
  }
});

// Webhook handler
app.post('/api/webhooks/orders', async (req, res) => {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const topic = req.get('X-Shopify-Topic');
    const shop = req.get('X-Shopify-Shop-Domain');

    // Verify webhook
    // TODO: Implement webhook verification

    console.log(`Received webhook: ${topic} from ${shop}`);

    // Process order webhook
    if (topic === 'orders/create' || topic === 'orders/updated') {
      const order = req.body;
      
      // Send order to Performile
      const axios = require('axios');
      await axios.post(
        'https://frontend-two-swart-31.vercel.app/api/orders/create',
        {
          order_id: order.id,
          order_number: order.order_number,
          customer_email: order.email,
          shipping_address: order.shipping_address,
          // Add more order data
        }
      );
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Serve app
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Performile Delivery</title>
      <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
    </head>
    <body>
      <div id="app">
        <h1>Performile Delivery Ratings</h1>
        <p>Show verified courier ratings in your checkout.</p>
      </div>
      <script>
        var AppBridge = window['app-bridge'];
        var createApp = AppBridge.default;
        
        var app = createApp({
          apiKey: '${process.env.SHOPIFY_API_KEY}',
          host: new URLSearchParams(window.location.search).get('host')
        });
      </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`Performile Delivery app listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
