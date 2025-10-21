# API Call Report

## Summary
- Total API Calls: 1
- Failed Calls: 1
- Slow Calls (>1s): 0
- Average Response Time: 443.00ms

## Calls by Endpoint
- /api/auth: 1 calls

## All API Calls

### 1. POST /api/auth
- Status: 401
- Duration: 443ms
- Timestamp: 2025-10-21T07:44:31.290Z
- Request Body: ```json
{
  "action": "login",
  "email": "invalid@example.com",
  "password": "Test1234!"
}
```
- Response Body: ```json
{
  "message": "Invalid credentials"
}
```
