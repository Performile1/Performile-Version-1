# POSTAL CODE VALIDATION API - SPECIFICATION

**Date:** November 2, 2025, 1:25 AM  
**Priority:** HIGH  
**Use Cases:** Checkout validation (Shopify + Performile), Address validation  
**Status:** 📋 SPECIFICATION

---

## 🎯 OVERVIEW

### **Problem:**
- Need postal code validation in Shopify checkout
- Need postal code validation in Performile platform
- Need to verify postal codes are valid and get city/coordinates
- Need to ensure couriers can deliver to the postal code

### **Solution:**
Create a comprehensive postal code validation API that:
- Validates postal code format
- Checks if postal code exists in database
- Falls back to OpenDataSoft API if not cached
- Returns city, coordinates, and delivery availability
- Works for Nordic countries (SE, NO, DK, FI)

---

## 📋 API ENDPOINTS

### **1. Validate Postal Code**
**Endpoint:** `POST /api/postal-codes/validate`  
**Auth:** Public (no auth required for Shopify)  
**Purpose:** Validate postal code and return location data

**Request:**
```json
{
  "postalCode": "11122",
  "country": "SE"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "postalCode": "11122",
  "city": "Stockholm",
  "region": "Stockholm",
  "country": "SE",
  "latitude": 59.3293,
  "longitude": 18.0686,
  "deliveryAvailable": true,
  "courierCount": 12,
  "source": "cache" // or "api"
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "postalCode": "99999",
  "country": "SE",
  "error": "Postal code not found",
  "deliveryAvailable": false
}
```

---

### **2. Search Postal Codes**
**Endpoint:** `GET /api/postal-codes/search?q=1112&country=SE`  
**Auth:** Public  
**Purpose:** Autocomplete for postal code input

**Response:**
```json
{
  "results": [
    {
      "postalCode": "11122",
      "city": "Stockholm",
      "region": "Stockholm",
      "country": "SE"
    },
    {
      "postalCode": "11123",
      "city": "Stockholm",
      "region": "Stockholm",
      "country": "SE"
    }
  ],
  "count": 2
}
```

---

### **3. Get Postal Code Details**
**Endpoint:** `GET /api/postal-codes/:postalCode?country=SE`  
**Auth:** Public  
**Purpose:** Get full details for a postal code

**Response:**
```json
{
  "postalCode": "11122",
  "city": "Stockholm",
  "region": "Stockholm",
  "country": "SE",
  "latitude": 59.3293,
  "longitude": 18.0686,
  "deliveryAvailable": true,
  "couriers": [
    {
      "courierId": "uuid",
      "courierName": "PostNord",
      "serviceTypes": ["home_delivery", "parcel_shop"]
    }
  ],
  "nearestParcelShops": [
    {
      "name": "ICA Supermarket",
      "distance": 0.5,
      "address": "Kungsgatan 1"
    }
  ]
}
```

---

### **4. Bulk Validate**
**Endpoint:** `POST /api/postal-codes/bulk-validate`  
**Auth:** Required (JWT)  
**Purpose:** Validate multiple postal codes at once

**Request:**
```json
{
  "postalCodes": [
    { "postalCode": "11122", "country": "SE" },
    { "postalCode": "0010", "country": "NO" },
    { "postalCode": "1000", "country": "DK" }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "postalCode": "11122",
      "country": "SE",
      "valid": true,
      "city": "Stockholm",
      "deliveryAvailable": true
    },
    {
      "postalCode": "0010",
      "country": "NO",
      "valid": true,
      "city": "Oslo",
      "deliveryAvailable": true
    },
    {
      "postalCode": "1000",
      "country": "DK",
      "valid": true,
      "city": "Copenhagen",
      "deliveryAvailable": true
    }
  ],
  "validCount": 3,
  "invalidCount": 0
}
```

---

## 🗄️ DATABASE SCHEMA

### **Existing Table: postal_codes**
```sql
CREATE TABLE postal_codes (
    postal_code_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    country VARCHAR(2) NOT NULL DEFAULT 'SE',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_postal_code_country UNIQUE (postal_code, country)
);

CREATE INDEX idx_postal_codes_search ON postal_codes(postal_code, country);
CREATE INDEX idx_postal_codes_city ON postal_codes(city);
CREATE INDEX idx_postal_codes_coordinates ON postal_codes(latitude, longitude);
```

