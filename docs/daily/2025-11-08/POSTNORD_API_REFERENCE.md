# POSTNORD API REFERENCE

**Date:** November 8, 2025  
**API Version:** 2.0.0  
**Base URL:** https://api2.postnord.com/rest/location

---

## 🔑 AUTHENTICATION

**Method:** API Key (query parameter)  
**Parameter:** `apikey`  
**Required:** Yes (32 characters)

---

## 📍 POSTAL CODE & ADDRESS SEARCH API

### **Endpoint:**
```
GET /v2/address/search
```

### **Base URL:**
```
https://api2.postnord.com/rest/location/v2/address/search
```

### **Description:**
Performs parallel searches for:
1. Postal codes (when query is numbers only)
2. Postal cities (when query is non-numbers only)
3. Addresses (street, number, city)

### **Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apikey` | string | ✅ Yes | 32-character API key |
| `channel_id` | string | ✅ Yes | Unique tracking identifier |
| `q` | string | ✅ Yes | Search query (min 2 chars) |
| `country` | string | ❌ No | Comma-separated country codes: SE, NO, FI, DK |
| `lat` | number | ❌ No | Latitude for viewport biasing |
| `lon` | number | ❌ No | Longitude for viewport biasing |
| `format` | string | ❌ No | Response format: "json" or "xml" (default: json) |
| `maxHits` | integer | ❌ No | Max results to return (default: 10) |

### **Example Request:**
```bash
curl -X GET "https://api2.postnord.com/rest/location/v2/address/search?apikey=YOUR_API_KEY&channel_id=performile&q=11122&country=SE&format=json&maxHits=10"
```

### **Response Structure:**

```json
{
  "PostalCodes": [
    {
      "CountryCode": "SE",
      "PostalCode": 11122,
      "PostalCity": "Stockholm",
      "PostalCityAlternative": null,
      "Box": false
    }
  ],
  "Addresses": [
    {
      "Street": "Drottninggatan",
      "StreetAlternative": null,
      "NumberFrom": 1,
      "NumberTo": 99,
      "Postalcode": {
        "CountryCode": "SE",
        "PostalCode": 11122,
        "PostalCity": "Stockholm",
        "PostalCityAlternative": null,
        "Box": false
      }
    }
  ]
}
```

---

## 📦 TRACKING & TRACE API

**Note:** This is a separate API endpoint (not in the provided Swagger)

### **Endpoint:**
```
GET /rest/businesslocation/v5/trackandtrace/findByIdentifier.json
```

### **Base URL:**
```
https://api2.postnord.com/rest/businesslocation/v5
```

### **Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apikey` | string | ✅ Yes | API key |
| `id` | string | ✅ Yes | Tracking number |
| `locale` | string | ❌ No | Language (en, sv, no, fi, da) |

### **Example Request:**
```bash
curl -X GET "https://api2.postnord.com/rest/businesslocation/v5/trackandtrace/findByIdentifier.json?apikey=YOUR_API_KEY&id=TRACKING123&locale=en"
```

---

## 🚚 SHIPPING GUIDE API (RATES)

**Note:** This is a separate API endpoint

### **Endpoint:**
```
POST /rest/businesslocation/v1/shippingguide
```

### **Base URL:**
```
https://api2.postnord.com/rest/businesslocation/v1
```

### **Headers:**
```
Content-Type: application/json
apikey: YOUR_API_KEY
```

### **Request Body:**
```json
{
  "from": {
    "postalCode": "11122"
  },
  "to": {
    "postalCode": "41301"
  },
  "parcels": [
    {
      "weight": 2500,
      "dimensions": {
        "length": 30,
        "width": 20,
        "height": 10
      }
    }
  ]
}
```

---

## 🌍 SUPPORTED COUNTRIES

- **SE** - Sweden
- **NO** - Norway
- **FI** - Finland
- **DK** - Denmark

---

## 🔧 IMPLEMENTATION NOTES

### **For Performile Integration:**

**1. Postal Code Search:**
- Use `/v2/address/search` endpoint
- Query by postal code: `q=11122`
- Filter by country: `country=SE`
- Get postal city name and validate postal codes

**2. Address Validation:**
- Use `/v2/address/search` endpoint
- Query by full address: `q=Drottninggatan 1, Stockholm`
- Validate customer addresses
- Get correct postal code for address

**3. Viewport Biasing:**
- Use `lat` and `lon` parameters
- Sort results by proximity to location
- Useful for courier selection by location

**4. Channel ID:**
- Use `channel_id=performile` for tracking
- Required parameter for all requests

---

## 💡 USE CASES FOR PERFORMILE

### **1. Checkout - Postal Code Validation:**
```javascript
// When customer enters postal code in checkout
const response = await fetch(
  `https://api2.postnord.com/rest/location/v2/address/search?` +
  `apikey=${POSTNORD_API_KEY}&` +
  `channel_id=performile&` +
  `q=${postalCode}&` +
  `country=${country}&` +
  `format=json`
);

const data = await response.json();
const validPostalCode = data.PostalCodes[0];
```

### **2. Merchant Settings - Address Autocomplete:**
```javascript
// When merchant enters their store address
const response = await fetch(
  `https://api2.postnord.com/rest/location/v2/address/search?` +
  `apikey=${POSTNORD_API_KEY}&` +
  `channel_id=performile&` +
  `q=${searchQuery}&` +
  `country=SE&` +
  `maxHits=5&` +
  `format=json`
);

const data = await response.json();
const suggestions = data.Addresses;
```

### **3. Courier Selection - Location-Based:**
```javascript
// Find postal code for customer location
const response = await fetch(
  `https://api2.postnord.com/rest/location/v2/address/search?` +
  `apikey=${POSTNORD_API_KEY}&` +
  `channel_id=performile&` +
  `q=${postalCode}&` +
  `lat=${latitude}&` +
  `lon=${longitude}&` +
  `country=${country}&` +
  `format=json`
);

// Use postal code to find best courier
```

---

## 🚨 ERROR HANDLING

### **Status Codes:**

- **200** - Success
- **400** - Bad Request (missing/invalid parameters)
- **500** - Internal Server Error

### **Common Errors:**

**1. Missing Query Parameter:**
```json
{
  "error": "q parameter is required"
}
```

**2. Invalid Country Code:**
```json
{
  "error": "Invalid country code. Allowed: SE, NO, FI, DK"
}
```

**3. Invalid Coordinates:**
```json
{
  "error": "Coordinates outside allowed geographical area"
}
```

---

## 📝 IMPLEMENTATION CHECKLIST

For today's courier API integration:

- [ ] Get PostNord API key from developer portal
- [ ] Test postal code search endpoint
- [ ] Implement postal code validation function
- [ ] Implement address search function
- [ ] Add error handling for all responses
- [ ] Log all API requests to `courier_api_requests` table
- [ ] Test with Swedish, Norwegian, Finnish, Danish postal codes
- [ ] Document rate limits (if any)

---

## 🔗 OFFICIAL DOCUMENTATION

**Developer Portal:** https://developer.postnord.com/  
**API Reference:** https://developer.postnord.com/docs  
**Support:** Available through developer portal

---

**Status:** ✅ Ready to implement  
**Priority:** 🔴 CRITICAL for postal code validation  
**Use in:** Checkout, merchant settings, courier selection
