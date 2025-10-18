# 🚚 Courier Integration Strategy - Spec-Driven Framework

## Executive Summary

**Decision:** Use existing `couriers` table as the master source, enhance with Week 3 integration tables.

**Rationale:** No data migration needed, maintains existing functionality, clean separation of concerns.

---

## 📊 Current State Analysis

### Existing Tables:

#### 1. **`couriers` Table** (Master Data)
- **Status:** 11 couriers exist
- **Purpose:** Core courier information, performance metrics
- **Columns:** courier_id, courier_name, courier_code, contact info, service_types, coverage_countries
- **Used By:** All existing features (orders, reviews, analytics, dashboard)

#### 2. **`courier_api_credentials` Table**
- **Status:** 0 integrations
- **Purpose:** API authentication details
- **Columns:** api_key, api_secret, tokens, base_url, rate limits

#### 3. **Week 3 Tables** (New)
- `week3_webhooks` - Incoming webhook management
- `week3_api_keys` - Performile API keys for merchants
- `week3_integration_events` - Event tracking

---

## ✅ Recommended Strategy

### **Option: Enhance Existing Structure**

**Keep `couriers` table as master, add integration capabilities**

#### Benefits:
✅ No data migration required
✅ Existing features continue working
✅ Clean separation: core data vs integration data
✅ Backward compatible
✅ Fast implementation

#### Implementation:

```sql
-- Add integration status to existing couriers table
ALTER TABLE couriers 
ADD COLUMN IF NOT EXISTS has_api_integration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS integration_status VARCHAR(50) DEFAULT 'not_configured',
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP;

-- Link courier_api_credentials to couriers table
ALTER TABLE courier_api_credentials
ADD COLUMN IF NOT EXISTS courier_id UUID REFERENCES couriers(courier_id);
```

---

## 🏗️ Architecture

### Data Flow:

```
couriers (Master)
    ↓
    ├─→ courier_api_credentials (API Auth)
    ├─→ week3_webhooks (Incoming events)
    ├─→ week3_integration_events (Event log)
    └─→ tracking_api_logs (API calls)
```

### Relationships:

1. **One courier** → **One API credential** (1:1)
2. **One courier** → **Many webhooks** (1:N)
3. **One courier** → **Many integration events** (1:N)
4. **One courier** → **Many API logs** (1:N)

---

## 📋 Implementation Plan

### Phase 1: Database Enhancement (30 min)

**File:** `COURIER_INTEGRATION_SCHEMA_UPDATE.sql`

```sql
-- 1. Add integration fields to couriers table
ALTER TABLE couriers 
ADD COLUMN IF NOT EXISTS has_api_integration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS integration_status VARCHAR(50) DEFAULT 'not_configured',
ADD COLUMN IF NOT EXISTS integration_type VARCHAR(50), -- 'rest_api', 'webhook', 'ftp', 'email'
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS sync_frequency_minutes INTEGER DEFAULT 60;

-- 2. Link courier_api_credentials to couriers
ALTER TABLE courier_api_credentials
ADD COLUMN IF NOT EXISTS courier_id UUID REFERENCES couriers(courier_id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'production'; -- 'sandbox' or 'production'

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_couriers_integration_status 
ON couriers(integration_status) WHERE has_api_integration = TRUE;

CREATE INDEX IF NOT EXISTS idx_courier_credentials_courier_id 
ON courier_api_credentials(courier_id) WHERE is_active = TRUE;

-- 4. Update existing couriers with logo paths
UPDATE couriers SET logo_url = '/courier-logos/' || LOWER(courier_code) || '_logo.jpeg'
WHERE logo_url IS NULL;
```

### Phase 2: API Endpoints (2 hours)

**Following Spec-Driven Framework:**

#### Endpoint 1: Get Courier with Integration Status
```typescript
// api/couriers/[id].ts
GET /api/couriers/:id?include=integration

Response:
{
  courier: {
    courier_id: "uuid",
    courier_name: "DHL",
    courier_code: "dhl",
    logo_url: "/courier-logos/dhl_logo.jpeg",
    has_api_integration: true,
    integration_status: "active",
    integration_type: "rest_api",
    last_sync_at: "2025-10-18T10:00:00Z",
    // ... other courier fields
  },
  api_credentials: {
    has_credentials: true,
    environment: "production",
    last_used: "2025-10-18T09:30:00Z"
  }
}
```

