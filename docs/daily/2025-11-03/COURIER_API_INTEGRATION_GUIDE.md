# COURIER API INTEGRATION GUIDE

**Date:** November 3, 2025  
**Status:** 🔧 **NEEDS ACTUAL API CREDENTIALS**  
**Priority:** CRITICAL for shipment booking

---

## 🚨 CURRENT STATUS

### **What We Have:**
- ✅ Generic `CourierApiService` class
- ✅ Booking endpoint structure (`/api/shipments/book`)
- ✅ Database tables for bookings
- ✅ Error handling framework

### **What We Need:**
- ❌ **Real API credentials** for each courier
- ❌ **Actual API endpoints** (production URLs)
- ❌ **Authentication tokens/keys**
- ❌ **Test accounts** for development

---

## 📋 COURIER INTEGRATION REQUIREMENTS

### **1. POSTNORD (Sweden)** 🇸🇪

**API Documentation:**
- https://developer.postnord.com/

**What We Need:**
```
API Key: [NEED TO OBTAIN]
Customer Number: [NEED TO OBTAIN]
Base URL: https://api2.postnord.com
```

**Endpoints Required:**
- `POST /rest/businesslocation/v5/booking` - Book shipment
- `GET /rest/businesslocation/v5/labels/{shipmentId}` - Get label
- `GET /rest/businesslocation/v5/tracking/{trackingNumber}` - Track shipment

**Authentication:**
- API Key in header: `apikey: YOUR_API_KEY`

**Test Environment:**
- Test URL: https://api2-stage.postnord.com
- Need test credentials

---

### **2. BRING (Norway)** 🇳🇴

**API Documentation:**
- https://developer.bring.com/

**What We Need:**
```
API Key: [NEED TO OBTAIN]
Customer Number: [NEED TO OBTAIN]
Base URL: https://api.bring.com
```

**Endpoints Required:**
- `POST /booking/api/booking` - Book shipment
- `GET /tracking/api/tracking` - Track shipment
- `GET /reports/api/reports/{shipmentId}/labels` - Get label

**Authentication:**
- API Key in header: `X-MyBring-API-Uid` and `X-MyBring-API-Key`
- Or OAuth2 with client credentials

**Test Environment:**
- Test URL: https://api-test.bring.com
- Need test credentials

---

### **3. DHL EXPRESS (International)** 🌍

**API Documentation:**
- https://developer.dhl.com/

**What We Need:**
```
API Key: [NEED TO OBTAIN]
API Secret: [NEED TO OBTAIN]
Account Number: [NEED TO OBTAIN]
Base URL: https://express.api.dhl.com
```

**Endpoints Required:**
- `POST /mydhlapi/shipments` - Create shipment
- `GET /mydhlapi/shipments/{shipmentId}/proof-of-delivery` - Get POD
- `GET /mydhlapi/shipments/{shipmentId}/tracking` - Track shipment

**Authentication:**
- Basic Auth with API Key and Secret
- Header: `Authorization: Basic base64(apiKey:apiSecret)`

**Test Environment:**
- Test URL: https://express.api.dhl.com/mydhlapi/test
- Need test credentials

---

### **4. UPS (International)** 🌍

**API Documentation:**
- https://developer.ups.com/

**What We Need:**
```
Client ID: [NEED TO OBTAIN]
Client Secret: [NEED TO OBTAIN]
Account Number: [NEED TO OBTAIN]
Base URL: https://onlinetools.ups.com/api
```

**Endpoints Required:**
- `POST /shipments/v1/ship` - Create shipment
- `GET /track/v1/details/{trackingNumber}` - Track shipment
- `POST /shipments/v1/cancel/{shipmentId}` - Cancel shipment

**Authentication:**
- OAuth2 with client credentials
- Get access token first, then use in requests

**Test Environment:**
- Test URL: https://wwwcie.ups.com/api
- Need test credentials

---

## 🔑 HOW TO GET API CREDENTIALS

### **Step 1: Register as Developer**

**PostNord:**
1. Go to https://developer.postnord.com/
2. Create developer account
3. Register application
4. Get API key

**Bring:**
1. Go to https://www.mybring.com/
2. Create MyBring account
3. Go to Settings → API
4. Generate API credentials

**DHL:**
1. Go to https://developer.dhl.com/
2. Create developer account
3. Register for Express API
4. Get API key and secret

**UPS:**
1. Go to https://developer.ups.com/
2. Create developer account
3. Register application
4. Get OAuth credentials

---

### **Step 2: Store Credentials in Database**

```sql
-- Insert into courier_api_credentials table
INSERT INTO courier_api_credentials (
  credential_id,
  courier_name,
  api_key,
  api_secret,
  client_id,
  client_secret,
  base_url,
  auth_type,
  rate_limit_per_minute,
  is_active
) VALUES (
  gen_random_uuid(),
  'PostNord',
  'ENCRYPTED_API_KEY',  -- Encrypt before storing!
  NULL,
  NULL,
  NULL,
  'https://api2.postnord.com',
  'api_key',
  60,
  true
);
```

**⚠️ IMPORTANT:** Encrypt sensitive data before storing!

---

### **Step 3: Set Environment Variables**