**Status:** ✅ Already exists in database

---

## 🔄 VALIDATION LOGIC

### **Step 1: Format Validation**
```typescript
function validatePostalCodeFormat(postalCode: string, country: string): boolean {
  const patterns = {
    SE: /^\d{5}$/,           // Sweden: 5 digits
    NO: /^\d{4}$/,           // Norway: 4 digits
    DK: /^\d{4}$/,           // Denmark: 4 digits
    FI: /^\d{5}$/            // Finland: 5 digits
  };
  
  const pattern = patterns[country];
  return pattern ? pattern.test(postalCode) : false;
}
```

### **Step 2: Database Lookup**
```typescript
async function lookupPostalCode(postalCode: string, country: string) {
  const { data, error } = await supabase
    .from('postal_codes')
    .select('*')
    .eq('postal_code', postalCode)
    .eq('country', country)
    .single();
    
  if (data) {
    return { found: true, data, source: 'cache' };
  }
  
  return { found: false };
}
```

### **Step 3: API Fallback**
```typescript
async function fetchFromAPI(postalCode: string, country: string) {
  const response = await fetch(
    `https://public.opendatasoft.com/api/records/1.0/search/?` +
    `dataset=georef-sweden-postalcode&` +
    `q=${postalCode}&` +
    `facet=country_code`
  );
  
  const data = await response.json();
  
  if (data.records && data.records.length > 0) {
    const record = data.records[0].fields;
    
    // Cache in database
    await supabase.from('postal_codes').insert({
      postal_code: postalCode,
      city: record.city_name,
      region: record.region_name,
      country: country,
      latitude: record.geo_point_2d[0],
      longitude: record.geo_point_2d[1]
    });
    
    return { found: true, data: record, source: 'api' };
  }
  
  return { found: false };
}
```

### **Step 4: Delivery Availability Check**
```typescript
async function checkDeliveryAvailability(postalCode: string, country: string) {
  // Check if any couriers cover this postal code
  const { data: couriers } = await supabase
    .from('courier_coverage')
    .select('courier_id, couriers(courier_name, service_types)')
    .eq('postal_code', postalCode)
    .eq('country', country);
    
  return {
    deliveryAvailable: couriers && couriers.length > 0,
    courierCount: couriers?.length || 0,
    couriers: couriers || []
  };
}
```

---

## 🎨 FRONTEND INTEGRATION

### **1. Shopify Checkout Extension**
```jsx
// In checkout extension
import { useEffect, useState } from 'react';

function PostalCodeValidator({ postalCode, country, onValidate }) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  
  useEffect(() => {
    if (postalCode && postalCode.length >= 4) {
      validatePostalCode(postalCode, country);
    }
  }, [postalCode, country]);
  
  async function validatePostalCode(code, countryCode) {
    setIsValidating(true);
    
    try {
      const response = await fetch(
        `${apiBaseUrl}/postal-codes/validate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postalCode: code,
            country: countryCode
          })
        }
      );
      
      const result = await response.json();
      setValidationResult(result);
      onValidate(result);
    } catch (error) {
      console.error('Postal code validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  }
  
  if (isValidating) {
    return <Text>Validating postal code...</Text>;
  }
  
  if (validationResult && !validationResult.valid) {
    return (
      <Banner status="critical">
        Invalid postal code. Please check and try again.
      </Banner>
    );
  }
  
  if (validationResult && !validationResult.deliveryAvailable) {
    return (
      <Banner status="warning">
        No delivery available to this postal code yet.
      </Banner>
    );
  }
  
  if (validationResult && validationResult.valid) {
    return (
      <Banner status="success">
        ✓ Delivery available to {validationResult.city}
      </Banner>
    );
  }
  
  return null;
}
```

---

### **2. Performile Platform**
```tsx
// In Performile order form
import { TextField, CircularProgress, Alert } from '@mui/material';

function PostalCodeInput({ value, onChange, country }) {
  const [validationState, setValidationState] = useState<{
    isValidating: boolean;
    result: any;
  }>({ isValidating: false, result: null });
  
  const debouncedValidate = useCallback(
    debounce(async (postalCode: string) => {
      if (!postalCode || postalCode.length < 4) return;
      
      setValidationState({ isValidating: true, result: null });
      
      try {
        const response = await fetch(
          `/api/postal-codes/validate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postalCode, country })
          }
        );
        
        const result = await response.json();
        setValidationState({ isValidating: false, result });
      } catch (error) {
        setValidationState({ 
          isValidating: false, 
          result: { valid: false, error: 'Validation failed' }
        });
      }
    }, 500),
    [country]
  );
  
  useEffect(() => {
    debouncedValidate(value);
  }, [value, debouncedValidate]);
  
  return (
    <Box>
      <TextField
        label="Postal Code"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={validationState.result && !validationState.result.valid}
        helperText={
          validationState.result?.valid 
            ? `✓ ${validationState.result.city}`
            : validationState.result?.error
        }
        InputProps={{
          endAdornment: validationState.isValidating && (
            <CircularProgress size={20} />
          )
        }}
      />
      
      {validationState.result && !validationState.result.deliveryAvailable && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          No delivery available to this postal code yet. 
          We're working on expanding our coverage!
        </Alert>
      )}
    </Box>
  );
}
```

---

## 🔒 SECURITY

### **Rate Limiting:**
```typescript
// In API endpoint
import { rateLimit } from '@/middleware/rateLimit';

