# POSTNORD SERVICE POINTS API V5

**Date:** November 8, 2025  
**API Version:** 5.0.14  
**Base URL:** https://api2.postnord.com/rest/businesslocation

---

## 🎯 WHAT IT DOES

Find PostNord service points (pickup locations, parcel lockers, drop-off points) for checkout delivery options.

---

## 📍 KEY ENDPOINTS

### **1. Find Nearest by Address** ⭐ **MOST USEFUL**

**Endpoint:**
```
GET /v5/servicepoints/nearest/byaddress
```

**Use Case:** Show customers nearby pickup locations in checkout

**Parameters:**
- `returnType` - json or xml (required)
- `countryCode` - SE, NO, FI, DK (required)
- `postalCode` - Customer's postal code
- `city` - Customer's city
- `streetName` - Customer's street (optional)
- `numberOfServicePoints` - How many to return (default: 5)
- `context` - optionalservicepoint (recommended)
- `typeId` - Filter by type (parcel boxes: 2, service points: 24,25,54)

**Example:**
```bash
curl "https://api2.postnord.com/rest/businesslocation/v5/servicepoints/nearest/byaddress?returnType=json&countryCode=SE&postalCode=11122&numberOfServicePoints=5&context=optionalservicepoint&apikey=YOUR_KEY"
```

---

### **2. Find Nearest by Coordinates**

**Endpoint:**
```
GET /v5/servicepoints/nearest/bycoordinates
```

**Use Case:** Show pickup locations based on GPS location

**Parameters:**
- `countryCode` - SE, NO, FI, DK (required)
- `northing` - Latitude (required)
- `easting` - Longitude (required)
- `numberOfServicePoints` - How many to return (default: 5)

---

### **3. Find by Postal Code**

**Endpoint:**
```
GET /v5/servicepoints/bypostalcode
```

**Use Case:** Get default service point for a postal code

**Parameters:**
- `countryCode` - SE, NO, FI (required)
- `postalCode` - Postal code (required)

---

## 🏪 SERVICE POINT TYPES

### **Recommended for Checkout:**

**Service Points (Pickup Locations):**
- `24` - Business Centre (SE)
- `25` - Servicepoint (SE)
- `37` - Servicepoint (NO)
- `38` - Servicepoint (FI)
- `54` - Delivery Office (SE)
- `61` - Servicepoint (Europe)

**Parcel Lockers:**
- `2` - Parcel Box Location (Nordic, Europe)

**Special (Requires Agreement):**
- `51` - Collect in Store
- `73` - Terminal pickup (Early Collect)

---

## 📦 RESPONSE STRUCTURE

```json
{
  "servicePointInformationResponse": {
    "servicePoints": [
      {
        "servicePointId": "020001",
        "name": "PostNord Service Point",
        "routeDistance": 1017,
        "visitingAddress": {
          "countryCode": "SE",
          "city": "SOLNA",
          "streetName": "Terminalvägen",
          "streetNumber": "24",
          "postalCode": "17173"
        },
        "coordinates": [
          {
            "northing": 59.35014,
            "easting": 18.00989,
            "srId": "EPSG:4326"
          }
        ],
        "openingHours": {
          "postalServices": [
            {
              "openDay": "MONDAY",
              "openTime": "07:00",
              "closeDay": "MONDAY",
              "closeTime": "18:00"
            }
          ]
        },
        "type": {
          "typeId": 25,
          "typeName": "Servicepoint"
        }
      }
    ]
  }
}
```

---

## 💡 USE CASES FOR PERFORMILE

### **Week 3 - Checkout Integration:**

**1. Parcel Locker Delivery Option:**
```javascript
// Show nearby parcel lockers in checkout
const response = await fetch(
  `https://api2.postnord.com/rest/businesslocation/v5/servicepoints/nearest/byaddress?` +
  `returnType=json&` +
  `countryCode=SE&` +
  `postalCode=${customerPostalCode}&` +
  `numberOfServicePoints=5&` +
  `typeId=2&` + // Parcel lockers only
  `context=optionalservicepoint&` +
  `apikey=${POSTNORD_API_KEY}`
);

const servicePoints = await response.json();
// Display in checkout as delivery option
```

**2. Service Point Pickup:**
```javascript
// Show nearby pickup locations
const response = await fetch(
  `https://api2.postnord.com/rest/businesslocation/v5/servicepoints/nearest/byaddress?` +
  `returnType=json&` +
  `countryCode=SE&` +
  `postalCode=${customerPostalCode}&` +
  `numberOfServicePoints=5&` +
  `typeId=24,25,54&` + // Service points
  `context=optionalservicepoint&` +
  `apikey=${POSTNORD_API_KEY}`
);
```

**3. Display in Checkout:**
```jsx
// React component for checkout
<DeliveryOptions>
  <Option type="home">
    Home Delivery - 49 SEK
  </Option>
  <Option type="parcel-locker">
    Parcel Locker - 29 SEK
    <ServicePointSelector 
      servicePoints={nearbyLockers}
      onSelect={handleSelect}
    />
  </Option>
</DeliveryOptions>
```

---

## 🎯 IMPLEMENTATION PRIORITY

### **For Today (Saturday):**
❌ **DON'T implement** - Focus on tracking APIs

### **For Week 3 (Checkout):**
✅ **DO implement** - When adding parcel locker delivery option

---

## 📊 WHEN TO USE THIS API

**Use Service Points API when:**
- ✅ Offering parcel locker delivery
- ✅ Offering service point pickup
- ✅ Customer wants to choose pickup location
- ✅ Building checkout delivery options

**Don't use when:**
- ❌ Only offering home delivery
- ❌ Just tracking packages
- ❌ Not in checkout flow

---

## 🚀 RECOMMENDATION

### **For Today's Courier API Integration:**
**Skip this API** - Not needed for tracking

### **For Week 3 Payment Gateway Integration:**
**Add this API** - If offering parcel locker/pickup delivery

### **Database Schema (Week 3):**
```sql
CREATE TABLE service_points (
  service_point_id VARCHAR(50) PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type_id INTEGER NOT NULL,
  type_name VARCHAR(100) NOT NULL,
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ SUMMARY

**What:** Find PostNord pickup locations (parcel lockers, service points)  
**When:** Week 3 (checkout integration)  
**Priority:** Medium - Only if offering pickup delivery  
**Today:** Skip - Focus on tracking APIs

---

**Status:** 📝 Documented for Week 3  
**Priority:** 🟡 Medium (Week 3 only)  
**Today's Focus:** 🔴 Tracking APIs (already documented)
