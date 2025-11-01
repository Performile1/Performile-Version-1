# 🚀 Courier Integration System - Quick Start Guide

**Get up and running in 10 minutes!**

---

## Step 1: Deploy Database (2 minutes)

```bash
# Connect to your Supabase project
psql -h your-supabase-host -U postgres -d postgres

# Run the migration
\i supabase/migrations/20251022_courier_integration_system.sql

# Verify tables created
\dt courier_*
\dt shipment_*
\dt notification_*
```

**Expected Output:**
```
courier_integrations
courier_event_mappings
courier_sync_logs
shipment_events
notification_rules
notification_queue
notification_templates
rule_executions
ai_chat_courier_context
```

---

## Step 2: Set Environment Variables (1 minute)

Add to your `.env` or Vercel dashboard:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
WEBHOOK_SECRET=your-random-secret
```

---

## Step 3: Deploy APIs (2 minutes)

```bash
# If using Vercel
cd api
vercel --prod

# APIs will be available at:
# https://your-domain.com/api/courier-integrations
# https://your-domain.com/api/notification-rules
# https://your-domain.com/api/shipment-tracking
# https://your-domain.com/api/chat-courier
```

---

## Step 4: Deploy Frontend (2 minutes)

```bash
cd apps/web
npm run build
vercel --prod
```

---

## Step 5: Create Your First Integration (3 minutes)

### Option A: Using the UI

1. Navigate to `/integrations/couriers`
2. Click "Add Integration"
3. Select courier (e.g., DHL Express)
4. Enter API credentials
5. Click "Test Connection"
6. Click "Save"

### Option B: Using the API

```bash
curl -X POST https://your-domain.com/api/courier-integrations?action=create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courier_id": "dhl-express-uuid",
    "api_base_url": "https://api.dhl.com",
    "api_version": "v2",
    "auth_type": "api_key",
    "api_key": "your-dhl-api-key",
    "sync_frequency_minutes": 15
  }'
```

---

## Step 6: Create Your First Notification Rule (2 minutes)

### Using Pre-built Template

1. Navigate to `/notifications/rules`
2. Click "Use Template"
3. Select "Delayed Shipment Alert"
4. Click "Use Template"
5. Rule is now active!

### Using the API

```bash
curl -X POST https://your-domain.com/api/notification-rules?action=create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "Delayed Shipment Alert",
    "priority": 5,
    "conditions": {
      "operator": "AND",
      "conditions": [
        {
          "field": "days_since_last_scan",
          "operator": "greater_than",
          "value": 3
        }
      ]
    },
    "actions": [
      {
        "type": "send_notification",
        "target": "customer",
        "channel": "email",
        "template": "delayed_shipment"
      }
    ]
  }'
```

---

## ✅ Verification Checklist

- [ ] Database tables exist
- [ ] APIs respond (test with curl)
- [ ] Frontend loads without errors
- [ ] Can create integration
- [ ] Connection test succeeds
- [ ] Can create notification rule
- [ ] Rule appears in list
- [ ] Can view shipment timeline
- [ ] AI chat responds with context

---

## 🧪 Test the System

### Test 1: Add a Tracking Event

```bash
curl -X POST https://your-domain.com/api/shipment-tracking?action=add_event \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "your-order-uuid",
    "tracking_number": "1234567890",
    "event_type": "in_transit",
    "event_timestamp": "2025-10-22T10:00:00Z",
    "status": "in_transit",
    "location_city": "Stockholm",
    "location_country": "SE"
  }'
```

### Test 2: View Timeline

```bash
curl https://your-domain.com/api/shipment-tracking?action=timeline&order_id=your-order-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Test AI Chat

```bash
curl -X POST https://your-domain.com/api/chat-courier \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Where is my order?",
    "order_id": "your-order-uuid"
  }'
```

---

## 🎯 Common Use Cases

### Use Case 1: Monitor Delayed Shipments

1. Create "Delayed Shipment Alert" rule (template available)
2. Set cooldown to 24 hours
3. System automatically emails customers after 3 days without updates

### Use Case 2: Delivery Notifications

1. Create "Out for Delivery" rule (template available)
2. System sends email + SMS when package is out for delivery
3. Customer gets real-time updates

### Use Case 3: Exception Handling

1. Create "Failed Delivery Alert" rule (template available)
2. System notifies both customer and merchant
3. Merchant can take immediate action

---

## 📱 UI Components Usage

### In Your Merchant Dashboard

```tsx
import { CourierIntegrations } from '@/components/courier/CourierIntegrations';
import { NotificationRules } from '@/components/courier/NotificationRules';
import { DelayedOrders } from '@/components/courier/ShipmentTracking';

function MerchantDashboard() {
  return (
    <div>
      <CourierIntegrations />
      <NotificationRules />
      <DelayedOrders />
    </div>
  );
}
```

### In Your Order Details Page

```tsx
import { ShipmentTracking } from '@/components/courier/ShipmentTracking';

function OrderDetailsPage({ orderId }: { orderId: string }) {
  return (
    <div>
      <ShipmentTracking orderId={orderId} />
    </div>
  );
}
```

---

## 🔧 Troubleshooting

### Issue: "No authentication token found"

**Solution:** Make sure you're logged in and the token is stored in authStore.

```typescript
import { authStore } from '@/store/authStore';
const token = authStore.getState().tokens?.access_token;
```

### Issue: "Integration test failed"

**Solution:** 
1. Verify API credentials are correct
2. Check API endpoint URL
3. Ensure courier API is accessible from your server

### Issue: "Notifications not sending"

**Solution:**
1. Check rule is active (green badge)
2. Verify conditions are met
3. Check cooldown period hasn't blocked execution
4. Review `rule_executions` table in database

---

## 📚 Next Steps

1. **Add More Couriers** - Connect PostNord, Bring, etc.
2. **Customize Templates** - Modify notification messages
3. **Set Up Webhooks** - Configure courier webhooks for real-time updates
4. **Monitor Performance** - Check sync logs and execution statistics
5. **Optimize Rules** - Adjust priorities and cooldowns based on usage

---

## 🆘 Need Help?

- **Documentation:** See `docs/2025-10-22/COURIER_INTEGRATION_SYSTEM.md`
- **API Reference:** Check individual API files for detailed docs
- **Database Schema:** Review migration file for table structures
- **Examples:** See implementation summary for code examples

---

## 🎉 You're All Set!

Your courier integration system is now live and ready to:
- ✅ Track shipments in real-time
- ✅ Send automated notifications
- ✅ Monitor delayed orders
- ✅ Provide AI-powered support
- ✅ Handle exceptions proactively

**Happy shipping! 🚚📦**
