# POSTNORD API INTEGRATION PLAN

**Date:** November 3, 2025, 1:08 PM  
**Priority:** HIGH - Core Function  
**Estimated Time:** 2-3 hours  
**Framework:** SPEC_DRIVEN_FRAMEWORK

---

## 🎯 OBJECTIVE

Integrate with PostNord API to enable real shipment booking, label generation, and tracking.

---

## 📋 WHAT WE HAVE (FROM AUDIT)

### **Database:**
- ✅ `shipment_bookings` table (18 columns)
- ✅ `shipment_booking_errors` table (12 columns)
- ✅ `courier_api_credentials` table (20 columns)
- ✅ `couriers` table (12 couriers available)
- ✅ `orders` table (35 orders for testing)

### **Code:**
- ✅ `CourierApiService` class (existing)
- ✅ `api/shipments/book.ts` (structure ready)
- ✅ Authentication middleware
- ✅ Database connection pool

### **What's Missing:**
- ❌ Real PostNord API credentials
- ❌ PostNord-specific request/response handling
- ❌ Real API endpoints
- ❌ Test environment setup

---

## 🔑 POSTNORD API REQUIREMENTS

### **Step 1: Get API Credentials**

**Option A: Developer Account (Recommended)**
1. Go to: https://developer.postnord.com/
2. Create developer account
3. Register application
4. Get test credentials:
   - API Key
   - Customer Number
   - Test Base URL

**Option B: Business Account**
1. Contact PostNord sales
2. Get production credentials
3. Higher cost, production-ready

**For MVP: Use Option A (Developer Account)**

---

### **Step 2: PostNord API Endpoints**

**Base URLs:**
- Test: `https://api2-stage.postnord.com`
- Production: `https://api2.postnord.com`

**Key Endpoints:**
```
POST /rest/businesslocation/v5/booking
  - Book shipment
  - Generate tracking number
  - Get label URL

GET /rest/businesslocation/v5/labels/{shipmentId}
  - Download shipping label
  - Formats: PDF, ZPL

GET /rest/businesslocation/v5/tracking/{trackingNumber}
  - Get tracking information
  - Real-time status updates
```

---

### **Step 3: Authentication**

**Method:** API Key in Header
```
Headers:
  apikey: YOUR_API_KEY
  Content-Type: application/json
```

---

## 📝 IMPLEMENTATION PLAN

### **Phase 1: Setup (30 min)**

**Tasks:**
1. [ ] Register PostNord developer account
2. [ ] Get test API credentials
3. [ ] Store credentials in environment variables
4. [ ] Add credentials to database

**Files to Update:**
- `.env.local` - Add PostNord credentials
- Database: Insert into `courier_api_credentials`

---

### **Phase 2: Update Booking API (1 hour)**

**Tasks:**
1. [ ] Update `buildPostNordBooking()` function
2. [ ] Use real PostNord API format
3. [ ] Handle authentication
4. [ ] Parse response correctly

**File:** `api/shipments/book.ts`

**PostNord Booking Request Format:**
```json
{
  "shipment": {
    "sender": {
      "name": "Sender Name",
      "address": {
        "street": "Street Address",
        "postalCode": "12345",
        "city": "Stockholm",
        "country": "SE"
      },
      "phone": "+46701234567",
      "email": "sender@example.com"
    },
    "recipient": {
      "name": "Recipient Name",
      "address": {
        "street": "Street Address",
        "postalCode": "54321",
        "city": "Gothenburg",
        "country": "SE"
      },
      "phone": "+46709876543",
      "email": "recipient@example.com"
    },
    "parcel": {
      "weight": 2.5,
      "length": 30,
      "width": 20,
      "height": 10,
      "value": 500
    },
    "service": {
      "id": "17",
      "addons": []
    }
  },
  "orderNumber": "ORDER-123"
}
```

**PostNord Response Format:**
```json
{
  "shipmentId": "12345678901234567890",
  "trackingNumber": "JJSE00012345678901234",
  "labelUrl": "https://api.postnord.com/labels/...",
  "estimatedDelivery": "2025-11-05T12:00:00Z"
}
```

---

### **Phase 3: Test Integration (30 min)**

