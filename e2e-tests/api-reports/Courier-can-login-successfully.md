# API Call Report

## Summary
- Total API Calls: 11
- Failed Calls: 6
- Slow Calls (>1s): 2
- Average Response Time: 760.00ms

## Calls by Endpoint
- /api/auth: 1 calls
- /api/notifications: 1 calls
- /api/trustscore/dashboard: 1 calls
- /api/analytics/order-trends: 2 calls
- /api/analytics/claims-trends: 2 calls
- /api/dashboard/trends: 1 calls
- /api/dashboard/recent-activity: 1 calls
- /api/claims: 2 calls

## All API Calls

### 1. POST /api/auth
- Status: 200
- Duration: 620ms
- Timestamp: 2025-10-21T07:44:18.705Z
- Request Body: ```json
{
  "action": "login",
  "email": "courier@performile.com",
  "password": "Test1234!"
}
```
- Response Body: ```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "617f3f03-ec94-415a-8400-dc5c7e29d96f",
      "email": "courier@performile.com",
      "user_role": "courier",
      "first_name": "Courier",
      "last_name": "Demo",
      "is_verified": true,
      "is_active": true,
      "created_at": "2025-10-15T11:19:06.523Z",
      "updated_at": "2025-10-21T07:43:40.751Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjE3ZjNmMDMtZWM5NC00MTVhLTg0MDAtZGM1YzdlMjlkOTZmIiwidXNlcklkIjoiNjE3ZjNmMDMtZWM5NC00MTVhLTg0MDAtZGM1YzdlMjlkOTZmIiwiZW1haWwiOiJjb3VyaWVyQHBlcmZvcm1pbGUuY29tIiwidXNlcl9yb2xlIjoiY291cmllciIsInJvbGUiOiJjb3VyaWVyIiwiaWF0IjoxNzYxMDMyNjU5LCJleHAiOjE3NjEwMzYyNTl9.tlpjqqP29AgfoNZ_pYT_WbELYnv97izwwlUy-T71ATM",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjE3ZjNmMDMtZWM5NC00MTVhLTg0MDAtZGM1YzdlMjlkOTZmIiwidXNlcklkIjoiNjE3ZjNmMDMtZWM5NC00MTVhLTg0MDAtZGM1YzdlMjlkOTZmIiwiaWF0IjoxNzYxMDMyNjU5LCJleHAiOjE3NjE2Mzc0NTl9.wNWWj2LRJ9dyCk7unf50LfYQ_374tVLg0gSq_W1BvRw"
    }
  }
}
```

### 2. GET /api/notifications
- Status: 200
- Duration: 596ms
- Timestamp: 2025-10-21T07:44:19.422Z
- Response Body: ```json
{
  "success": true,
  "data": [],
  "unreadCount": 0
}
```

