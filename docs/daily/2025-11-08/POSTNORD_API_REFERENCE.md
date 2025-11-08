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

## 📦 TRACKING & TRACE API v7

### **Two Tracking Endpoints Available:**

---

### **Option 1: Track by Shipment/Item ID** ⭐ **RECOMMENDED**

**Endpoint:**
```
GET /v7/trackandtrace/id/{id}/public
```

**Base URL:**
```
https://api2.postnord.com/rest/shipment
```

**Full URL:**
```
https://api2.postnord.com/rest/shipment/v7/trackandtrace/id/{id}/public
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ Yes | Shipment or Item identifier (10-35 characters) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apikey` | string | ✅ Yes | 32-character API key |
| `locale` | string | ❌ No | Language: en, sv, no, da, fi (default: en) |
| `callback` | string | ❌ No | Return JSON-P response |

**Example Request:**
```bash
curl -X GET "https://api2.postnord.com/rest/shipment/v7/trackandtrace/id/SHIPMENT123/public?apikey=YOUR_API_KEY&locale=en"
```

**Use Case:** Simple tracking by shipment ID (most common)

---

### **Option 2: Track by Customer Number + Reference**

**Endpoint:**
```
GET /v7/trackandtrace/customernumber/{customerNumber}/reference/{reference}/public
```

**Base URL:**
```
https://api2.postnord.com/rest/shipment
```

**Full URL:**
```
https://api2.postnord.com/rest/shipment/v7/trackandtrace/customernumber/{customerNumber}/reference/{reference}/public
```

**Path Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `customerNumber` | string | ✅ Yes | PostNord customer number | 80068059 |
| `reference` | string | ✅ Yes | Customer reference on shipment | ORDER123 |

### **Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apikey` | string | ✅ Yes | 32-character API key |
| `locale` | string | ❌ No | Language: en, sv, no, da, fi (default: en) |
| `callback` | string | ❌ No | Return JSON-P response |

### **Example Request:**
```bash
curl -X GET "https://api2.postnord.com/rest/shipment/v7/trackandtrace/customernumber/80068059/reference/ORDER123/public?apikey=YOUR_API_KEY&locale=en"
```

**Use Case:** Track by merchant's order reference

---

### **Which Endpoint to Use?**

**Use Option 1 (Track by ID)** when:
- ✅ You have the PostNord tracking number
- ✅ Consumer tracking (simplest)
- ✅ Most common use case

**Use Option 2 (Track by Reference)** when:
- ✅ You only have your internal order reference
- ✅ Merchant lookup by their own order number
- ✅ Need to find PostNord tracking number

---

### **Response Structure:**

```json
{
  "TrackingInformationResponse": {
    "shipments": [
      {
        "shipmentId": "SHIPMENT123",
        "status": "EN_ROUTE",
        "estimatedTimeOfArrival": "2025-11-09T14:00:00Z",
        "publicTimeOfArrival": "2025-11-09T14:00:00Z",
        "deliveryDate": null,
        "consignor": {
          "name": "Store Name",
          "address": {
            "street1": "Street 1",
            "city": "Stockholm",
            "postCode": "11122",
            "countryCode": "SE"
          }
        },
        "consignee": {
          "name": "Customer Name",
          "address": {
            "street1": "Customer Street",
            "city": "Gothenburg",
            "postCode": "41301",
            "countryCode": "SE"
          }
        },
        "items": [
          {
            "itemId": "ITEM123",
            "status": "EN_ROUTE",
            "estimatedTimeOfArrival": "2025-11-09T14:00:00Z",
            "events": [
              {
                "eventTime": "2025-11-08T10:00:00Z",
                "eventCode": "COLLECTED",
                "eventDescription": "Package picked up",
                "location": {
                  "name": "Stockholm Terminal",
                  "city": "Stockholm",
                  "countryCode": "SE"
                }
              },
              {
                "eventTime": "2025-11-08T12:00:00Z",
                "eventCode": "IN_TRANSIT",
                "eventDescription": "Package in transit",
                "location": {
                  "name": "Distribution Center",
                  "city": "Gothenburg",
                  "countryCode": "SE"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### **Item Status Values:**

| Status | Description |
|--------|-------------|
| `CREATED` | Shipment created |
| `INFORMED` | Information received |
| `EN_ROUTE` | Package in transit |
| `AVAILABLE_FOR_DELIVERY` | Ready for delivery |
| `AVAILABLE_FOR_DELIVERY_PAR_LOC` | Available at parcel locker |
| `DELIVERED` | Package delivered |
| `DELAYED` | Delivery delayed |
| `EXPECTED_DELAY` | Expected delay |
| `DELIVERY_IMPOSSIBLE` | Cannot deliver |
| `DELIVERY_REFUSED` | Delivery refused |
| `RETURNED` | Package returned |
| `STOPPED` | Shipment stopped |

### **Event Codes:**

| Code | Description |
|------|-------------|
| `COLLECTED` | Package picked up |
| `IN_TRANSIT` | Package in transit |
| `ARRIVED_AT_DELIVERY_POINT` | Arrived at delivery location |
| `DELIVERED` | Package delivered |
| `RETURNED` | Package returned to sender |

---

## 🔗 TRACKING URL API

**Get a direct link to PostNord's tracking page**

### **Endpoint:**
```
GET /v1/tracking/{country}/{id}
```

### **Base URL:**
```
https://api2.postnord.com/rest/links
```

### **Full URL:**
```
https://api2.postnord.com/rest/links/v1/tracking/{country}/{id}
```

### **Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `country` | string | ✅ Yes | Country code: SE, NO, FI, DK |
| `id` | string | ✅ Yes | Shipment or Item identifier (10-35 characters) |

### **Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apikey` | string | ✅ Yes | 32-character API key |
| `language` | string | ❌ No | Language: en, sv, no, da, fi |

### **Example Request:**
```bash
curl -X GET "https://api2.postnord.com/rest/links/v1/tracking/SE/SHIPMENT123?apikey=YOUR_API_KEY&language=en"
```

### **Response:**
```json
{
  "url": "https://tracking.postnord.com/se/tracking/SHIPMENT123?locale=en"
}
```

### **Use Cases:**

**1. Consumer Tracking Link:**
- Generate tracking URL for email notifications
- Send SMS with tracking link
- Display "Track Package" button in consumer app

**2. Merchant Dashboard:**
- Quick link to PostNord tracking page
- Share tracking link with customers
- Embed tracking iframe

**3. Email Templates:**
```html
<a href="{{tracking_url}}">Track Your Package</a>
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

---

## 📚 ADDITIONAL POSTNORD APIS DOCUMENTED

**For Week 3 (Checkout Integration):**
- **Service Points V5 API** - See `POSTNORD_SERVICE_POINTS_API.md`
- **Delivery Options API** - See `POSTNORD_DELIVERY_OPTIONS_API.md` ⭐ **CRITICAL**

**APIs NOT needed for current integration:**
- Shipment Delivery Modification API (not creating shipments)
- Proof of Delivery API (future feature)
- Booking API (not creating shipments)
- Returns API (future RMA feature)
