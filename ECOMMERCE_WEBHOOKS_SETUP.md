# E-commerce Platform Webhook Setup Guide

**Supported Platforms:** Shopify, WooCommerce, OpenCart, PrestaShop, Magento, Wix, Squarespace

---

## 🎯 **Webhook URLs**

### Universal Endpoint (Recommended)
```
https://frontend-two-swart-31.vercel.app/api/webhooks/ecommerce?platform={PLATFORM}
```

Replace `{PLATFORM}` with:
- `shopify`
- `woocommerce`
- `opencart`
- `prestashop`
- `magento`
- `wix`
- `squarespace`

### Platform-Specific Endpoints
- **Shopify:** `/api/webhooks?provider=shopify`
- **WooCommerce:** `/api/webhooks/woocommerce`
- **Others:** `/api/webhooks/ecommerce?platform={platform}`

---

## 🛍️ **Platform-Specific Setup**

### 1. Shopify

**Step 1:** Go to Shopify Admin → Settings → Notifications → Webhooks

**Step 2:** Create webhook:
- **Event:** Order fulfillment
- **Format:** JSON
- **URL:** `https://frontend-two-swart-31.vercel.app/api/webhooks?provider=shopify`
- **API Version:** Latest

**Step 3:** Save webhook secret to Vercel:
- Environment Variable: `SHOPIFY_WEBHOOK_SECRET`
- Value: (from Shopify webhook settings)

---

### 2. WooCommerce

**Step 1:** Install WooCommerce Webhooks (built-in)

**Step 2:** Go to WooCommerce → Settings → Advanced → Webhooks

**Step 3:** Add webhook:
- **Name:** Performile Order Completed
- **Status:** Active
- **Topic:** Order completed
- **Delivery URL:** `https://frontend-two-swart-31.vercel.app/api/webhooks/ecommerce?platform=woocommerce`
- **Secret:** Generate a random string
- **API Version:** WP REST API Integration v3

**Step 4:** Save secret to Vercel:
- Environment Variable: `WOOCOMMERCE_WEBHOOK_SECRET`
- Value: (your generated secret)

---

### 3. OpenCart

**Step 1:** Install Performile OpenCart Extension (custom module needed)

**Step 2:** Configure extension:
- **Webhook URL:** `https://frontend-two-swart-31.vercel.app/api/webhooks/ecommerce?platform=opencart`
- **Trigger:** Order Status = Complete

**Alternative:** Use OpenCart Events system
```php
// In catalog/controller/checkout/success.php
$this->model_extension_performile->sendWebhook($order_info);
```

---

### 4. PrestaShop

**Step 1:** Install Performile PrestaShop Module

**Step 2:** Configure module:
- **Webhook URL:** `https://frontend-two-swart-31.vercel.app/api/webhooks/ecommerce?platform=prestashop`
- **Trigger Event:** Order Status = Delivered (State ID: 5)

**Alternative:** Use PrestaShop Hooks
```php
// In modules/performile/performile.php
public function hookActionOrderStatusPostUpdate($params) {
    $this->sendWebhook($params['newOrderStatus']);
}
```

---

### 5. Magento 2

**Step 1:** Create Observer for order shipment

**Step 2:** Add to `etc/events.xml`:
```xml
<event name="sales_order_shipment_save_after">
    <observer name="performile_order_shipped" 
              instance="Vendor\Performile\Observer\OrderShipped" />
</event>
```

**Step 3:** Create Observer class:
```php
namespace Vendor\Performile\Observer;

class OrderShipped implements ObserverInterface {
    public function execute(\Magento\Framework\Event\Observer $observer) {
        $shipment = $observer->getEvent()->getShipment();
        $this->sendWebhook($shipment->getOrder());
    }
}
```

**Webhook URL:** `https://frontend-two-swart-31.vercel.app/api/webhooks/ecommerce?platform=magento`

---

### 6. Wix

**Step 1:** Go to Wix Dashboard → Settings → Webhooks

**Step 2:** Add webhook:
- **Event:** Orders - Fulfilled
- **Endpoint URL:** `https://frontend-two-swart-31.vercel.app/api/webhooks/ecommerce?platform=wix`

**Step 3:** Test webhook

**Note:** Wix automatically signs webhooks with JWT

---

### 7. Squarespace

**Step 1:** Enable Squarespace Commerce API

