# 📡 WEEK 4 PHASE 4: SERVICE PERFORMANCE API

**Created:** October 19, 2025, 8:45 PM  
**Status:** Complete  
**Base URL:** `/api/service-performance`

---

## 🎯 OVERVIEW

RESTful API endpoints for accessing service-level performance data, comparisons, geographic breakdowns, and reviews.

---

## 📋 ENDPOINTS

### **1. Get Service Performance**

**Endpoint:** `GET /api/service-performance`

**Description:** Get service performance metrics for couriers and service types

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `courier_id` | UUID | No | - | Filter by courier |
| `service_type_id` | UUID | No | - | Filter by service type |
| `period_type` | string | No | `monthly` | Period type: `daily`, `weekly`, `monthly`, `quarterly`, `yearly` |
| `limit` | number | No | `10` | Maximum results to return |

**Example Request:**
```bash
GET /api/service-performance?courier_id=123e4567-e89b-12d3-a456-426614174000&period_type=monthly&limit=5
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "performance_id": "uuid",
      "courier_id": "uuid",
      "courier_name": "DHL Express",
      "service_type_id": "uuid",
      "service_name": "Home Delivery",
      "service_code": "home_delivery",
      "period_start": "2025-10-01",
      "period_end": "2025-10-31",
      "period_type": "monthly",
      "total_orders": 150,
      "completed_orders": 145,
      "cancelled_orders": 5,
      "completion_rate": 96.67,
      "on_time_rate": 92.41,
      "avg_delivery_days": 2.3,
      "total_reviews": 89,
      "avg_rating": 4.5,
      "avg_delivery_speed_rating": 4.6,
      "avg_package_condition_rating": 4.7,
      "avg_communication_rating": 4.3,
      "trust_score": 87.25,
      "trust_score_grade": "A",
      "unique_customers": 120,
      "customer_satisfaction_score": 89.50,
      "coverage_area_count": 45,
      "top_city": "Stockholm",
      "last_calculated": "2025-10-19T20:45:00Z"
    }
  ],
  "count": 1
}
```

---

### **2. Compare Services**

**Endpoint:** `GET /api/service-performance?action=compare`

**Description:** Compare performance metrics across multiple couriers

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `courier_ids` | string | Yes | - | Comma-separated courier UUIDs |
| `service_type_id` | UUID | No | - | Filter by service type |
| `period_type` | string | No | `monthly` | Period type |

**Example Request:**
```bash
GET /api/service-performance?action=compare&courier_ids=uuid1,uuid2,uuid3&service_type_id=uuid
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "courier_id": "uuid",
      "courier_name": "DHL Express",
      "service_type_id": "uuid",
      "service_name": "Home Delivery",
      "service_code": "home_delivery",
      "total_orders": 150,
      "completion_rate": 96.67,
      "on_time_rate": 92.41,
      "avg_delivery_days": 2.3,
      "avg_rating": 4.5,
      "trust_score": 87.25,
      "trust_score_grade": "A",
      "customer_satisfaction_score": 89.50,
      "coverage_area_count": 45,
      "trust_score_rank": 1,
      "completion_rate_rank": 2,
      "on_time_rate_rank": 1,
      "rating_rank": 3,
      "period_start": "2025-10-01",
      "period_end": "2025-10-31"
    }
  ],
  "count": 3,
  "comparison": {
    "best_trust_score": "DHL Express",
    "best_completion_rate": "PostNord",
    "best_on_time_rate": "DHL Express",
    "fastest_delivery": "Bring"
  }
}
```

---

### **3. Geographic Performance**

**Endpoint:** `GET /api/service-performance?action=geographic`

**Description:** Get performance breakdown by geographic area

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `courier_id` | UUID | Yes | - | Courier to analyze |
| `service_type_id` | UUID | No | - | Filter by service type |
| `postal_code` | string | No | - | Filter by postal code |
| `city` | string | No | - | Filter by city (partial match) |
| `limit` | number | No | `20` | Maximum results |

**Example Request:**
```bash
GET /api/service-performance?action=geographic&courier_id=uuid&city=Stockholm&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "geo_performance_id": "uuid",
      "courier_id": "uuid",
      "courier_name": "DHL Express",
      "service_type_id": "uuid",
      "service_name": "Home Delivery",
      "postal_code": "11120",
      "city": "Stockholm",
      "region": "Stockholm County",
      "country": "SE",
      "total_deliveries": 45,
      "successful_deliveries": 43,
      "failed_deliveries": 2,
      "avg_delivery_time_hours": 48.5,
      "on_time_rate": 95.56,
      "avg_rating": 4.6,
      "total_reviews": 28,
      "area_trust_score": 88.75,
      "period_start": "2025-10-01",
      "period_end": "2025-10-31",
      "last_calculated": "2025-10-19T20:45:00Z"
    }
  ],
  "count": 10,
  "summary": {
    "total_areas": 10,
    "avg_trust_score": 85.50,
    "avg_on_time_rate": 92.30,
    "total_deliveries": 450,
    "best_performing_area": "Stockholm"
  }
}
```