export default async function handler(req, res) {
  // Allow 100 requests per minute per IP
  const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    maxRequests: 100
  });
  
  try {
    await limiter.check(res, 100, req.ip);
  } catch {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  // ... validation logic
}
```

### **Input Sanitization:**
```typescript
function sanitizePostalCode(postalCode: string): string {
  // Remove spaces, dashes, and special characters
  return postalCode.replace(/[^0-9]/g, '');
}

function sanitizeCountry(country: string): string {
  // Only allow valid country codes
  const validCountries = ['SE', 'NO', 'DK', 'FI'];
  const upperCountry = country.toUpperCase();
  return validCountries.includes(upperCountry) ? upperCountry : 'SE';
}
```

---

## 📊 CACHING STRATEGY

### **Database Cache:**
- ✅ All validated postal codes cached in database
- ✅ Instant lookups for cached postal codes (<10ms)
- ✅ Automatic caching on first API lookup

### **Redis Cache (Optional):**
```typescript
// For high-traffic scenarios
import { redis } from '@/lib/redis';

async function getCachedPostalCode(postalCode: string, country: string) {
  const cacheKey = `postal:${country}:${postalCode}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Lookup in database or API
  const result = await lookupPostalCode(postalCode, country);
  
  // Cache for 30 days
  await redis.setex(cacheKey, 30 * 24 * 60 * 60, JSON.stringify(result));
  
  return result;
}
```

---

## 🎯 USE CASES

### **Use Case 1: Shopify Checkout Validation**
**Scenario:** Customer enters postal code in Shopify checkout

**Flow:**
1. Customer types postal code
2. Extension calls `/api/postal-codes/validate`
3. API validates format
4. API checks database cache
5. If not cached, fetches from OpenDataSoft API
6. Returns validation result with city name
7. Extension shows success/error message
8. If valid, shows available couriers

---

### **Use Case 2: Performile Order Creation**
**Scenario:** Merchant creates order in Performile dashboard

**Flow:**
1. Merchant enters customer postal code
2. Frontend calls `/api/postal-codes/validate`
3. API validates and returns city
4. Frontend auto-fills city field
5. Frontend shows available couriers for that postal code
6. Merchant selects courier and completes order

---

### **Use Case 3: Coverage Checker**
**Scenario:** Customer wants to check if delivery is available

**Flow:**
1. Customer enters postal code on landing page
2. Frontend calls `/api/postal-codes/:postalCode`
3. API returns full details including couriers
4. Frontend shows:
   - "✓ Delivery available to [City]"
   - List of available couriers
   - Nearest parcel shops
   - Estimated delivery time

---

## 📈 PERFORMANCE METRICS

### **Target Performance:**
- Database lookup: <10ms
- API fallback: <200ms
- Cache hit rate: >80%
- Validation accuracy: >99%

### **Monitoring:**
```sql
-- Check cache hit rate
SELECT 
  COUNT(*) as total_lookups,
  COUNT(CASE WHEN created_at < NOW() - INTERVAL '1 day' THEN 1 END) as cached,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as new_api_calls,
  ROUND(
    COUNT(CASE WHEN created_at < NOW() - INTERVAL '1 day' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as cache_hit_rate_percent
FROM postal_codes
WHERE created_at >= NOW() - INTERVAL '7 days';
```

---

## 🚀 IMPLEMENTATION PLAN

### **Phase 1: API Endpoint (2 hours)**
- [ ] Create `/api/postal-codes/validate` endpoint
- [ ] Implement format validation
- [ ] Implement database lookup
- [ ] Implement API fallback
- [ ] Add delivery availability check
- [ ] Add rate limiting
- [ ] Test with various postal codes

### **Phase 2: Search & Details (1 hour)**
- [ ] Create `/api/postal-codes/search` endpoint
- [ ] Create `/api/postal-codes/:postalCode` endpoint
- [ ] Add autocomplete functionality
- [ ] Test search functionality

### **Phase 3: Shopify Integration (1 hour)**
- [ ] Add PostalCodeValidator component to checkout extension
- [ ] Test in Shopify dev store
- [ ] Handle validation errors gracefully
- [ ] Add loading states

### **Phase 4: Performile Integration (1 hour)**
- [ ] Add PostalCodeInput component
- [ ] Integrate with order creation form
- [ ] Add to merchant settings
- [ ] Test validation flow

### **Phase 5: Testing & Documentation (1 hour)**
- [ ] Test all endpoints
- [ ] Test error scenarios
- [ ] Update API documentation
- [ ] Create user guide

**Total Time:** 6 hours

---

## ✅ SUCCESS CRITERIA

**API:**
- ✅ Validates postal codes for SE, NO, DK, FI
- ✅ Returns city and coordinates
- ✅ Checks delivery availability
- ✅ Caches results in database
- ✅ Falls back to API when needed
- ✅ Response time <200ms

**Shopify:**
- ✅ Validates postal code in real-time
- ✅ Shows success/error messages
- ✅ Prevents invalid postal codes
- ✅ Shows available couriers

**Performile:**
- ✅ Auto-fills city from postal code
- ✅ Shows delivery availability
- ✅ Validates before order creation
- ✅ Provides good UX with loading states

---

## 📝 TESTING CHECKLIST

**Valid Postal Codes:**
- [ ] SE: 11122 (Stockholm) → Should return valid
- [ ] NO: 0010 (Oslo) → Should return valid
- [ ] DK: 1000 (Copenhagen) → Should return valid
- [ ] FI: 00100 (Helsinki) → Should return valid

**Invalid Postal Codes:**
- [ ] SE: 99999 → Should return invalid
- [ ] SE: ABC12 → Should return format error
- [ ] SE: 123 → Should return format error

**Edge Cases:**
- [ ] Empty postal code → Should return error
- [ ] Postal code with spaces → Should sanitize and validate
- [ ] Unknown country → Should default to SE
- [ ] API timeout → Should return error gracefully

---

## 🎉 BENEFITS

### **For Customers:**
- ✅ Know immediately if delivery is available
- ✅ See accurate city name
- ✅ Avoid ordering to invalid addresses
- ✅ Better checkout experience

### **For Merchants:**
- ✅ Reduce failed deliveries
- ✅ Validate addresses before processing
- ✅ Auto-fill city from postal code
- ✅ Show only available couriers

### **For Platform:**
- ✅ Reduce support tickets
- ✅ Improve data quality
- ✅ Better coverage insights
- ✅ Professional validation system

---

**STATUS:** Ready for implementation  
**PRIORITY:** HIGH  
**ESTIMATED TIME:** 6 hours  
**DEPENDENCIES:** postal_codes table (already exists)

---

*Created: November 2, 2025, 1:25 AM*  
*Status: 📋 SPECIFICATION COMPLETE*  
*Next: Implementation*