#### Endpoint 2: Configure Courier Integration
```typescript
// api/admin/couriers/[id]/integration.ts
POST /api/admin/couriers/:id/integration

Request:
{
  integration_type: "rest_api",
  api_key: "encrypted_key",
  api_secret: "encrypted_secret",
  base_url: "https://api.dhl.com/v1",
  environment: "sandbox" | "production"
}

Response:
{
  success: true,
  courier_id: "uuid",
  integration_status: "configured",
  test_connection: "success"
}
```

### Phase 3: Frontend Components (2 hours)

#### Component 1: Courier Logo Display

**File:** `apps/web/src/components/courier/CourierLogo.tsx`

```typescript
interface CourierLogoProps {
  courierCode: string;
  courierName: string;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

export const CourierLogo: React.FC<CourierLogoProps> = ({
  courierCode,
  courierName,
  size = 'medium',
  showName = false
}) => {
  const logoPath = `/courier-logos/${courierCode.toLowerCase()}_logo.jpeg`;
  const sizes = {
    small: 32,
    medium: 48,
    large: 64
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Avatar
        src={logoPath}
        alt={`${courierName} logo`}
        sx={{ width: sizes[size], height: sizes[size] }}
      >
        {courierName.charAt(0)}
      </Avatar>
      {showName && <Typography>{courierName}</Typography>}
    </Box>
  );
};
```

#### Component 2: Integration Status Badge

**File:** `apps/web/src/components/courier/IntegrationStatusBadge.tsx`

```typescript
interface IntegrationStatusBadgeProps {
  status: 'not_configured' | 'configured' | 'active' | 'error' | 'paused';
  hasApiIntegration: boolean;
}

export const IntegrationStatusBadge: React.FC<IntegrationStatusBadgeProps> = ({
  status,
  hasApiIntegration
}) => {
  if (!hasApiIntegration) {
    return <Chip label="Manual" size="small" />;
  }

  const statusConfig = {
    not_configured: { label: 'Not Configured', color: 'default' },
    configured: { label: 'Configured', color: 'info' },
    active: { label: 'Active', color: 'success' },
    error: { label: 'Error', color: 'error' },
    paused: { label: 'Paused', color: 'warning' }
  };

  const config = statusConfig[status];

  return (
    <Chip 
      label={config.label} 
      color={config.color as any} 
      size="small"
      icon={hasApiIntegration ? <CloudDone /> : undefined}
    />
  );
};
```

---

## 🎨 UI Integration Points

### 1. **Dashboard - Courier Display**
- Show courier logo instead of text
- Add integration status badge
- Click to view courier details

### 2. **Orders List**
- Display courier logo in table
- Show tracking status with integration indicator
- Auto-update for integrated couriers

### 3. **Admin - Manage Couriers**
- Logo preview in list
- Integration configuration button
- Test connection feature
- Sync status indicator

### 4. **Analytics**
- Courier logos in charts
- Filter by integration status
- Performance comparison (integrated vs manual)

---

## 📦 Courier Logo Implementation

### Current State:
✅ Logos exist in `/public/courier-logos/`
✅ 34+ courier logos available
✅ Format: `{courier_code}_logo.jpeg`

### Implementation:

#### 1. Update Couriers Table
```sql
UPDATE couriers 
SET logo_url = '/courier-logos/' || LOWER(courier_code) || '_logo.jpeg'
WHERE courier_code IN (
  'dhl', 'fedex', 'ups', 'postnord', 'bring', 'budbee', 
  'instabox', 'dpd', 'gls', 'dao', 'posti'
);
```

#### 2. Create Logo Helper
```typescript
// apps/web/src/utils/courierLogo.ts
export const getCourierLogoUrl = (courierCode: string): string => {
  return `/courier-logos/${courierCode.toLowerCase()}_logo.jpeg`;
};

export const getCourierLogoOrFallback = (
  courierCode: string, 
  courierName: string
): string => {
  const logoUrl = getCourierLogoUrl(courierCode);
  // Fallback to first letter if logo doesn't exist
  return logoUrl;
};
```