**Step 2:** Create webhook:
- **Event:** order.fulfill
- **URL:** `https://frontend-two-swart-31.vercel.app/api/webhooks/ecommerce?platform=squarespace`

**Step 3:** Add API key to Vercel:
- Environment Variable: `SQUARESPACE_API_KEY`
- Value: (from Squarespace API settings)

---

## 🔐 **Security Configuration**

### Environment Variables Needed

Add these to Vercel → Settings → Environment Variables:

```bash
# Shopify
SHOPIFY_WEBHOOK_SECRET=your_shopify_secret

# WooCommerce
WOOCOMMERCE_WEBHOOK_SECRET=your_woocommerce_secret

# Magento
MAGENTO_WEBHOOK_SECRET=your_magento_secret

# Wix (optional - uses JWT)
WIX_APP_SECRET=your_wix_app_secret

# Squarespace
SQUARESPACE_API_KEY=your_squarespace_api_key
```

---

## 🧪 **Testing Webhooks**

### Test with cURL:

```bash
# WooCommerce Test
curl -X POST https://frontend-two-swart-31.vercel.app/api/webhooks/ecommerce?platform=woocommerce \
  -H "Content-Type: application/json" \
  -H "X-WC-Webhook-Topic: order.completed" \
  -d '{
    "id": 12345,
    "number": "12345",
    "status": "completed",
    "billing": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "shipping": {
      "address_1": "123 Main St",
      "city": "New York",
      "postcode": "10001"
    },
    "total": "99.99"
  }'
```

### Test with Postman:
1. Import webhook collection
2. Set platform query parameter
3. Add sample order data
4. Send POST request

---

## 📊 **Webhook Payload Examples**

### WooCommerce
```json
{
  "id": 12345,
  "number": "12345",
  "status": "completed",
  "billing": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  },
  "shipping": {
    "address_1": "123 Main St",
    "city": "New York",
    "postcode": "10001"
  },
  "total": "99.99"
}
```

### Shopify
```json
{
  "id": 820982911946154508,
  "order_number": 1234,
  "email": "john@example.com",
  "fulfillment_status": "fulfilled",
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address1": "123 Main St",
    "city": "New York",
    "zip": "10001"
  },
  "total_price": "99.99"
}
```

---

## 🔄 **What Happens After Webhook**

1. **Webhook Received** → Platform identified
2. **Order Processed** → Delivery request created/updated
3. **Review Token Generated** → Unique secure token
4. **Email Sent** → Review request to customer
5. **Reminder Scheduled** → 7 days later if no review
6. **Database Updated** → All tracking info saved

---

## 📝 **Custom Integration**

For platforms not listed, use the generic webhook format:

```bash
POST /api/webhooks/ecommerce?platform=custom
Content-Type: application/json

{
  "event": "order_completed",
  "order": {
    "id": "ORDER_ID",
    "number": "ORDER_NUMBER",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "total": 99.99,
    "shipping_address": "123 Main St, City, ZIP"
  }
}
```

---

## 🚀 **Quick Start Checklist**

- [ ] Choose your e-commerce platform
- [ ] Copy webhook URL
- [ ] Configure webhook in platform settings
- [ ] Add webhook secret to Vercel (if required)
- [ ] Test webhook with sample order
- [ ] Verify email is sent
- [ ] Check database for delivery request
- [ ] Confirm review link works

---

## 💡 **Tips**

1. **Test in Staging First** - Use test orders before going live
2. **Monitor Webhook Logs** - Check Vercel function logs
3. **Set Up Alerts** - Get notified of webhook failures
4. **Use Retry Logic** - Most platforms retry failed webhooks
5. **Validate Data** - Always validate incoming webhook data

---

## 🐛 **Troubleshooting**

### Webhook Not Received
- Check webhook URL is correct
- Verify platform is sending webhooks
- Check Vercel function logs
- Ensure no firewall blocking

### Email Not Sent
- Verify Resend API key is set
- Check email address is valid
- Look for errors in logs
- Confirm delivery request was created

### Review Link Not Working
- Verify token was generated
- Check database for review_link_token
- Ensure review form route exists
- Test link manually

---

## 📞 **Support**

For integration help:
- Check platform documentation
- Review Vercel function logs
- Test with sample payloads
- Contact platform support if needed

---

**All platforms now supported! 🎉**
