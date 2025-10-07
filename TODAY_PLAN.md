# Today's Development Plan - October 7, 2025

**Session Start:** 06:58  
**Goal:** Consumer ratings display + Automated reviews + E-commerce plugins  
**Estimated Time:** 8-10 hours

---

## 🎯 CRITICAL PRIORITIES (Must Complete Today)

### **Priority 1: Consumer-Facing Ratings (2-3 hours)**

**Problem:** Consumers can't see courier ratings before choosing delivery  
**Solution:** Display TrustScore and ratings in checkout

**Tasks:**
- [ ] Create API endpoint to get courier ratings by postal code
- [ ] Build consumer-facing courier selection component
- [ ] Show ratings, reviews count, and TrustScore
- [ ] Add to checkout flow

**Files to Create:**
- `frontend/api/couriers/ratings-by-postal.ts`
- `frontend/src/components/checkout/CourierSelector.tsx`
- Update order creation to include selected courier

---

### **Priority 2: Automated Review Requests (1-2 hours)**

**Problem:** Reviews not automatically sent when delivery completes  
**Solution:** Webhook triggers review email on delivery completion

**Tasks:**
- [ ] Create delivery completion webhook handler
- [ ] Trigger review email when status = 'delivered'
- [ ] Generate unique review link for customer
- [ ] Track review request sent status

**Files to Create:**
- `frontend/api/webhooks/delivery-completed.ts`
- Update `send-review-request.ts` to handle delivery webhooks
- Database: Add `review_request_sent` column to orders

---

### **Priority 3: WooCommerce Plugin (3-4 hours)**

**Problem:** No integration with WooCommerce stores  
**Solution:** Plugin that shows top couriers in checkout

**Tasks:**
- [ ] Create WooCommerce plugin structure
- [ ] Add settings page in WP admin
- [ ] Inject courier ratings banner in checkout
- [ ] Connect to Performile API
- [ ] Handle courier selection

**Files to Create:**
- `plugins/woocommerce/performile-delivery/performile-delivery.php`
- `plugins/woocommerce/performile-delivery/admin/settings.php`
- `plugins/woocommerce/performile-delivery/public/checkout-banner.php`
- `plugins/woocommerce/performile-delivery/assets/js/courier-selector.js`

**Banner Design:**
```
┌─────────────────────────────────────────────────────┐
│ 🚚 Top Rated Couriers in Your Area (12345)         │
│                                                     │
│ ⭐ DHL Express - 4.8/5 (234 reviews)                │
│ ⭐ PostNord - 4.6/5 (189 reviews)                   │
│ ⭐ Bring - 4.5/5 (156 reviews)                      │
│                                                     │
│ Powered by Performile                               │
└─────────────────────────────────────────────────────┘
```

---

### **Priority 4: Shopify App (3-4 hours)**

**Problem:** No integration with Shopify stores  
**Solution:** App that shows top couriers in checkout

**Tasks:**
- [ ] Create Shopify app structure
- [ ] Set up OAuth authentication
- [ ] Create app embed block for checkout
- [ ] Connect to Performile API
- [ ] Handle courier selection

**Files to Create:**
- `apps/shopify/performile-delivery/`
- `apps/shopify/performile-delivery/app.js` (Node.js backend)
- `apps/shopify/performile-delivery/extensions/checkout-ui/`
- `apps/shopify/performile-delivery/extensions/checkout-ui/src/Checkout.jsx`

---

## 📋 DETAILED IMPLEMENTATION PLAN

### **PHASE 1: Consumer Ratings API (1 hour)**

**Step 1: Create API Endpoint**
```typescript
// frontend/api/couriers/ratings-by-postal.ts
// GET /api/couriers/ratings-by-postal?postal_code=12345

// Returns:
{
  postal_code: "12345",
  couriers: [
    {
      courier_id: "uuid",
      courier_name: "DHL Express",
      trust_score: 4.8,
      total_reviews: 234,
      avg_delivery_time: "1-2 days",
      on_time_percentage: 95,
      logo_url: "https://..."
    }
  ]
}
```