```bash
# .env file
POSTNORD_API_KEY=your_api_key_here
POSTNORD_CUSTOMER_NUMBER=your_customer_number

BRING_API_KEY=your_api_key_here
BRING_CUSTOMER_NUMBER=your_customer_number

DHL_API_KEY=your_api_key_here
DHL_API_SECRET=your_api_secret_here
DHL_ACCOUNT_NUMBER=your_account_number

UPS_CLIENT_ID=your_client_id_here
UPS_CLIENT_SECRET=your_client_secret_here
UPS_ACCOUNT_NUMBER=your_account_number

ENCRYPTION_KEY=your_32_byte_encryption_key_here
```

---

## 🧪 TESTING STRATEGY

### **Phase 1: Test Environment**
1. Get test credentials from each courier
2. Test booking with test data
3. Verify label generation
4. Test tracking updates

### **Phase 2: Sandbox Testing**
1. Use courier sandbox/staging environments
2. Test full booking flow
3. Test error scenarios
4. Test cancellations

### **Phase 3: Production**
1. Get production credentials
2. Start with one courier (PostNord)
3. Test with real orders
4. Monitor for errors
5. Add other couriers gradually

---

## 📝 IMPLEMENTATION CHECKLIST

### **For Each Courier:**

- [ ] **1. Get API Credentials**
  - [ ] Register developer account
  - [ ] Get API key/secret
  - [ ] Get customer/account number
  - [ ] Get test credentials

- [ ] **2. Store Credentials**
  - [ ] Encrypt sensitive data
  - [ ] Insert into database
  - [ ] Set environment variables
  - [ ] Test credential retrieval

- [ ] **3. Implement Booking**
  - [ ] Update booking request format
  - [ ] Test with test data
  - [ ] Handle errors
  - [ ] Parse response

- [ ] **4. Implement Label Generation**
  - [ ] Get label from API
  - [ ] Store label URL
  - [ ] Support PDF/ZPL formats
  - [ ] Test label download

- [ ] **5. Implement Tracking**
  - [ ] Get tracking info from API
  - [ ] Parse tracking events
  - [ ] Update database
  - [ ] Handle webhooks

- [ ] **6. Test & Deploy**
  - [ ] Test in sandbox
  - [ ] Test error scenarios
  - [ ] Deploy to production
  - [ ] Monitor logs

---

## 🚀 RECOMMENDED APPROACH

### **Week 2 (This Week):**

**Day 2 (Tuesday):**
1. Register for PostNord developer account
2. Get test credentials
3. Test PostNord booking API
4. Implement PostNord integration

**Day 3 (Wednesday):**
1. Register for Bring developer account
2. Get test credentials
3. Test Bring booking API
4. Implement Bring integration

**Day 4 (Thursday):**
1. Test both integrations
2. Fix any issues
3. Document API responses

**Day 5 (Friday):**
1. Register for DHL/UPS (optional)
2. Focus on PostNord + Bring for MVP
3. Test end-to-end flow

---

## 💡 MVP STRATEGY

### **For December 9 Launch:**

**Must Have:**
- ✅ PostNord integration (Sweden)
- ✅ Bring integration (Norway)

**Nice to Have:**
- ⏳ DHL integration (defer to post-launch)
- ⏳ UPS integration (defer to post-launch)

**Rationale:**
- PostNord + Bring cover Nordic market (primary target)
- 2 couriers sufficient for MVP validation
- Can add DHL/UPS after launch based on demand

---

## 🔧 CURRENT CODE STATUS

### **What Works:**
- ✅ Generic API service layer
- ✅ Booking endpoint structure
- ✅ Database tables
- ✅ Error handling

### **What Needs Real APIs:**
- ❌ Actual booking requests (currently mock structure)
- ❌ Real authentication (currently generic)
- ❌ Real label URLs (currently placeholder)
- ❌ Real tracking numbers (currently mock)

---

## 📞 NEXT STEPS

### **Immediate (Today):**
1. Decide: Start with PostNord or wait until tomorrow?
2. If starting today: Register PostNord developer account
3. If waiting: Document what we have

### **Tomorrow (Tuesday):**
1. Get PostNord test credentials
2. Implement real PostNord integration
3. Test booking flow
4. Generate real labels

---

## ⚠️ IMPORTANT NOTES

1. **Don't commit API keys to GitHub!**
   - Use environment variables
   - Encrypt in database
   - Use .env.local for local development

2. **Start with test environment**
   - Don't use production APIs until tested
   - Use sandbox/staging first
   - Test with fake data

3. **Handle rate limits**
   - PostNord: 60 requests/minute
   - Bring: 100 requests/minute
   - DHL: 250 requests/minute
   - UPS: 100 requests/minute

4. **Monitor costs**
   - Some APIs charge per request
   - Test environment is usually free
   - Production may have costs

---

## 🎯 SUCCESS CRITERIA

**For MVP Launch:**
- ✅ Can book shipments with PostNord
- ✅ Can generate PostNord labels
- ✅ Can track PostNord shipments
- ✅ Can book shipments with Bring
- ✅ Can generate Bring labels
- ✅ Can track Bring shipments

**Total:** 2 couriers fully integrated

---

*Created: November 3, 2025, 11:25 AM*  
*Status: NEEDS API CREDENTIALS*  
*Priority: CRITICAL*  
*Next: Register for courier developer accounts*
