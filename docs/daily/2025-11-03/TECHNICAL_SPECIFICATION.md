# TECHNICAL SPECIFICATION - Courier Credentials Management

**Date:** November 3, 2025  
**Feature:** Per-Merchant Courier API Credentials Management  
**Status:** Implementation Complete - Testing Pending  
**Version:** 1.0

---

## 1. OVERVIEW

### 1.1 Purpose
Enable merchants to manage their own courier API credentials within Performile platform, allowing direct integration with courier services without Performile acting as a middleman.

### 1.2 Scope
**Primary Focus:** Merchant courier credentials management

**System Roles Affected:**
- **Merchant:** Manage courier credentials, select couriers, test connections
- **Courier:** View integration status, access booking requests (future)
- **Admin:** Monitor credential usage, view system health, manage platform couriers
- **Consumer:** No direct interaction (benefits from improved delivery options)

**Core Features:**
- Merchant courier selection and management
- API credentials storage and encryption
- Credentials testing and validation
- Per-merchant, per-store credential isolation
- Integration with existing courier selection workflow

### 1.3 Business Model
- **Direct Billing:** Courier bills merchant directly
- **No Middleman:** Performile is integration platform only
- **Merchant Control:** Each merchant manages own credentials
- **Better Rates:** Merchants negotiate directly with couriers

---

## 2. ARCHITECTURE

### 2.1 System Components - All Roles

#### **2.1.1 MERCHANT Component**
```
┌─────────────────────────────────────────────────────────┐
│                    MERCHANT UI                          │
│  Settings → Couriers → Add/Edit Credentials            │
│  - Select couriers for checkout                         │
│  - Add API credentials (customer #, API key)            │
│  - Test connection before save                          │
│  - View credential status (✅ configured / ⚠️ missing)  │
│  - Edit/remove credentials                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 FRONTEND LAYER                          │
│  MerchantCourierSettings.tsx                           │
│  - Courier selection                                    │
│  - Credentials modal                                    │
│  - Test connection                                      │
│  - Status indicators                                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   API LAYER                             │
│  GET  /api/merchant/couriers                           │
│  POST /api/courier-credentials                         │
│  POST /api/courier-credentials/test                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 DATABASE LAYER                          │
│  - courier_api_credentials (storage)                   │
│  - merchant_courier_selections (tracking)              │
│  - vw_merchant_courier_credentials (view)              │
│  - Triggers (auto-update status)                       │
└─────────────────────────────────────────────────────────┘
```

#### **2.1.2 COURIER Component**
```
┌─────────────────────────────────────────────────────────┐
│                    COURIER UI                           │
│  Dashboard → Integration Status                         │
│  - View merchants using their service                   │
│  - See booking request volume                           │
│  - Monitor API usage and errors                         │
│  - View integration health                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 FRONTEND LAYER                          │
│  CourierIntegrationDashboard.tsx (future)              │
│  - Integration statistics                               │
│  - Merchant list                                        │
│  - API health monitoring                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   API LAYER                             │
│  GET  /api/courier/integration-stats                   │
│  GET  /api/courier/merchants                           │
│  GET  /api/courier/api-health                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 DATABASE LAYER                          │
│  - courier_api_credentials (read-only view)            │
│  - booking_requests (volume metrics)                   │
│  - api_logs (health monitoring)                        │
└─────────────────────────────────────────────────────────┘
```

#### **2.1.3 ADMIN Component**
```
┌─────────────────────────────────────────────────────────┐
│                     ADMIN UI                            │
│  Admin Panel → Courier Management                       │
│  - View all platform couriers                           │
│  - Monitor credential usage across merchants            │
│  - View system-wide integration health                  │
│  - Manage platform courier accounts                     │
│  - View credential test success rates                   │
│  - Monitor API errors and failures                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 FRONTEND LAYER                          │
│  AdminCourierManagement.tsx                            │
│  - Platform courier list                                │
│  - Credential usage statistics                          │
│  - Integration health dashboard                         │
│  - Error monitoring                                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   API LAYER                             │
│  GET  /api/admin/couriers                              │
│  GET  /api/admin/credential-stats                      │
│  GET  /api/admin/integration-health                    │
│  POST /api/admin/couriers (add platform courier)       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 DATABASE LAYER                          │
│  - couriers (all platform couriers)                    │
│  - courier_api_credentials (all credentials)           │
│  - merchant_courier_selections (all selections)        │
│  - api_logs (system-wide monitoring)                   │
└─────────────────────────────────────────────────────────┘
```

