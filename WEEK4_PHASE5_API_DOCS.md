# 📍 WEEK 4 PHASE 5: PARCEL POINTS API

**Created:** October 19, 2025, 8:52 PM  
**Status:** Complete  
**Base URL:** `/api/parcel-points`

---

## 🎯 OVERVIEW

RESTful API endpoints for searching parcel points, checking coverage, and getting location information.

---

## 📋 ENDPOINTS

### **1. Search Parcel Points**

**Endpoint:** `GET /api/parcel-points`

**Description:** Search for parcel points by postal code, city, courier, or type

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `postal_code` | string | No | - | Filter by postal code |
| `city` | string | No | - | Filter by city (partial match) |
| `courier_id` | UUID | No | - | Filter by courier |
| `point_type` | string | No | - | Filter by type: `parcel_shop`, `parcel_locker`, `service_point` |
| `limit` | number | No | `20` | Maximum results |

**Example Request:**
```bash
GET /api/parcel-points?city=Stockholm&point_type=parcel_locker&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "parcel_point_id": "uuid",
      "courier_id": "uuid",
      "courier_name": "PostNord",
      "service_type_id": "uuid",
      "service_type_name": "Parcel Locker",
      "point_name": "PostNord Locker - Centralstation",
      "point_type": "parcel_locker",
      "street_address": "Centralplan 15",
      "postal_code": "11120",
      "city": "Stockholm",
      "latitude": 59.3293,
      "longitude": 18.0686,
      "is_active": true,
      "is_temporarily_closed": false,
      "facilities": ["wheelchair_access", "24_hour_access", "climate_controlled"],
      "hours_type": "24/7",
      "total_compartments": 48,
      "available_compartments": 12,
      "updated_at": "2025-10-19T20:45:00Z"
    }
  ],
  "count": 10
}
```

---

### **2. Find Nearby Parcel Points**

**Endpoint:** `GET /api/parcel-points?action=nearby`

**Description:** Find parcel points within a radius of a location

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `latitude` | number | Yes | - | Latitude coordinate |
| `longitude` | number | Yes | - | Longitude coordinate |
| `radius_km` | number | No | `5.0` | Search radius in kilometers |
| `courier_id` | UUID | No | - | Filter by courier |
| `point_type` | string | No | - | Filter by type |

**Example Request:**
```bash
GET /api/parcel-points?action=nearby&latitude=59.3293&longitude=18.0686&radius_km=2.0
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "parcel_point_id": "uuid",
      "courier_name": "PostNord",
      "point_name": "PostNord Locker - Centralstation",
      "point_type": "parcel_locker",
      "street_address": "Centralplan 15",
      "postal_code": "11120",
      "city": "Stockholm",
      "latitude": 59.3293,
      "longitude": 18.0686,
      "distance_km": 0.15,
      "facilities": ["wheelchair_access", "24_hour_access"]
    },
    {
      "parcel_point_id": "uuid",
      "courier_name": "DHL",
      "point_name": "DHL ServicePoint - Pressbyrån",
      "point_type": "parcel_shop",
      "street_address": "Drottninggatan 45",
      "postal_code": "11121",
      "city": "Stockholm",
      "latitude": 59.3325,
      "longitude": 18.0649,
      "distance_km": 0.42,
      "facilities": ["staff_assistance", "parking"]
    }
  ],
  "count": 2,
  "search_params": {
    "latitude": 59.3293,
    "longitude": 18.0686,
    "radius_km": 2.0
  }
}
```

---

### **3. Check Delivery Coverage**

**Endpoint:** `GET /api/parcel-points?action=coverage`

**Description:** Check which couriers deliver to a postal code and what services are available

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `postal_code` | string | Yes | - | Postal code to check |
| `courier_id` | UUID | No | - | Filter by specific courier |
| `service_type_id` | UUID | No | - | Filter by service type |

**Example Request:**
```bash
GET /api/parcel-points?action=coverage&postal_code=11120
```