### 3. GET /api/trustscore/dashboard
- Status: 200
- Duration: 1213ms
- Timestamp: 2025-10-21T07:44:19.426Z
- Response Body: ```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_couriers": 1,
      "active_couriers": 1,
      "avg_trust_score": "90.00",
      "total_reviews": "5",
      "avg_rating": "4.6000000000000000",
      "total_orders_processed": "5",
      "delivered_orders": "5",
      "avg_completion_rate": "100.00",
      "avg_on_time_rate": "92.50"
    },
    "couriers": [
      {
        "courier_id": "4a700f6b-9d73-436c-8e44-00dbe426c30c",
        "courier_name": "Demo Courier Service",
        "overall_score": "66.80",
        "total_reviews": 5,
        "total_orders": 5,
        "delivered_orders": 5,
        "completion_rate": "100.00",
        "on_time_rate": "0.00"
      },
      {
        "courier_id": "25ac8cfb-9d22-45f4-8357-5dce3edf8932",
        "courier_name": "Instabox",
        "overall_score": "0.00",
        "total_reviews": 0,
        "total_orders": 0,
        "delivered_orders": 0,
        "completion_rate": "0.00",
        "on_time_rate": "0.00"
      },
      {
        "courier_id": "50130bbc-53a8-4017-a2e9-05cec6129039",
        "courier_name": "DHL Express",
        "overall_score": "0.00",
        "total_reviews": 0,
        "total_orders": 0,
        "delivered_orders": 0,
        "completion_rate": "0.00",
        "on_time_rate": "0.00"
      },
      {
        "courier_id": "a17a3a63-8e86-412a-9670-0f2435d587dc",
        "courier_name": "Schenker",
        "overall_score": "0.00",
        "total_reviews": 0,
        "total_orders": 0,
        "delivered_orders": 0,
        "completion_rate": "0.00",
        "on_time_rate": "0.00"
      },
      {
        "courier_id": "03b204a4-1998-4b74-a5cf-37f948cd1571",
        "courier_name": "Earlybird",
        "overall_score": "0.00",
        "total_reviews": 0,
        "total_orders": 0,
        "delivered_orders": 0,
        "completion_rate": "0.00",
        "on_time_rate": "0.00"
      }
    ],
    "recentReviews": [
      {
        "review_id": "0455d237-1f12-46d3-994d-fa7c631ec5d1",
        "rating": 5,
        "comment": "Great service! Order 1 delivered on time.",
        "created_at": "2025-10-15T14:06:24.891Z",
        "courier_name": "Demo Courier Service",
        "store_name": "Demo Store"
      },
      {
        "review_id": "05cc6787-220b-43a4-90af-8a3f1415cfea",
        "rating": 4,
        "comment": "Great service! Order 2 delivered on time.",
        "created_at": "2025-10-14T14:06:24.891Z",
        "courier_name": "Demo Courier Service",
        "store_name": "Demo Store"
      },
      {
        "review_id": "aefdad38-42f3-4e53-8607-2ddf84f38369",
        "rating": 5,
        "comment": "Great service! Order 3 delivered on time.",
        "created_at": "2025-10-13T14:06:24.891Z",
        "courier_name": "Demo Courier Service",
        "store_name": "Demo Store"
      },
      {
        "review_id": "84e7bd55-68f6-4330-815d-31dfd597fa09",
        "rating": 4,
        "comment": "Great service! Order 4 delivered on time.",
        "created_at": "2025-10-12T14:06:24.891Z",
        "courier_name": "Demo Courier Service",
        "store_name": "Demo Store"
      },
      {
        "review_id": "272d2ebd-3e62-4c8b-8c4a-ba4058d32742",
        "rating": 5,
        "comment": "Great service! Order 5 delivered on time.",
        "created_at": "2025-10-11T14:06:24.891Z",
        "courier_name": "Demo Courier Service",
        "store_name": "Demo Store"
      }
    ]
  }
}
```

### 4. GET /api/analytics/order-trends
- Status: 500
- Duration: 563ms
- Timestamp: 2025-10-21T07:44:20.681Z
- Response Body: ```json
{
  "error": {
    "code": "500",
    "message": "A server error has occurred"
  }
}
```

### 5. GET /api/analytics/claims-trends
- Status: 500
- Duration: 569ms
- Timestamp: 2025-10-21T07:44:20.683Z
- Response Body: ```json
{
  "error": {
    "code": "500",
    "message": "A server error has occurred"
  }
}
```

### 6. GET /api/dashboard/trends
- Status: 200
- Duration: 862ms
- Timestamp: 2025-10-21T07:44:20.691Z
- Response Body: ```json
{
  "success": true,
  "data": [
    {
      "date": "2025-10-14",
      "orders": "1",
      "reviews": "1",
      "trust_score": "0"
    },
    {
      "date": "2025-10-15",
      "orders": "0",
      "reviews": "1",
      "trust_score": "6.1"
    },
    {
      "date": "2025-10-16",
      "orders": "0",
      "reviews": "0",
      "trust_score": "0"
    },
    {
      "date": "2025-10-17",
      "orders": "0",
      "reviews": "0",
      "trust_score": "0"
    },
    {
      "date": "2025-10-18",
      "orders": "0",
      "reviews": "0",
      "trust_score": "0"
    },
    {
      "date": "2025-10-19",
      "orders": "0",
      "reviews": "0",
      "trust_score": "0"
    },
    {
      "date": "2025-10-20",
      "orders": "0",
      "reviews": "0",
      "trust_score": "0"
    },
    {
      "date": "2025-10-21",
      "orders": "0",
      "reviews": "0",
      "trust_score": "0"
    }
  ],
  "period": "7d"
}
```