#### **2.1.4 CONSUMER Component**
```
┌─────────────────────────────────────────────────────────┐
│                    CONSUMER UI                          │
│  Checkout → Delivery Options                            │
│  - View available couriers (merchant-configured)        │
│  - See delivery times and prices                        │
│  - Select preferred courier                             │
│  - Track shipment after order                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 FRONTEND LAYER                          │
│  CheckoutDeliveryOptions.tsx                           │
│  - Courier selection widget                             │
│  - Price comparison                                     │
│  - Delivery time estimates                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   API LAYER                             │
│  GET  /api/checkout/couriers (merchant's configured)   │
│  POST /api/checkout/calculate-shipping                 │
│  POST /api/orders/create (uses merchant credentials)   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 DATABASE LAYER                          │
│  - vw_merchant_courier_credentials (configured only)   │
│  - orders (shipment records)                           │
│  - tracking (shipment tracking)                        │
└─────────────────────────────────────────────────────────┘
```

**Note:** Consumer never sees or interacts with API credentials directly. They only benefit from the couriers that merchants have configured.

### 2.2 Data Flow

```
1. Merchant selects courier
   ↓
2. Clicks "Add Credentials"
   ↓
3. Fills form (customer_number, api_key, base_url)
   ↓
4. Clicks "Test Connection"
   ↓
5. API validates credentials with courier
   ↓
6. Success → Enable "Save" button
   ↓
7. Credentials saved (encrypted)
   ↓
8. Trigger updates credentials_configured = true
   ↓
9. UI shows ✅ Configured status
```

---

## 3. DATABASE SCHEMA

### 3.1 Tables

#### **courier_api_credentials**
```sql
CREATE TABLE courier_api_credentials (
    credential_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id),
    merchant_id UUID NOT NULL REFERENCES users(user_id),
    store_id UUID REFERENCES stores(store_id),
    customer_number VARCHAR(100) NOT NULL,
    api_key TEXT NOT NULL,  -- Encrypted
    account_name VARCHAR(255),
    base_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (courier_id, store_id, merchant_id)
);
```

#### **merchant_courier_selections** (Extended)
```sql
ALTER TABLE merchant_courier_selections
ADD COLUMN credentials_configured BOOLEAN DEFAULT false,
ADD COLUMN added_during VARCHAR(50) DEFAULT 'settings';
```

### 3.2 Views

#### **vw_merchant_courier_credentials**
```sql
CREATE VIEW vw_merchant_courier_credentials AS
SELECT 
    mcs.*,
    cac.credential_id,
    cac.customer_number,
    cac.account_name,
    CASE 
        WHEN cac.credential_id IS NOT NULL THEN true 
        ELSE false 
    END as has_credentials
FROM merchant_courier_selections mcs
LEFT JOIN courier_api_credentials cac 
    ON mcs.courier_id = cac.courier_id 
    AND mcs.merchant_id = cac.merchant_id
    AND (mcs.store_id = cac.store_id OR (mcs.store_id IS NULL AND cac.store_id IS NULL));
```

### 3.3 Triggers

#### **update_credentials_configured_trigger**
```sql
CREATE TRIGGER update_credentials_configured_trigger
AFTER INSERT OR UPDATE OR DELETE ON courier_api_credentials
FOR EACH ROW
EXECUTE FUNCTION update_merchant_courier_credentials_status();
```

**Function:**
- Automatically updates `credentials_configured` in `merchant_courier_selections`
- Fires on INSERT/UPDATE/DELETE of credentials
- Ensures status always reflects actual credential state

### 3.4 Functions

#### **add_merchant_courier_selection()**
```sql
CREATE FUNCTION add_merchant_courier_selection(
    p_merchant_id UUID,
    p_courier_id UUID,
    p_store_id UUID DEFAULT NULL,
    p_added_during VARCHAR(50) DEFAULT 'settings'
) RETURNS UUID
```

#### **remove_merchant_courier_selection()**
```sql
CREATE FUNCTION remove_merchant_courier_selection(
    p_merchant_id UUID,
    p_courier_id UUID,
    p_store_id UUID DEFAULT NULL
) RETURNS BOOLEAN
```

#### **get_merchant_configured_couriers()**
```sql
CREATE FUNCTION get_merchant_configured_couriers(
    p_merchant_id UUID,
    p_store_id UUID DEFAULT NULL
) RETURNS TABLE (...)
```

