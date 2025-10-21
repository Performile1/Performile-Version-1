# API Call Report

## Summary
- Total API Calls: 1
- Failed Calls: 0
- Slow Calls (>1s): 0
- Average Response Time: 575.00ms

## Calls by Endpoint
- /api/auth: 1 calls

## All API Calls

### 1. POST /api/auth
- Status: 200
- Duration: 575ms
- Timestamp: 2025-10-21T07:44:55.802Z
- Request Body: ```json
{
  "action": "login",
  "email": "admin@performile.com",
  "password": "Test1234!"
}
```
- Response Body: ```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "738b2a23-f7a9-4c14-a4d0-cdc05a5592fa",
      "email": "admin@performile.com",
      "user_role": "admin",
      "first_name": "Admin",
      "last_name": "User",
      "is_verified": true,
      "is_active": true,
      "created_at": "2025-10-15T11:19:06.523Z",
      "updated_at": "2025-10-21T07:44:49.791Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNzM4YjJhMjMtZjdhOS00YzE0LWE0ZDAtY2RjMDVhNTU5MmZhIiwidXNlcklkIjoiNzM4YjJhMjMtZjdhOS00YzE0LWE0ZDAtY2RjMDVhNTU5MmZhIiwiZW1haWwiOiJhZG1pbkBwZXJmb3JtaWxlLmNvbSIsInVzZXJfcm9sZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYxMDMyNjk3LCJleHAiOjE3NjEwMzYyOTd9.uJDEJoHrmHawV6uW1SMSJbYlBQfSLry17eq81c2Hjag",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNzM4YjJhMjMtZjdhOS00YzE0LWE0ZDAtY2RjMDVhNTU5MmZhIiwidXNlcklkIjoiNzM4YjJhMjMtZjdhOS00YzE0LWE0ZDAtY2RjMDVhNTU5MmZhIiwiaWF0IjoxNzYxMDMyNjk3LCJleHAiOjE3NjE2Mzc0OTd9.deFjZSQJNOPJjfATL7MCHZHVvPOZMHcnymsS0LZOz88"
    }
  }
}
```