---

### **4. Service Reviews**

**Endpoint:** `GET /api/service-performance?action=reviews`

**Description:** Get service-specific customer reviews

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `service_type_id` | UUID | Yes | - | Service type to get reviews for |
| `courier_id` | UUID | No | - | Filter by courier |
| `min_rating` | number | No | - | Minimum rating (1-5) |
| `limit` | number | No | `20` | Maximum results |

**Example Request:**
```bash
GET /api/service-performance?action=reviews&service_type_id=uuid&courier_id=uuid&min_rating=4&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "service_review_id": "uuid",
      "review_id": "uuid",
      "service_type_id": "uuid",
      "service_name": "Parcel Shop",
      "order_id": "uuid",
      "courier_id": "uuid",
      "courier_name": "PostNord",
      "rating": 5,
      "review_text": "Excellent service, convenient location",
      "delivery_speed_rating": 5,
      "package_condition_rating": 5,
      "communication_rating": 4,
      "service_quality_rating": 5,
      "location_convenience_rating": 5,
      "facility_condition_rating": 4,
      "staff_helpfulness_rating": 5,
      "service_comment": "Very helpful staff, clean facility",
      "is_verified": true,
      "is_public": true,
      "created_at": "2025-10-15T14:30:00Z"
    }
  ],
  "count": 10,
  "stats": {
    "total_reviews": 10,
    "avg_rating": 4.7,
    "avg_service_quality": 4.8,
    "verified_count": 8,
    "rating_distribution": {
      "5": 6,
      "4": 3,
      "3": 1,
      "2": 0,
      "1": 0
    }
  }
}
```

---

## 🔐 AUTHENTICATION

**Required:** JWT token in Authorization header

```bash
Authorization: Bearer <jwt_token>
```

**Permissions:**
- **Admin:** Full access to all endpoints
- **Merchant:** Read access to all data
- **Courier:** Read access to own performance data
- **Public:** Read access to aggregated data only

---

## ⚠️ ERROR RESPONSES

### **400 Bad Request**
```json
{
  "message": "courier_id parameter is required"
}
```

### **401 Unauthorized**
```json
{
  "message": "Authentication required"
}
```

### **403 Forbidden**
```json
{
  "message": "Insufficient permissions"
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

## 📊 RESPONSE FORMATS

### **Success Response**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

### **Success with Summary**
```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "summary": {
    "total_areas": 10,
    "avg_trust_score": 85.50
  }
}
```

### **Success with Stats**
```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "stats": {
    "total_reviews": 10,
    "avg_rating": 4.7
  }
}
```

---

## 🚀 USAGE EXAMPLES

### **JavaScript/TypeScript**

```typescript
// Get service performance
const response = await fetch('/api/service-performance?courier_id=uuid&period_type=monthly');
const data = await response.json();

// Compare services
const comparison = await fetch('/api/service-performance?action=compare&courier_ids=uuid1,uuid2,uuid3');
const comparisonData = await comparison.json();

// Geographic breakdown
const geographic = await fetch('/api/service-performance?action=geographic&courier_id=uuid&city=Stockholm');
const geoData = await geographic.json();

// Service reviews
const reviews = await fetch('/api/service-performance?action=reviews&service_type_id=uuid&min_rating=4');
const reviewsData = await reviews.json();
```

### **cURL**

```bash
# Get service performance
curl -X GET "https://your-domain.com/api/service-performance?courier_id=uuid&period_type=monthly" \
  -H "Authorization: Bearer <token>"

# Compare services
curl -X GET "https://your-domain.com/api/service-performance?action=compare&courier_ids=uuid1,uuid2,uuid3" \
  -H "Authorization: Bearer <token>"

# Geographic breakdown
curl -X GET "https://your-domain.com/api/service-performance?action=geographic&courier_id=uuid&city=Stockholm" \
  -H "Authorization: Bearer <token>"

# Service reviews
curl -X GET "https://your-domain.com/api/service-performance?action=reviews&service_type_id=uuid&min_rating=4" \
  -H "Authorization: Bearer <token>"
```

---

## 🔄 RATE LIMITING

- **Rate Limit:** 100 requests per minute per IP
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## 📝 NOTES

1. **Date Ranges:** All dates are in ISO 8601 format (YYYY-MM-DD)
2. **Timestamps:** All timestamps are in ISO 8601 format with timezone (UTC)
3. **UUIDs:** All IDs are UUID v4 format
4. **Decimals:** Rates and scores are returned with 2 decimal places
5. **Null Values:** Missing data returns `null`, not empty strings
6. **Pagination:** Use `limit` parameter for pagination (offset not yet supported)

---

## 🎯 NEXT STEPS

**Phase 5:** Parcel Points API
- Parcel point search
- Coverage checker
- Opening hours API
- Facility information

---

**Created By:** Cascade AI  
**Date:** October 19, 2025, 8:45 PM  
**Status:** ✅ Complete  
**File:** `api/service-performance.ts`

---

*"Good API design is invisible. Great API design is delightful."*

**Service Performance API is ready! 🚀**