**Example Response:**
```json
{
  "success": true,
  "coverage": [
    {
      "courier_id": "uuid",
      "courier_name": "PostNord",
      "service_type_id": "uuid",
      "service_name": "Home Delivery",
      "is_covered": true,
      "standard_delivery_days": 2,
      "home_delivery_available": true,
      "parcel_shop_available": true,
      "parcel_locker_available": true
    },
    {
      "courier_id": "uuid",
      "courier_name": "DHL Express",
      "service_type_id": "uuid",
      "service_name": "Home Delivery",
      "is_covered": true,
      "standard_delivery_days": 1,
      "home_delivery_available": true,
      "parcel_shop_available": true,
      "parcel_locker_available": false
    }
  ],
  "parcel_points": [
    {
      "parcel_point_id": "uuid",
      "point_name": "PostNord Locker - Centralstation",
      "point_type": "parcel_locker",
      "street_address": "Centralplan 15",
      "city": "Stockholm",
      "courier_name": "PostNord",
      "latitude": 59.3293,
      "longitude": 18.0686
    }
  ],
  "postal_code": "11120",
  "summary": {
    "total_couriers": 2,
    "home_delivery_available": 2,
    "parcel_shop_available": 2,
    "parcel_locker_available": 1,
    "fastest_delivery": 1
  }
}
```

---

### **4. Get Opening Hours**

**Endpoint:** `GET /api/parcel-points?action=hours`

**Description:** Get detailed information about a parcel point including opening hours and facilities

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `parcel_point_id` | UUID | Yes | - | Parcel point to get info for |

**Example Request:**
```bash
GET /api/parcel-points?action=hours&parcel_point_id=uuid
```

**Example Response:**
```json
{
  "success": true,
  "parcel_point": {
    "parcel_point_id": "uuid",
    "point_name": "DHL ServicePoint - Pressbyrån",
    "point_type": "parcel_shop",
    "street_address": "Drottninggatan 45",
    "postal_code": "11121",
    "city": "Stockholm",
    "phone": "+46 8 123 456",
    "email": "servicepoint@dhl.se",
    "courier_name": "DHL Express",
    "is_active": true,
    "is_temporarily_closed": false,
    "closure_reason": null
  },
  "opening_hours": [
    {
      "day_of_week": 1,
      "day_name": "Monday",
      "opens_at": "07:00",
      "closes_at": "22:00",
      "is_closed": false,
      "is_24_hours": false,
      "notes": null
    },
    {
      "day_of_week": 2,
      "day_name": "Tuesday",
      "opens_at": "07:00",
      "closes_at": "22:00",
      "is_closed": false,
      "is_24_hours": false,
      "notes": null
    },
    {
      "day_of_week": 0,
      "day_name": "Sunday",
      "opens_at": "09:00",
      "closes_at": "18:00",
      "is_closed": false,
      "is_24_hours": false,
      "notes": "Reduced hours"
    }
  ],
  "facilities": [
    {
      "facility_type": "wheelchair_access",
      "is_available": true,
      "description": "Wheelchair accessible entrance"
    },
    {
      "facility_type": "staff_assistance",
      "is_available": true,
      "description": "Staff available to help"
    },
    {
      "facility_type": "parking",
      "is_available": true,
      "description": "Free parking available"
    }
  ],
  "status": {
    "is_open_now": true,
    "is_temporarily_closed": false,
    "closure_reason": null,
    "today_hours": {
      "day_of_week": 1,
      "day_name": "Monday",
      "opens_at": "07:00",
      "closes_at": "22:00",
      "is_closed": false,
      "is_24_hours": false,
      "notes": null
    }
  }
}
```

---

## 🔐 AUTHENTICATION

**Required:** JWT token in Authorization header (for write operations)

```bash
Authorization: Bearer <jwt_token>
```

**Permissions:**
- **Public:** Read access to all parcel point data
- **Courier:** Manage own parcel points
- **Admin:** Full access

---

## ⚠️ ERROR RESPONSES

### **400 Bad Request**
```json
{
  "message": "latitude and longitude parameters are required"
}
```

### **404 Not Found**
```json
{
  "message": "Parcel point not found"
}
```

### **500 Internal Server Error**
```json
{
  "message": "Internal server error",
  "error": "Detailed error message (development only)"
}
```

---

## 🚀 USAGE EXAMPLES

### **JavaScript/TypeScript**