---

## 4. API SPECIFICATION

### 4.1 Get Merchant Couriers

**Endpoint:** `GET /api/merchant/couriers`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "couriers": [
    {
      "courier_id": "uuid",
      "courier_name": "DHL eCommerce",
      "courier_code": "DHL",
      "logo_url": "/courier-logos/dhl_logo.jpeg",
      "trust_score": 4.5,
      "is_active": true,
      "credentials_configured": false,
      "has_credentials": false,
      "customer_number": null,
      "display_order": 1,
      "total_deliveries": 1234
    }
  ]
}
```

### 4.2 Save Credentials

**Endpoint:** `POST /api/courier-credentials`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "courier_id": "uuid",
  "customer_number": "12345",
  "api_key": "secret_key_here",
  "account_name": "Main Account",
  "base_url": "https://api2.postnord.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credentials saved successfully",
  "credential_id": "uuid"
}
```

### 4.3 Test Connection

**Endpoint:** `POST /api/courier-credentials/test`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "courier_id": "uuid",
  "customer_number": "12345",
  "api_key": "secret_key_here",
  "base_url": "https://api2.postnord.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Connection successful! Credentials are valid."
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Authentication failed. Please check your credentials."
}
```

---

## 5. FRONTEND SPECIFICATION

### 5.1 Component Structure

```
MerchantCourierSettings.tsx
├── Subscription Status Card
├── API Key Section (for e-commerce plugins)
├── Selected Couriers Section
│   └── Courier Card (for each)
│       ├── Logo
│       ├── Name & Stats
│       ├── Credentials Status Chip
│       ├── Add/Edit Credentials Button
│       ├── Enable/Disable Toggle
│       └── Remove Button
├── Add Courier Dialog
└── Credentials Modal
    ├── Customer Number Field
    ├── API Key Field
    ├── Account Name Field
    ├── Base URL Field
    ├── Test Connection Button
    └── Save Button
```

### 5.2 State Management

```typescript
interface Courier {
  courier_id: string;
  courier_name: string;
  courier_code: string;
  logo_url: string | null;
  trust_score: number;
  is_active: boolean;
  credentials_configured: boolean;
  has_credentials: boolean;
  customer_number?: string;
  credential_id?: string;
  display_order: number;
  total_deliveries: number;
}

interface CredentialsForm {
  customer_number: string;
  api_key: string;
  account_name: string;
  base_url: string;
}

interface TestResult {
  success: boolean;
  message: string;
}
```

### 5.3 User Flows

#### **Flow 1: Add Credentials**
1. User navigates to Settings → Couriers
2. Sees list of selected couriers
3. Courier shows "⚠️ No Credentials" status
4. Clicks "Add Credentials" button
5. Modal opens with form
6. Fills in customer number and API key
7. Clicks "Test Connection"
8. Sees loading spinner
9. Sees success message
10. "Save" button becomes enabled
11. Clicks "Save Credentials"
12. Modal closes
13. Status updates to "✅ Credentials: #12345"

#### **Flow 2: Edit Credentials**
1. User sees courier with "✅ Configured" status
2. Clicks 🔑 icon
3. Modal opens with existing data (API key masked)
4. Updates API key
5. Clicks "Test Connection"
6. Sees success
7. Clicks "Save"
8. Credentials updated

#### **Flow 3: Remove Courier**
1. User clicks trash icon
2. Confirmation dialog appears
3. Confirms removal
4. Courier removed from list
5. Credentials also deleted (cascade)

---

## 6. SECURITY

### 6.1 API Key Encryption
- API keys stored encrypted in database
- Encryption at rest using PostgreSQL pgcrypto
- Never returned in plain text via API
- Only decrypted when making courier API calls

### 6.2 Row-Level Security (RLS)
```sql
-- Merchants see only their own credentials
CREATE POLICY courier_api_credentials_merchant_select 
ON courier_api_credentials FOR SELECT
USING (merchant_id = auth.uid());

CREATE POLICY courier_api_credentials_merchant_insert 
ON courier_api_credentials FOR INSERT
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY courier_api_credentials_merchant_update 
ON courier_api_credentials FOR UPDATE
USING (merchant_id = auth.uid());

