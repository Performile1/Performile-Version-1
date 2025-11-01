# Missing API Endpoints Audit

## Critical Missing Endpoints (Causing 500/400 errors)

### Admin Routes (admin.ts)
- ❌ `GET /api/admin/carriers` - Frontend expects this
- ❌ `POST /api/admin/carriers` - Frontend expects this
- ❌ `PUT /api/admin/carriers/:id` - Frontend expects this
- ❌ `DELETE /api/admin/carriers/:id` - Frontend expects this
- ❌ `GET /api/admin/stores` - Frontend expects this
- ❌ `GET /api/admin/users` - Frontend expects this (for merchants/couriers management)

### Subscription Routes (MISSING FILE)
- ❌ `GET /api/subscriptions/current` - Get current subscription
- ❌ `GET /api/subscriptions/invoices` - Get invoices
- ❌ `POST /api/subscriptions/update-payment-method` - Update payment
- ❌ `POST /api/subscriptions/cancel` - Cancel subscription

### Dashboard Routes (MISSING)
- ❌ `GET /api/dashboard/recent-activity` - Recent activity widget
- ❌ `GET /api/tracking/summary` - Tracking summary (causing 401 errors)

### Upload Routes (MISSING FILE)
- ❌ `GET /api/upload` - Get documents
- ❌ `POST /api/upload` - Upload document
- ❌ `DELETE /api/upload` - Delete document

### Review Routes (MISSING FILE)
- ❌ `POST /api/reviews` - Submit review

### Leads Routes (MISSING)
- ❌ `POST /api/leads?action=checkout` - Purchase lead

## Existing Routes That Need Fixes

### Team Routes (team.ts)
- ✅ `GET /api/team/couriers/:courierId/members` - EXISTS
- ✅ `POST /api/team/couriers/:courierId/invite` - EXISTS
- ❌ `GET /api/team/stores/:storeId/members` - MISSING
- ❌ `POST /api/team/stores/:storeId/invite` - MISSING
- ❌ `GET /api/team/my-entities` - MISSING
- ❌ `POST /api/team/invitations/:token/accept` - MISSING
- ❌ `PUT /api/team/members/:teamMemberId/role` - MISSING
- ❌ `DELETE /api/team/members/:teamMemberId` - MISSING

### Analytics Routes (analytics.ts)
- ✅ `GET /api/analytics/performance` - EXISTS
- ✅ `GET /api/analytics/competitor/:marketId` - EXISTS
- ✅ `GET /api/analytics/markets` - EXISTS
- ✅ `GET /api/analytics/marketplace/couriers/:marketId` - EXISTS
- ✅ `GET /api/analytics/marketplace/leads` - EXISTS
- ✅ `POST /api/analytics/marketplace/leads/:leadId/purchase` - EXISTS
- ✅ `GET /api/analytics/subscription/status` - EXISTS
- ✅ `POST /api/analytics/premium/:featureId/purchase` - EXISTS

## Root Causes of 500/400 Errors

1. **Missing Route Files:**
   - `subscriptions.ts` - Completely missing
   - `upload.ts` - Completely missing
   - `reviews.ts` - Completely missing
   - `dashboard.ts` - Completely missing

2. **Incomplete Route Files:**
   - `admin.ts` - Only has placeholder routes
   - `team.ts` - Missing store team management

3. **Authentication Issues:**
   - Some routes require authentication but frontend not sending token
   - Some routes have wrong role requirements

4. **Database Schema Mismatches:**
   - Routes expecting tables that don't exist (e.g., consumers table)
   - Routes expecting columns that don't exist

## Priority Fix List

### P0 (Critical - Breaking Core Features)
1. Fix `/api/admin/users` - Manage Couriers/Merchants pages broken
2. Fix `/api/admin/carriers` - Manage Carriers page broken
3. Fix `/api/admin/stores` - Manage Stores page broken
4. Create `/api/subscriptions/*` - Billing portal broken
5. Create `/api/dashboard/recent-activity` - Dashboard widget broken

### P1 (High - Breaking Secondary Features)
1. Create `/api/upload/*` - Document upload broken
2. Create `/api/reviews` - Review submission broken
3. Fix `/api/team/*` - Team management broken
4. Create `/api/tracking/summary` - Tracking summary broken

### P2 (Medium - Nice to Have)
1. Create `/api/leads` - Lead purchase
2. Complete analytics endpoints

## Recommended Actions

1. **Immediate:**
   - Create missing route files
   - Implement basic CRUD operations
   - Add proper error handling

2. **Short-term:**
   - Add proper role-based access control
   - Add input validation
   - Add logging

3. **Long-term:**
   - Add comprehensive testing
   - Add API documentation
   - Add rate limiting per endpoint