**Tasks:**
1. [ ] Create test order
2. [ ] Call booking API
3. [ ] Verify tracking number generated
4. [ ] Verify label URL returned
5. [ ] Check database records

**Test Endpoint:**
```bash
POST http://localhost:3000/api/shipments/book
{
  "order_id": "existing-order-id",
  "courier_id": "postnord-courier-id",
  "service_type": "home_delivery",
  "pickup_address": { ... },
  "delivery_address": { ... },
  "package_details": {
    "weight": 2.5,
    "length": 30,
    "width": 20,
    "height": 10,
    "value": 500
  }
}
```

---

### **Phase 4: Error Handling (30 min)**

**Tasks:**
1. [ ] Handle API errors
2. [ ] Log failed requests
3. [ ] Retry logic
4. [ ] User-friendly error messages

**Common Errors:**
- Invalid API key
- Invalid address
- Weight/dimension limits exceeded
- Rate limit exceeded
- Service not available in area

---

## 🚀 IMPLEMENTATION STEPS

### **STEP 1: Register for PostNord Developer Account**

**Action Required:**
1. Go to https://developer.postnord.com/
2. Click "Sign Up" or "Register"
3. Fill in:
   - Company name: Performile
   - Email: your-email@performile.com
   - Purpose: E-commerce shipping integration
4. Verify email
5. Create application
6. Get credentials:
   - API Key
   - Customer Number

**Expected Time:** 15-30 minutes (including email verification)

---

### **STEP 2: Store Credentials**

**A. Environment Variables:**
```bash
# .env.local
POSTNORD_API_KEY=your_api_key_here
POSTNORD_CUSTOMER_NUMBER=your_customer_number
POSTNORD_BASE_URL=https://api2-stage.postnord.com
POSTNORD_ENVIRONMENT=test
```

**B. Database:**
```sql
INSERT INTO courier_api_credentials (
  credential_id,
  courier_name,
  api_key,
  base_url,
  environment,
  rate_limit_per_minute,
  is_active
) VALUES (
  gen_random_uuid(),
  'PostNord',
  'ENCRYPTED_API_KEY',  -- Encrypt before storing!
  'https://api2-stage.postnord.com',
  'test',
  60,
  true
);
```

---

### **STEP 3: Update Booking Function**

**File:** `api/shipments/book.ts`

**Changes Needed:**
1. Update `buildPostNordBooking()` to match real API format
2. Update `extractBookingDetails()` to parse real response
3. Add proper error handling
4. Add logging

---

### **STEP 4: Test**

**Test Cases:**
1. ✅ Valid booking request
2. ✅ Invalid address
3. ✅ Invalid API key
4. ✅ Rate limit exceeded
5. ✅ Service not available

---

## ⚠️ IMPORTANT NOTES

### **Security:**
- ❌ Never commit API keys to GitHub
- ✅ Use environment variables
- ✅ Encrypt in database
- ✅ Use .env.local for local dev

### **Testing:**
- ✅ Start with test environment
- ✅ Use fake addresses for testing
- ✅ Don't create real shipments until ready
- ✅ Monitor API usage (rate limits)

### **Costs:**
- Test environment: Usually free
- Production: Pay per shipment
- Check PostNord pricing

---

## 📊 SUCCESS CRITERIA

### **Phase 1 Complete:**
- [ ] PostNord developer account created
- [ ] Test credentials obtained
- [ ] Credentials stored securely

### **Phase 2 Complete:**
- [ ] Booking function updated
- [ ] Real API format implemented
- [ ] Response parsing working

### **Phase 3 Complete:**
- [ ] Test booking successful
- [ ] Tracking number generated
- [ ] Label URL returned
- [ ] Database updated

### **Phase 4 Complete:**
- [ ] Error handling working
- [ ] Failed requests logged
- [ ] User-friendly errors

---

## 🎯 NEXT ACTIONS

**Immediate:**
1. Register PostNord developer account
2. Get test credentials
3. Store in environment variables

**Then:**
1. Update booking function
2. Test integration
3. Handle errors

---

**Status:** ⏳ **READY TO START**  
**First Task:** Register PostNord developer account  
**Estimated Total Time:** 2-3 hours

---

*Created: November 3, 2025, 1:08 PM*  
*Priority: HIGH*  
*Framework: SPEC_DRIVEN_FRAMEWORK*