CREATE POLICY courier_api_credentials_merchant_delete 
ON courier_api_credentials FOR DELETE
USING (merchant_id = auth.uid());
```

### 6.3 Validation
- Customer number: Required, max 100 chars
- API key: Required, stored encrypted
- Base URL: Validated URL format
- Test connection required before save

---

## 7. SUPPORTED COURIERS

| Courier | Code | Base URL |
|---------|------|----------|
| PostNord | POSTNORD | https://api2.postnord.com |
| Bring | BRING | https://api.bring.com |
| DHL | DHL | https://api-eu.dhl.com |
| UPS | UPS | https://onlinetools.ups.com |
| FedEx | FEDEX | https://apis.fedex.com |
| Instabox | INSTABOX | https://api.instabox.io |
| Budbee | BUDBEE | https://api.budbee.com |
| Porterbuddy | PORTERBUDDY | https://api.porterbuddy.com |

---

## 8. ERROR HANDLING

### 8.1 Frontend Errors
- Network errors: Show toast notification
- Validation errors: Show inline field errors
- Test connection failures: Show alert in modal
- Save failures: Show toast with error message

### 8.2 Backend Errors
- 401 Unauthorized: Invalid/expired token
- 403 Forbidden: Insufficient permissions
- 409 Conflict: Credentials already exist
- 422 Validation Error: Invalid input data
- 500 Server Error: Database/system error

### 8.3 Test Connection Errors
- Authentication failed: Invalid credentials
- Network timeout: Courier API unreachable
- Invalid customer number: Not found in courier system
- Rate limit exceeded: Too many test attempts

---

## 9. PERFORMANCE

### 9.1 Database Indexes
```sql
CREATE INDEX idx_courier_credentials_merchant ON courier_api_credentials(merchant_id);
CREATE INDEX idx_courier_credentials_courier ON courier_api_credentials(courier_id);
CREATE INDEX idx_courier_credentials_store ON courier_api_credentials(store_id);
CREATE INDEX idx_merchant_selections_merchant ON merchant_courier_selections(merchant_id);
```

### 9.2 Caching
- Courier list cached for 5 minutes
- Credentials status cached until update
- View materialization for performance

### 9.3 Optimization
- Lazy load credentials modal
- Debounce test connection button (prevent spam)
- Batch credential checks on page load

---

## 10. TESTING

### 10.1 Unit Tests
- [ ] Credential validation
- [ ] Encryption/decryption
- [ ] Trigger functionality
- [ ] Function logic

### 10.2 Integration Tests
- [ ] API endpoint responses
- [ ] Database operations
- [ ] RLS policies
- [ ] View queries

### 10.3 E2E Tests
- [ ] Add credentials flow
- [ ] Edit credentials flow
- [ ] Test connection flow
- [ ] Remove courier flow

### 10.4 Manual Testing
- [ ] UI navigation
- [ ] Form validation
- [ ] Success/error states
- [ ] Multiple couriers

---

## 11. DEPLOYMENT

### 11.1 Database Migration
```bash
# 1. Remove unique constraint
psql -f database/REMOVE_COURIER_USER_UNIQUE_CONSTRAINT.sql

# 2. Extend merchant selections
psql -f database/EXTEND_MERCHANT_COURIER_SELECTIONS.sql

# 3. Migrate credentials structure
psql -f database/MIGRATE_COURIER_CREDENTIALS_PER_MERCHANT.sql
```

### 11.2 Frontend Deployment
- Build: `npm run build`
- Deploy: Vercel auto-deploy on push
- Verify: Check Settings → Couriers tab

### 11.3 Rollback Plan
- Revert database migrations
- Restore previous frontend version
- Clear cached credentials

---

## 12. MONITORING

### 12.1 Metrics
- Credentials added per day
- Test connection success rate
- API call failures
- Average time to configure

### 12.2 Alerts
- High test failure rate (>20%)
- Credential save errors
- Database trigger failures
- RLS policy violations

---

## 13. FUTURE ENHANCEMENTS

### 13.1 Phase 2
- [ ] Bulk credential import
- [ ] Credential expiry notifications
- [ ] Multi-account support per courier
- [ ] Credential sharing between stores

### 13.2 Phase 3
- [ ] OAuth integration for couriers
- [ ] Automated credential rotation
- [ ] Credential health monitoring
- [ ] Usage analytics per credential

---

**Document Version:** 1.0  
**Last Updated:** November 3, 2025, 10:40 PM  
**Status:** Complete - Ready for Implementation Testing