**Step 2: Database Query**
```sql
SELECT 
  c.courier_id,
  c.courier_name,
  c.logo_url,
  AVG(r.rating) as trust_score,
  COUNT(r.review_id) as total_reviews,
  AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at))/86400) as avg_delivery_days,
  (COUNT(CASE WHEN o.status = 'delivered' AND o.delivered_at <= o.estimated_delivery THEN 1 END)::float / 
   COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) * 100) as on_time_percentage
FROM couriers c
LEFT JOIN orders o ON c.courier_id = o.courier_id
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.delivery_postal_code LIKE '12345%'
  AND o.created_at > NOW() - INTERVAL '6 months'
GROUP BY c.courier_id, c.courier_name, c.logo_url
HAVING COUNT(r.review_id) >= 5
ORDER BY trust_score DESC
LIMIT 5;
```

---

### **PHASE 2: Automated Review Requests (1 hour)**

**Step 1: Delivery Webhook Handler**
```typescript
// frontend/api/webhooks/delivery-completed.ts
// POST /api/webhooks/delivery-completed

// Triggered by courier when delivery status = 'delivered'
// 1. Update order status
// 2. Generate review link
// 3. Send review email
// 4. Mark review_request_sent = true
```

**Step 2: Review Email Template**
```html
Subject: How was your delivery from {courier_name}?

Hi {customer_name},

Your order #{order_number} was delivered by {courier_name}.

How was your experience?

[Rate Your Delivery] → https://performile.com/review/{unique_token}

⭐⭐⭐⭐⭐

Your feedback helps other customers choose the best courier!

Thanks,
Performile Team
```

**Step 3: Database Migration**
```sql
ALTER TABLE orders 
ADD COLUMN review_request_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN review_request_sent_at TIMESTAMP,
ADD COLUMN review_token VARCHAR(255) UNIQUE;

CREATE INDEX idx_orders_review_token ON orders(review_token);
```

---

### **PHASE 3: WooCommerce Plugin (3 hours)**

**Step 1: Plugin Structure**
```
plugins/woocommerce/performile-delivery/
├── performile-delivery.php          # Main plugin file
├── admin/
│   ├── settings.php                 # Settings page
│   └── assets/
│       ├── css/admin.css
│       └── js/admin.js
├── public/
│   ├── checkout-banner.php          # Checkout integration
│   └── assets/
│       ├── css/checkout.css
│       └── js/courier-selector.js
├── includes/
│   ├── api-client.php               # Performile API wrapper
│   └── helpers.php
└── readme.txt
```

**Step 2: Main Plugin File**
```php
<?php
/**
 * Plugin Name: Performile Delivery Ratings
 * Description: Show top-rated couriers in checkout based on customer location
 * Version: 1.0.0
 * Author: Performile
 */

// Hook into WooCommerce checkout
add_action('woocommerce_review_order_before_payment', 'performile_show_courier_banner');

function performile_show_courier_banner() {
    $postal_code = WC()->customer->get_shipping_postcode();
    
    // Get courier ratings from Performile API
    $couriers = performile_get_courier_ratings($postal_code);
    
    // Display banner
    include plugin_dir_path(__FILE__) . 'public/checkout-banner.php';
}
```

**Step 3: Settings Page**
```php
// admin/settings.php
// Add menu item in WordPress admin
// Fields: API Key, Enable/Disable, Number of couriers to show
```

---

### **PHASE 4: Shopify App (3 hours)**

**Step 1: App Structure**
```
apps/shopify/performile-delivery/
├── package.json
├── app.js                           # Express server
├── routes/
│   ├── auth.js                      # OAuth flow
│   └── api.js                       # API endpoints
├── extensions/
│   └── checkout-ui/
│       ├── shopify.extension.toml
│       └── src/
│           ├── Checkout.jsx         # React component
│           └── index.js
└── public/
    └── assets/
```

