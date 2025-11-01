# Performile API Documentation

**Version:** 1.0.0  
**Base URL:** `https://api.performile.com` (Production) | `http://localhost:3001` (Development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Admin Endpoints](#admin-endpoints)
3. [Orders](#orders)
4. [Subscriptions](#subscriptions)
5. [Upload/Documents](#uploaddocuments)
6. [Reviews](#reviews)
7. [Analytics](#analytics)
8. [Market Insights](#market-insights)
9. [Dashboard](#dashboard)
10. [Team Management](#team-management)
11. [Webhooks](#webhooks)
12. [Error Handling](#error-handling)

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "user_role": "merchant|courier|consumer",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "user_id": "uuid", "email": "user@example.com" },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### POST /api/auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

### POST /api/auth/logout
Logout and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

---

## Admin Endpoints

**Role Required:** `admin`

### GET /api/admin/users
Get users filtered by role and status.

**Query Parameters:**
- `role` (optional): `merchant|courier|consumer|admin`
- `status` (optional): `active|inactive`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "user_role": "merchant",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/admin/carriers
Get all carriers.

### POST /api/admin/carriers
Create a new carrier.

**Request Body:**
```json
{
  "carrier_name": "FastShip Logistics",
  "contact_email": "contact@fastship.com",
  "contact_phone": "+1234567890",
  "service_areas": ["US", "CA", "MX"],
  "is_active": true
}
```

### PUT /api/admin/carriers/:id
Update carrier information.

### DELETE /api/admin/carriers/:id
Delete a carrier.

### GET /api/admin/stores
Get all merchant stores.

---

## Orders

### GET /api/orders
Get orders with filtering and pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` (optional): Search by tracking number, order number, etc.
- `sort_by` (default: created_at): `created_at|order_date|order_status|tracking_number`
- `sort_order` (default: desc): `asc|desc`
- `status[]` (optional): Filter by status
- `courier_id[]` (optional): Filter by courier
- `store_id[]` (optional): Filter by store
- `country[]` (optional): Filter by country
- `date_from` (optional): Start date (YYYY-MM-DD)
- `date_to` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "order_id": "uuid",
      "tracking_number": "TRK123456",
      "order_number": "ORD-001",
      "order_status": "in_transit",
      "store_name": "My Store",
      "courier_name": "John Courier",
      "consumer_email": "customer@example.com",
      "order_date": "2024-01-01",
      "city": "New York",
      "country": "US"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### GET /api/orders/:orderId
Get single order details.

**Role-based Access:**
- Admin: All orders
- Merchant: Their orders
- Courier: Their deliveries
- Consumer: Their purchases

---

## Subscriptions

### GET /api/subscriptions/current
Get current active subscription.

**Response:**
```json
{
  "success": true,
  "subscription": {
    "subscription_id": "uuid",
    "tier": 2,
    "status": "active",
    "billing_cycle": "monthly",
    "amount": 99,
    "currency": "USD",
    "start_date": "2024-01-01",
    "end_date": "2024-02-01",
    "auto_renew": true,
    "features": {
      "name": "Professional",
      "maxOrders": 1000,
      "analytics": "advanced",
      "marketInsights": true,
      "features": [...]
    }
  }
}
```

### GET /api/subscriptions/invoices
Get invoice history (last 50).

**Response:**
```json
{
  "success": true,
  "invoices": [
    {
      "invoice_id": "uuid",
      "amount": 99,
      "currency": "USD",
      "status": "paid",
      "invoice_date": "2024-01-01",
      "paid_date": "2024-01-01",
      "invoice_url": "https://..."
    }
  ]
}
```

### POST /api/subscriptions/update-payment-method
Update payment method (redirects to Stripe).

**Response:**
```json
{
  "success": true,
  "url": "https://billing.stripe.com/...",
  "message": "Redirect to billing portal"
}
```

### POST /api/subscriptions/cancel
Cancel subscription.

**Request Body:**
```json
{
  "reason": "Too expensive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled. Access continues until end of billing period.",
  "end_date": "2024-02-01"
}
```

### POST /api/subscriptions/create
Create new subscription.

**Request Body:**
```json
{
  "tier": 2,
  "billing_cycle": "monthly|yearly"
}
```

---

## Upload/Documents

### GET /api/upload
Get courier documents.

**Query Parameters:**
- `courierId` (optional): Get documents for specific courier

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "document_id": "uuid",
      "document_type": "business_license",
      "file_name": "license.pdf",
      "file_url": "https://...",
      "status": "verified",
      "uploaded_at": "2024-01-01",
      "verified_at": "2024-01-02"
    }
  ]
}
```

### POST /api/upload
Generate upload URL for document.

**Request Body:**
```json
{
  "filename": "license.pdf",
  "fileType": "application/pdf",
  "documentType": "business_license|insurance_certificate|vehicle_registration|driver_license|tax_document|other",
  "courierId": "uuid" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "uploadUrl": "https://s3.amazonaws.com/presigned-url",
  "documentId": "uuid",
  "fileUrl": "courier-documents/..."
}
```

### PUT /api/upload/:documentId
Update document status after upload.

**Request Body:**
```json
{
  "status": "uploaded",
  "fileSize": 1024000
}
```

### DELETE /api/upload
Delete document.

**Request Body:**
```json
{
  "documentId": "uuid"
}
```

### POST /api/upload/:documentId/verify
Verify document (Admin only).

**Request Body:**
```json
{
  "status": "verified|rejected",
  "rejectionReason": "Invalid document" (if rejected)
}
```

---

## Reviews

### POST /api/reviews
Submit a review (Public endpoint, no auth required).

**Request Body:**
```json
{
  "order_id": "uuid" (optional),
  "courier_id": "uuid",
  "rating": 5,
  "review_text": "Excellent service!",
  "delivery_speed": 5,
  "package_condition": 5,
  "communication": 5,
  "professionalism": 5,
  "reviewer_name": "John Doe",
  "reviewer_email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "review_id": "uuid",
  "message": "Review submitted successfully"
}
```

### GET /api/reviews/courier/:courierId
Get reviews for a courier.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (default: approved): `pending|approved|rejected`

**Response:**
```json
{
  "success": true,
  "reviews": [...],
  "summary": {
    "total_reviews": 150,
    "avg_rating": 4.5,
    "avg_delivery_speed": 4.6,
    "avg_package_condition": 4.7,
    "five_star": 100,
    "four_star": 30,
    "three_star": 15,
    "two_star": 3,
    "one_star": 2
  },
  "pagination": {...}
}
```

### GET /api/reviews/order/:orderId
Get review for specific order.

### PUT /api/reviews/:reviewId/status
Update review status (Admin only).

**Request Body:**
```json
{
  "status": "approved|rejected|pending"
}
```

### DELETE /api/reviews/:reviewId
Delete review (Admin only).

---

## Analytics

### GET /api/courier/checkout-analytics
Get courier's checkout position analytics.

**Role:** `courier`, `admin`

**Query Parameters:**
- `timeRange` (default: 30d): `7d|30d|90d`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_appearances": 1500,
      "times_selected": 450,
      "selection_rate": 30.0,
      "avg_position": 2.1
    },
    "byPosition": [...],
    "byMerchant": [...],
    "trends": [...]
  }
}
```

### GET /api/merchant/checkout-analytics
Get merchant's checkout analytics.

**Role:** `merchant`, `admin`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_checkouts": 500,
      "selection_rate": 85.0,
      "avg_order_value": 125.50
    },
    "courierPerformance": [...],
    "trends": [...],
    "recentCheckouts": [...]
  }
}
```

---

## Market Insights

**Premium Feature**

### GET /api/market-insights/courier
Get anonymized merchant market data for couriers.

**Role:** `courier`, `admin`  
**Requires:** Premium subscription

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantSegments": [
      {
        "segment": "Premium ($200+)",
        "merchant_count": 50,
        "avg_order_value": 250.00,
        "avg_selection_rate": 35.5
      }
    ],
    "geographicOpportunities": [...],
    "industryTrends": [...],
    "marketBenchmarks": {
      "market_avg_position": 2.5,
      "market_avg_selection_rate": 28.0
    }
  }
}
```

### GET /api/market-insights/merchant
Get anonymized courier market data for merchants.

**Role:** `merchant`, `admin`  
**Requires:** Professional tier or higher

---

## Dashboard

### GET /api/dashboard/recent-activity
Get recent activity for user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "order_id": "uuid",
      "tracking_number": "TRK123",
      "order_status": "delivered",
      "created_at": "2024-01-01",
      "activity_type": "order|delivery"
    }
  ]
}
```

### GET /api/tracking/summary
Get tracking summary statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_orders": 100,
    "delivered": 75,
    "in_transit": 20,
    "pending": 5
  }
}
```

---

## Team Management

### GET /api/team/couriers/:courierId/members
Get courier team members.

### POST /api/team/couriers/:courierId/invite
Invite user to courier team.

**Request Body:**
```json
{
  "email": "user@example.com",
  "teamRole": "admin|manager|member|viewer",
  "permissions": {}
}
```

### GET /api/team/stores/:storeId/members
Get store team members.

### POST /api/team/stores/:storeId/invite
Invite user to store team.

### POST /api/team/invitations/:token/accept
Accept team invitation.

### PUT /api/team/members/:teamMemberId/role
Update team member role.

**Request Body:**
```json
{
  "teamRole": "admin|manager|member|viewer",
  "permissions": []
}
```

### DELETE /api/team/members/:teamMemberId
Remove team member.

### GET /api/team/my-entities
Get user's accessible entities (couriers and stores).

---

## Webhooks

### POST /api/webhooks/stripe
Stripe webhook endpoint.

**Headers:**
- `stripe-signature`: Webhook signature

**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### POST /api/webhooks/shopify/orders
Shopify order webhook.

**Headers:**
- `x-shopify-hmac-sha256`: Webhook signature
- `x-shopify-shop-domain`: Shop domain

### POST /api/webhooks/shopify/fulfillments
Shopify fulfillment webhook.

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (development only)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### Common Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Access token required",
  "message": "Authentication failed"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "You do not have permission to access this resource"
}
```

**429 Rate Limit:**
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

---

## Rate Limiting

- **General API:** 100 requests per minute per user
- **Authentication:** 5 requests per minute per IP
- **Webhooks:** No rate limit

---

## Pagination

Paginated endpoints return:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Subscription Tiers

| Tier | Name | Price | Features |
|------|------|-------|----------|
| 1 | Basic | $29/mo | 100 orders/month, Basic analytics |
| 2 | Professional | $99/mo | 1,000 orders/month, Market insights |
| 3 | Enterprise | $299/mo | Unlimited, API access, White-label |

---

## Support

- **Email:** support@performile.com
- **Documentation:** https://docs.performile.com
- **Status:** https://status.performile.com

---

**Last Updated:** October 13, 2025