#### 3. Use in Components
```typescript
import { CourierLogo } from '@/components/courier/CourierLogo';

// In any component
<CourierLogo 
  courierCode="dhl" 
  courierName="DHL Express"
  size="medium"
  showName
/>
```

---

## 🧪 Shopify Plugin Testing Setup

### Test Environment Structure:

```
/shopify-plugin-test/
├── test-store-config.json
├── sample-orders.json
├── webhook-simulator.ts
└── integration-tests/
    ├── order-sync.test.ts
    ├── tracking-update.test.ts
    └── webhook-handling.test.ts
```

### Test Store Configuration:

**File:** `shopify-plugin-test/test-store-config.json`
```json
{
  "store_name": "performile-test-store",
  "shop_url": "performile-test.myshopify.com",
  "api_key": "test_api_key",
  "api_secret": "test_api_secret",
  "access_token": "test_access_token",
  "webhook_secret": "test_webhook_secret",
  "test_orders": [
    {
      "order_id": "1001",
      "customer_email": "test@example.com",
      "shipping_address": {...},
      "line_items": [...]
    }
  ]
}
```

### Integration Test Example:

**File:** `shopify-plugin-test/integration-tests/order-sync.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { syncShopifyOrder } from '@/api/week3-integrations/shopify-sync';

describe('Shopify Order Sync', () => {
  it('should sync order from Shopify to Performile', async () => {
    const shopifyOrder = {
      id: 1001,
      email: 'test@example.com',
      // ... order data
    };

    const result = await syncShopifyOrder(shopifyOrder);

    expect(result.success).toBe(true);
    expect(result.order_id).toBeDefined();
    expect(result.tracking_number).toBeDefined();
  });

  it('should handle duplicate orders gracefully', async () => {
    // Test idempotency
  });

  it('should update existing order if already synced', async () => {
    // Test update logic
  });
});
```

---

## 🔄 Migration Impact Analysis

### Will NOT Break:
✅ Existing orders (courier_id foreign key remains)
✅ Reviews (courier references unchanged)
✅ Analytics (courier_analytics table unaffected)
✅ Dashboard (queries still work)
✅ Trust scores (calculation logic unchanged)

### Will Enhance:
🚀 Courier display (logos instead of text)
🚀 Integration status visibility
🚀 Auto-sync capabilities
🚀 Real-time tracking updates
🚀 Webhook handling

### New Capabilities:
✨ API-based courier integrations
✨ Automated tracking updates
✨ Webhook event processing
✨ Integration health monitoring
✨ Sync status tracking

---

## 📝 Implementation Checklist

### Database (30 min):
- [ ] Run schema update SQL
- [ ] Update courier logo URLs
- [ ] Create indexes
- [ ] Test foreign key constraints

### Backend (2 hours):
- [ ] Create courier integration endpoints
- [ ] Add logo URL to API responses
- [ ] Implement integration status checks
- [ ] Add webhook handlers

### Frontend (2 hours):
- [ ] Create CourierLogo component
- [ ] Create IntegrationStatusBadge component
- [ ] Update Dashboard to show logos
- [ ] Update Orders list with logos
- [ ] Update Admin courier management

### Testing (1 hour):
- [ ] Set up Shopify test environment
- [ ] Create integration tests
- [ ] Test courier logo display
- [ ] Test integration status updates
- [ ] Test webhook handling

### Documentation (30 min):
- [ ] API documentation
- [ ] Component usage guide
- [ ] Integration setup guide
- [ ] Troubleshooting guide

---

## 🎯 Success Criteria

1. ✅ All existing features work without changes
2. ✅ Courier logos display in all relevant places
3. ✅ Integration status visible to admins
4. ✅ API endpoints follow Spec-Driven Framework
5. ✅ Shopify plugin test environment ready
6. ✅ No data loss or corruption
7. ✅ Performance not degraded

---

## 📞 Next Steps

1. **Review and approve this strategy**
2. **Run database schema update**
3. **Implement CourierLogo component**
4. **Create integration API endpoints**
5. **Set up Shopify test environment**
6. **Begin Week 3 courier integration development**

---

**Status:** Ready for Implementation
**Estimated Time:** 6 hours total
**Risk Level:** Low (no breaking changes)
**Priority:** High (Week 3 dependency)
