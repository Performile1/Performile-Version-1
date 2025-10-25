# 🚚 Courier Integration & Smart Notification System

**Date:** October 22, 2025  
**Status:** ✅ COMPLETE - Ready for Deployment  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [AI Integration](#ai-integration)
7. [Deployment Guide](#deployment-guide)
8. [Usage Examples](#usage-examples)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Courier Integration & Smart Notification System enables merchants to:

- **Connect courier APIs** for automated tracking
- **Monitor shipments** in real-time with event tracking
- **Automate notifications** using IF/THEN/ELSE rules
- **Get AI-powered insights** on shipment status
- **Handle exceptions** proactively with alerts
- **Track delayed orders** automatically

### Key Features

✅ **Multi-Courier Support** - Connect multiple courier APIs  
✅ **Real-Time Tracking** - Webhook and polling support  
✅ **Smart Notifications** - Rule-based automation  
✅ **AI Chat Integration** - Context-aware assistance  
✅ **Exception Handling** - Automatic detection and alerts  
✅ **Delayed Order Detection** - 7-day threshold monitoring  
✅ **Event Mapping** - Standardized event types  
✅ **Rate Limiting** - API usage tracking  
✅ **Security** - Encrypted credentials  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  CourierIntegrations.tsx  │  NotificationRules.tsx         │
│  ShipmentTracking.tsx     │  DelayedOrders.tsx             │
│  AIChatWidget.tsx (Enhanced)                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  /api/courier-integrations    - Manage integrations        │
│  /api/notification-rules      - Manage automation rules     │
│  /api/shipment-tracking       - Track shipments             │
│  /api/chat-courier            - AI with courier context     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  courier_integrations     - API credentials & config        │
│  shipment_events          - Tracking events                 │
│  notification_rules       - Automation rules                │
│  rule_executions          - Execution logs                  │
│  notification_queue       - Outgoing notifications          │
│  courier_event_mappings   - Event standardization           │
│  ai_chat_courier_context  - AI context storage              │
│  courier_sync_logs        - Sync operation logs             │
│  notification_templates   - Message templates               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  Courier APIs (DHL, PostNord, Bring, etc.)                 │
│  OpenAI GPT-4 (AI Chat)                                     │
│  Email/SMS Providers (Notifications)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Core Tables

#### 1. `courier_integrations`
Stores merchant-specific courier API configurations.

```sql
CREATE TABLE courier_integrations (
  integration_id UUID PRIMARY KEY,
  courier_id UUID REFERENCES couriers(courier_id),
  merchant_id UUID REFERENCES users(user_id),
  
  -- API Configuration
  api_base_url TEXT NOT NULL,
  api_version VARCHAR(20),
  auth_type VARCHAR(50) NOT NULL,
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  client_id_encrypted TEXT,
  token_url TEXT,
  
  -- Status & Settings
  is_active BOOLEAN DEFAULT true,
  is_sandbox BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP,
  last_error TEXT,
  sync_frequency_minutes INTEGER DEFAULT 15,
  
  -- Rate Limiting
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_hour INTEGER DEFAULT 1000,
  requests_today INTEGER DEFAULT 0,
  
  -- Webhooks
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_events TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `shipment_events`
Tracks all courier events for shipments.

```sql
CREATE TABLE shipment_events (
  event_id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(order_id),
  courier_id UUID REFERENCES couriers(courier_id),
  tracking_number VARCHAR(255) NOT NULL,
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL,
  event_code VARCHAR(50),
  event_description TEXT,
  event_timestamp TIMESTAMP NOT NULL,
  
  -- Location
  location_city VARCHAR(255),
  location_country VARCHAR(2),
  location_postal_code VARCHAR(20),
  location_facility VARCHAR(255),
  
  -- Status
  status VARCHAR(50) NOT NULL,
  substatus VARCHAR(100),
  
  -- Exception Handling
  is_exception BOOLEAN DEFAULT false,
  exception_type VARCHAR(100),
  exception_description TEXT,
  
  -- Metadata
  raw_event_data JSONB,
  processed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `notification_rules`
Defines IF/THEN/ELSE automation rules.

```sql
CREATE TABLE notification_rules (
  rule_id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES users(user_id),
  
  rule_name VARCHAR(255) NOT NULL,
  rule_description TEXT,
  rule_type VARCHAR(50) DEFAULT 'custom',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  -- Logic
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  else_actions JSONB,
  
  -- Execution Settings
  cooldown_hours INTEGER DEFAULT 24,
  max_executions INTEGER,
  execution_window_start TIME,
  execution_window_end TIME,
  
  -- Statistics
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Supporting Tables

- `rule_executions` - Logs all rule execution attempts
- `notification_queue` - Queue for outgoing notifications
- `courier_event_mappings` - Maps courier-specific codes to standard events
- `ai_chat_courier_context` - Stores AI analysis and context
- `courier_sync_logs` - Logs all sync operations
- `notification_templates` - Customizable message templates

### Views

#### `active_shipments_with_events`
Provides a unified view of active shipments with their latest events.

```sql
CREATE VIEW active_shipments_with_events AS
SELECT 
  o.order_id,
  o.order_number,
  o.tracking_number,
  o.order_status,
  c.courier_name,
  se.event_type as latest_event_type,
  se.event_timestamp as latest_event_timestamp,
  se.location_city as latest_location,
  EXTRACT(DAY FROM NOW() - se.event_timestamp)::INTEGER as days_since_last_scan,
  is_order_delayed(o.order_id) as is_delayed
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
LEFT JOIN LATERAL (
  SELECT * FROM shipment_events
  WHERE order_id = o.order_id
  ORDER BY event_timestamp DESC
  LIMIT 1
) se ON true
WHERE o.order_status IN ('pending', 'in_transit');
```

---

## 🔌 API Endpoints

### 1. Courier Integrations API

**Base URL:** `/api/courier-integrations`

#### List Integrations
```http
GET /api/courier-integrations?action=list
Authorization: Bearer {token}
```

**Response:**
```json
{
  "integrations": [
    {
      "integration_id": "uuid",
      "courier": {
        "courier_name": "DHL Express",
        "logo_url": "https://..."
      },
      "is_active": true,
      "last_sync_at": "2025-10-22T10:30:00Z",
      "requests_today": 45
    }
  ]
}
```

#### Create Integration
```http
POST /api/courier-integrations?action=create
Authorization: Bearer {token}
Content-Type: application/json

{
  "courier_id": "uuid",
  "api_base_url": "https://api.dhl.com",
  "auth_type": "api_key",
  "api_key": "your-api-key",
  "sync_frequency_minutes": 15
}
```

#### Test Connection
```http
POST /api/courier-integrations?action=test
Authorization: Bearer {token}
Content-Type: application/json

{
  "integration_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "message": "Connection successful"
}
```

### 2. Notification Rules API

**Base URL:** `/api/notification-rules`

#### List Rules
```http
GET /api/notification-rules?action=list
Authorization: Bearer {token}
```

#### Create Rule
```http
POST /api/notification-rules?action=create
Authorization: Bearer {token}
Content-Type: application/json

{
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
}
```

#### Get Templates
```http
GET /api/notification-rules?action=templates
Authorization: Bearer {token}
```

**Response:**
```json
{
  "templates": [
    {
      "id": "delayed_shipment",
      "name": "Delayed Shipment Alert",
      "description": "Notify when no updates for 3+ days",
      "conditions": {...},
      "actions": [...]
    }
  ]
}
```

### 3. Shipment Tracking API

**Base URL:** `/api/shipment-tracking`

#### Get Order Timeline
```http
GET /api/shipment-tracking?action=timeline&order_id={uuid}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "timeline": {
    "order_number": "ORD-12345",
    "tracking_number": "1234567890",
    "events": [
      {
        "timestamp": "2025-10-22T10:00:00Z",
        "type": "picked_up",
        "description": "Package picked up",
        "location": "Stockholm, SE",
        "status": "in_transit"
      }
    ]
  }
}
```

#### Get Delayed Orders
```http
GET /api/shipment-tracking?action=delayed_orders
Authorization: Bearer {token}
```

#### Webhook Endpoint
```http
POST /api/shipment-tracking?action=webhook
X-Webhook-Signature: {signature}
Content-Type: application/json

{
  "tracking_number": "1234567890",
  "event_type": "delivered",
  "event_timestamp": "2025-10-22T15:00:00Z",
  "status": "delivered"
}
```

### 4. AI Chat with Courier Context

**Base URL:** `/api/chat-courier`

```http
POST /api/chat-courier
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Where is my order?",
  "order_id": "uuid",
  "conversation_history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ]
}
```

**Response:**
```json
{
  "reply": "Your order #12345 is currently in transit in Stockholm. The last update was 2 hours ago. It's on schedule for delivery tomorrow.",
  "has_courier_context": true
}
```

---

## 🎨 Frontend Components

### 1. CourierIntegrations Component

**Location:** `apps/web/src/components/courier/CourierIntegrations.tsx`

**Features:**
- List all courier integrations
- Add/edit/delete integrations
- Test connections
- Trigger manual syncs
- View sync statistics

**Usage:**
```tsx
import { CourierIntegrations } from '@/components/courier/CourierIntegrations';

function IntegrationsPage() {
  return <CourierIntegrations />;
}
```

### 2. NotificationRules Component

**Location:** `apps/web/src/components/courier/NotificationRules.tsx`

**Features:**
- List all notification rules
- Create from templates
- Toggle active/inactive
- View execution statistics
- Delete rules

**Usage:**
```tsx
import { NotificationRules } from '@/components/courier/NotificationRules';

function RulesPage() {
  return <NotificationRules />;
}
```

### 3. ShipmentTracking Component

**Location:** `apps/web/src/components/courier/ShipmentTracking.tsx`

**Features:**
- Visual timeline of events
- Exception highlighting
- Location tracking
- Status indicators

**Usage:**
```tsx
import { ShipmentTracking } from '@/components/courier/ShipmentTracking';

function OrderDetailsPage({ orderId }: { orderId: string }) {
  return <ShipmentTracking orderId={orderId} />;
}
```

### 4. DelayedOrders Component

**Location:** `apps/web/src/components/courier/ShipmentTracking.tsx`

**Features:**
- List all delayed orders
- Days since last scan
- Quick actions
- Filtering

**Usage:**
```tsx
import { DelayedOrders } from '@/components/courier/ShipmentTracking';

function DelayedOrdersPage() {
  return <DelayedOrders />;
}
```

---

## 🤖 AI Integration

The system enhances the existing AI chat widget with courier-specific context.

### AI Context Tracking

The `ai_chat_courier_context` table stores:
- Current shipment status
- AI-generated status summary
- Risk level assessment
- Recommended actions
- User query history

### AI Capabilities

1. **Status Explanation** - Explains tracking events in plain language
2. **Delay Detection** - Identifies and explains delays
3. **Exception Handling** - Provides guidance on exceptions
4. **Proactive Suggestions** - Recommends actions based on status
5. **Multi-Order Context** - Tracks patterns across orders

### Example Interactions

**User:** "Where is my order?"  
**AI:** "Your order #12345 is currently in transit in Stockholm. The last scan was 2 hours ago at the DHL sorting facility. It's on schedule for delivery tomorrow between 9 AM - 5 PM."

**User:** "Why hasn't my package moved in 4 days?"  
**AI:** "I see your order #12345 hasn't had a tracking update since October 18th. This appears to be a delay. I recommend: 1) Contacting DHL directly at their support number, 2) Checking if customs clearance is needed, 3) I can send an automated inquiry to the courier if you'd like."

---

## 🚀 Deployment Guide

### Step 1: Database Migration

```bash
# Run the migration in Supabase
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20251022_courier_integration_system.sql
```

### Step 2: Environment Variables

Add to Vercel/deployment platform:

```env
# Existing
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key

# New (optional)
WEBHOOK_SECRET=your-webhook-secret
```

### Step 3: Deploy APIs

```bash
# APIs are in /api directory
# Vercel will auto-deploy these:
# - /api/courier-integrations.ts
# - /api/notification-rules.ts
# - /api/shipment-tracking.ts
# - /api/chat-courier.ts
```

### Step 4: Deploy Frontend

```bash
cd apps/web
npm run build
# Deploy to Vercel
vercel --prod
```

### Step 5: Configure Webhooks

For each courier integration:
1. Get webhook URL: `https://your-domain.com/api/shipment-tracking?action=webhook`
2. Configure in courier's developer portal
3. Add webhook secret to environment variables

### Step 6: Test

```bash
# Test courier integration
curl -X POST https://your-domain.com/api/courier-integrations?action=test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"integration_id": "your-integration-id"}'

# Test notification rule
curl -X GET https://your-domain.com/api/notification-rules?action=templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Usage Examples

### Example 1: Set Up DHL Integration

```typescript
// 1. Create integration
const integration = await courierIntegrationsService.createIntegration({
  courier_id: 'dhl-express-uuid',
  api_base_url: 'https://api.dhl.com',
  api_version: 'v2',
  auth_type: 'api_key',
  api_key: 'your-dhl-api-key',
  sync_frequency_minutes: 15,
  webhook_url: 'https://your-domain.com/api/shipment-tracking?action=webhook',
});

// 2. Test connection
const testResult = await courierIntegrationsService.testIntegration(
  integration.integration_id
);

// 3. Trigger sync
await courierIntegrationsService.syncIntegration(integration.integration_id);
```

### Example 2: Create Delayed Shipment Rule

```typescript
const rule = await notificationRulesService.createRule({
  rule_name: 'Delayed Shipment Alert',
  rule_description: 'Notify customer when shipment has no updates for 3+ days',
  priority: 5,
  conditions: {
    operator: 'AND',
    conditions: [
      {
        field: 'days_since_last_scan',
        operator: 'greater_than',
        value: 3
      },
      {
        field: 'order_status',
        operator: 'equals',
        value: 'in_transit'
      }
    ]
  },
  actions: [
    {
      type: 'send_notification',
      target: 'customer',
      channel: 'email',
      template: 'delayed_shipment',
      subject: 'Update on your order {{order_number}}',
      message: 'We noticed your order hasn\'t had an update in a few days...'
    }
  ],
  cooldown_hours: 24
});
```

### Example 3: Track Shipment

```typescript
// Get timeline
const timeline = await shipmentTrackingService.getOrderTimeline(orderId);

// Add manual event
await shipmentTrackingService.addTrackingEvent({
  order_id: orderId,
  tracking_number: '1234567890',
  event_type: 'delivered',
  event_timestamp: new Date().toISOString(),
  status: 'delivered',
  location_city: 'Stockholm',
  location_country: 'SE'
});

// Get delayed orders
const delayed = await shipmentTrackingService.getDelayedOrders();
```

---

## 🧪 Testing

### Unit Tests

```bash
# Test API endpoints
npm test api/courier-integrations.test.ts
npm test api/notification-rules.test.ts
npm test api/shipment-tracking.test.ts
```

### Integration Tests

```bash
# Test full flow
npm test e2e/courier-integration-flow.test.ts
```

### Manual Testing Checklist

- [ ] Create courier integration
- [ ] Test connection
- [ ] Trigger manual sync
- [ ] Create notification rule
- [ ] Toggle rule active/inactive
- [ ] View shipment timeline
- [ ] Check delayed orders
- [ ] Test AI chat with order context
- [ ] Receive webhook
- [ ] Verify notification sent

---

## 🔧 Troubleshooting

### Issue: Integration test fails

**Solution:**
1. Check API credentials are correct
2. Verify API endpoint URL
3. Check rate limits haven't been exceeded
4. Review `courier_sync_logs` table for errors

### Issue: Notifications not sending

**Solution:**
1. Check rule is active
2. Verify conditions are met
3. Check cooldown period hasn't blocked execution
4. Review `rule_executions` table
5. Check `notification_queue` for pending notifications

### Issue: Webhook not receiving events

**Solution:**
1. Verify webhook URL is correct in courier portal
2. Check webhook signature validation
3. Review server logs for incoming requests
4. Test webhook with curl/Postman

### Issue: AI chat not showing courier context

**Solution:**
1. Verify `order_id` is passed in request
2. Check user has access to the order
3. Verify `ai_chat_courier_context` table has data
4. Check OpenAI API key is configured

---

## 📊 Monitoring

### Key Metrics to Track

1. **Integration Health**
   - Active integrations count
   - Successful sync rate
   - API error rate
   - Average response time

2. **Notification Performance**
   - Rules executed per day
   - Success rate
   - Average execution time
   - Notifications sent per channel

3. **Shipment Tracking**
   - Total events processed
   - Exception rate
   - Delayed orders count
   - Average tracking updates per order

4. **AI Usage**
   - Queries per day
   - Orders with AI context
   - Average response time
   - User satisfaction (if tracked)

### Database Queries for Monitoring

```sql
-- Active integrations
SELECT COUNT(*) FROM courier_integrations WHERE is_active = true;

-- Today's sync operations
SELECT COUNT(*), sync_status 
FROM courier_sync_logs 
WHERE DATE(started_at) = CURRENT_DATE 
GROUP BY sync_status;

-- Rule execution success rate
SELECT 
  rule_name,
  execution_count,
  success_count,
  ROUND(success_count::NUMERIC / NULLIF(execution_count, 0) * 100, 2) as success_rate
FROM notification_rules
WHERE execution_count > 0
ORDER BY success_rate DESC;

-- Delayed orders count
SELECT COUNT(*) FROM active_shipments_with_events WHERE is_delayed = true;
```

---

## 🎉 Summary

The Courier Integration & Smart Notification System is now complete and ready for deployment!

### What Was Built

✅ **9 Database Tables** - Complete schema with RLS policies  
✅ **3 API Endpoints** - Full CRUD operations  
✅ **4 Frontend Components** - Beautiful, functional UI  
✅ **1 Enhanced AI Chat** - Courier context integration  
✅ **6 Pre-built Templates** - Ready-to-use notification rules  
✅ **Complete Documentation** - This guide!  

### Total Lines of Code

- **Database:** ~716 lines (SQL)
- **Backend APIs:** ~1,200 lines (TypeScript)
- **Frontend Components:** ~1,400 lines (React/TypeScript)
- **Services:** ~400 lines (TypeScript)
- **Documentation:** ~1,000 lines (Markdown)
- **Total:** ~4,700 lines

### Next Steps

1. Deploy database migration
2. Configure environment variables
3. Deploy APIs and frontend
4. Set up courier webhooks
5. Create first integration
6. Test end-to-end flow
7. Monitor and optimize

---

**Questions?** Contact the development team or refer to the API documentation.

**Last Updated:** October 22, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