**Step 2: Checkout UI Extension**
```jsx
// extensions/checkout-ui/src/Checkout.jsx
import { useEffect, useState } from 'react';
import { Banner, useApi, useShippingAddress } from '@shopify/checkout-ui-extensions-react';

export default function CourierRatings() {
  const [couriers, setCouriers] = useState([]);
  const shippingAddress = useShippingAddress();
  const api = useApi();

  useEffect(() => {
    if (shippingAddress?.zip) {
      fetchCourierRatings(shippingAddress.zip);
    }
  }, [shippingAddress]);

  const fetchCourierRatings = async (postalCode) => {
    const response = await fetch(
      `https://frontend-two-swart-31.vercel.app/api/couriers/ratings-by-postal?postal_code=${postalCode}`
    );
    const data = await response.json();
    setCouriers(data.couriers);
  };

  return (
    <Banner title="Top Rated Couriers in Your Area">
      {couriers.map(courier => (
        <div key={courier.courier_id}>
          ⭐ {courier.courier_name} - {courier.trust_score}/5 ({courier.total_reviews} reviews)
        </div>
      ))}
    </Banner>
  );
}
```

---

## 🚀 EXTENDED PLAN: Complete Checkout Integration

### **Phase 5: Full Checkout Plugins (Future - 2-3 weeks each)**

**For Each Platform:**

#### **1. Shopify (Week 1-2)**
- Full checkout replacement
- Courier selection with live pricing
- Real-time delivery estimates
- Payment integration
- Order creation in Performile

#### **2. WooCommerce (Week 2-3)**
- Checkout block
- Shipping method integration
- Courier selection
- Payment processing
- Webhook integration

#### **3. OpenCart (Week 3-4)**
- Extension module
- Checkout modification
- Shipping integration
- Payment gateway

#### **4. PrestaShop (Week 4-5)**
- Module development
- Checkout hook
- Carrier integration
- Payment module

#### **5. Magento (Week 5-7)**
- Extension (complex)
- Checkout customization
- Shipping carrier
- Payment integration

#### **6. Wix (Week 7-8)**
- Wix App
- Checkout integration
- API connection
- Payment handling

#### **7. Squarespace (Week 8-9)**
- Code injection
- Checkout modification
- API integration
- Payment processing

---

## 📊 TODAY'S SUCCESS METRICS

**By End of Day:**
- [ ] Consumers can see courier ratings in checkout
- [ ] Review emails sent automatically on delivery
- [ ] WooCommerce plugin working (beta)
- [ ] Shopify app working (beta)
- [ ] 2 merchants testing plugins

**Testing Checklist:**
- [ ] API returns correct courier ratings by postal code
- [ ] Ratings display correctly in UI
- [ ] Review email triggers on delivery webhook
- [ ] WooCommerce banner shows in checkout
- [ ] Shopify banner shows in checkout
- [ ] Courier selection saves to order

---

## ⏰ TIME ALLOCATION

| Task | Time | Priority |
|------|------|----------|
| Consumer ratings API | 1h | HIGH |
| Automated review requests | 1h | HIGH |
| WooCommerce plugin | 3h | HIGH |
| Shopify app | 3h | HIGH |
| Testing & debugging | 1h | MEDIUM |
| Documentation | 1h | LOW |
| **TOTAL** | **10h** | |

---

## 🎯 DELIVERABLES

**By End of Day:**
1. ✅ Consumer-facing courier ratings API
2. ✅ Automated review request system
3. ✅ WooCommerce plugin (v1.0 beta)
4. ✅ Shopify app (v1.0 beta)
5. ✅ Documentation for merchants
6. ✅ Testing with 2 beta merchants

**Tomorrow:**
- Refine plugins based on feedback
- Add payment provider integrations
- Start on remaining 5 e-commerce platforms

---

## 📝 NOTES

**Key Decisions:**
- Start with banner/widget (simple) before full checkout replacement
- Focus on top 3 couriers per postal code
- Use TrustScore as primary metric
- Include review count for credibility

**Technical Considerations:**
- Cache courier ratings (15 min TTL)
- Handle postal code variations (12345, 123 45, etc.)
- Graceful fallback if API fails
- Mobile-responsive design

**Business Impact:**
- Increases merchant trust (show social proof)
- Improves courier selection (data-driven)
- Drives more reviews (automated requests)
- Creates viral loop (consumers see ratings → leave reviews → more data)

---

**Let's build! 🚀**