```typescript
// Search parcel points
const points = await fetch('/api/parcel-points?city=Stockholm&point_type=parcel_locker');
const data = await points.json();

// Find nearby locations
const nearby = await fetch('/api/parcel-points?action=nearby&latitude=59.3293&longitude=18.0686&radius_km=2');
const nearbyData = await nearby.json();

// Check coverage
const coverage = await fetch('/api/parcel-points?action=coverage&postal_code=11120');
const coverageData = await coverage.json();

// Get opening hours
const hours = await fetch('/api/parcel-points?action=hours&parcel_point_id=uuid');
const hoursData = await hours.json();
```

### **cURL**

```bash
# Search parcel points
curl -X GET "https://your-domain.com/api/parcel-points?city=Stockholm&point_type=parcel_locker"

# Find nearby
curl -X GET "https://your-domain.com/api/parcel-points?action=nearby&latitude=59.3293&longitude=18.0686&radius_km=2"

# Check coverage
curl -X GET "https://your-domain.com/api/parcel-points?action=coverage&postal_code=11120"

# Get hours
curl -X GET "https://your-domain.com/api/parcel-points?action=hours&parcel_point_id=uuid"
```

---

## 📊 FACILITY TYPES

Available facility types:
- `parking` - Parking available
- `wheelchair_access` - Wheelchair accessible
- `elevator` - Elevator available
- `restroom` - Public restroom
- `wifi` - Free WiFi
- `seating` - Seating area
- `climate_controlled` - Climate controlled
- `security_camera` - Security cameras
- `staff_assistance` - Staff available
- `package_wrapping` - Package wrapping service
- `printing_service` - Printing available
- `payment_terminal` - Payment terminal
- `atm` - ATM nearby
- `bike_parking` - Bike parking
- `ev_charging` - EV charging station

---

## 📝 NOTES

1. **Coordinates:** Latitude/Longitude in decimal degrees (WGS84)
2. **Distance:** Calculated using earth_distance function (accurate)
3. **Hours:** Times in 24-hour format (HH:MM)
4. **Status:** `is_open_now` calculated based on current server time
5. **Facilities:** Only available facilities are returned
6. **Sorting:** Nearby results sorted by distance (closest first)

---

## 🎯 INTEGRATION EXAMPLES

### **React Component - Parcel Point Finder**

```typescript
import { useState, useEffect } from 'react';

function ParcelPointFinder({ latitude, longitude }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNearbyPoints() {
      const response = await fetch(
        `/api/parcel-points?action=nearby&latitude=${latitude}&longitude=${longitude}&radius_km=5`
      );
      const data = await response.json();
      setPoints(data.data);
      setLoading(false);
    }

    fetchNearbyPoints();
  }, [latitude, longitude]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Nearby Parcel Points</h2>
      {points.map(point => (
        <div key={point.parcel_point_id}>
          <h3>{point.point_name}</h3>
          <p>{point.street_address}</p>
          <p>Distance: {point.distance_km} km</p>
          <p>Facilities: {point.facilities.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}
```

### **Coverage Checker**

```typescript
async function checkCoverage(postalCode: string) {
  const response = await fetch(
    `/api/parcel-points?action=coverage&postal_code=${postalCode}`
  );
  const data = await response.json();
  
  return {
    isDeliverable: data.coverage.length > 0,
    fastestDelivery: data.summary.fastest_delivery,
    availableCouriers: data.coverage.map(c => c.courier_name),
    nearbyPoints: data.parcel_points
  };
}
```

---

## 🗺️ MAP INTEGRATION

### **Google Maps Example**

```typescript
// Add parcel points as markers
points.forEach(point => {
  new google.maps.Marker({
    position: { lat: point.latitude, lng: point.longitude },
    map: map,
    title: point.point_name,
    icon: getIconForType(point.point_type)
  });
});
```

### **Mapbox Example**

```typescript
// Add parcel points as GeoJSON
map.addSource('parcel-points', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: points.map(point => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.longitude, point.latitude]
      },
      properties: {
        name: point.point_name,
        type: point.point_type
      }
    }))
  }
});
```

---

**Created By:** Cascade AI  
**Date:** October 19, 2025, 8:52 PM  
**Status:** ✅ Complete  
**File:** `api/parcel-points.ts`

---

*"Location, location, location - now with an API!"*

**Parcel Points API is ready! 📍**
