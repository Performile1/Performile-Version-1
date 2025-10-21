# API Call Report

## Summary
- Total API Calls: 1
- Failed Calls: 1
- Slow Calls (>1s): 0
- Average Response Time: 354.00ms

## Calls by Endpoint
- /api/auth: 1 calls

## All API Calls

### 1. POST /api/auth
- Status: 401
- Duration: 354ms
- Timestamp: 2025-10-21T07:44:35.613Z
- Request Body: ```json
{
  "action": "login",
  "email": "admin@performile.com",
  "password": "WrongPassword123!"
}
```
- Response Body: ```json
{
  "message": "Invalid credentials"
}
```