### 7. GET /api/dashboard/recent-activity
- Status: 200
- Duration: 863ms
- Timestamp: 2025-10-21T07:44:20.694Z
- Response Body: ```json
{
  "success": true,
  "data": [
    {
      "type": "review",
      "id": "0455d237-1f12-46d3-994d-fa7c631ec5d1",
      "title": "New Review",
      "description": "5 stars",
      "timestamp": "2025-10-15T14:06:24.891Z"
    },
    {
      "type": "review",
      "id": "05cc6787-220b-43a4-90af-8a3f1415cfea",
      "title": "New Review",
      "description": "4 stars",
      "timestamp": "2025-10-14T14:06:24.891Z"
    },
    {
      "type": "order",
      "id": "c067d8ba-319b-46cb-9194-7ff4a4cd23ba",
      "title": "New Order",
      "description": "Order #ORD-2025-00001",
      "timestamp": "2025-10-14T14:06:24.891Z"
    },
    {
      "type": "order",
      "id": "bd58abdd-1ea3-4877-894e-561d0b9d8959",
      "title": "New Order",
      "description": "Order #ORD-2025-00002",
      "timestamp": "2025-10-13T14:06:24.891Z"
    },
    {
      "type": "review",
      "id": "aefdad38-42f3-4e53-8607-2ddf84f38369",
      "title": "New Review",
      "description": "5 stars",
      "timestamp": "2025-10-13T14:06:24.891Z"
    },
    {
      "type": "review",
      "id": "84e7bd55-68f6-4330-815d-31dfd597fa09",
      "title": "New Review",
      "description": "4 stars",
      "timestamp": "2025-10-12T14:06:24.891Z"
    },
    {
      "type": "order",
      "id": "55f3962e-e474-41b7-a990-33b73d82369f",
      "title": "New Order",
      "description": "Order #ORD-2025-00003",
      "timestamp": "2025-10-12T14:06:24.891Z"
    },
    {
      "type": "order",
      "id": "5740f2cc-5fc3-4e5a-af60-68cbf4bc0468",
      "title": "New Order",
      "description": "Order #ORD-2025-00004",
      "timestamp": "2025-10-11T14:06:24.891Z"
    },
    {
      "type": "review",
      "id": "272d2ebd-3e62-4c8b-8c4a-ba4058d32742",
      "title": "New Review",
      "description": "5 stars",
      "timestamp": "2025-10-11T14:06:24.891Z"
    },
    {
      "type": "order",
      "id": "c533847f-8b90-4f50-98bc-b80320e6ea29",
      "title": "New Order",
      "description": "Order #ORD-2025-00005",
      "timestamp": "2025-10-10T14:06:24.891Z"
    }
  ]
}
```

### 8. GET /api/claims
- Status: 500
- Duration: 1484ms
- Timestamp: 2025-10-21T07:44:20.685Z
- Response Body: ```json
{
  "error": "syntax error at or near \"WHERE\""
}
```

### 9. GET /api/analytics/order-trends
- Status: 500
- Duration: 319ms
- Timestamp: 2025-10-21T07:44:22.264Z
- Response Body: ```json
{
  "error": {
    "code": "500",
    "message": "A server error has occurred"
  }
}
```

### 10. GET /api/analytics/claims-trends
- Status: 500
- Duration: 338ms
- Timestamp: 2025-10-21T07:44:22.268Z
- Response Body: ```json
{
  "error": {
    "code": "500",
    "message": "A server error has occurred"
  }
}
```

### 11. GET /api/claims
- Status: 500
- Duration: 933ms
- Timestamp: 2025-10-21T07:44:23.180Z
- Response Body: ```json
{
  "error": "syntax error at or near \"WHERE\""
}
```
