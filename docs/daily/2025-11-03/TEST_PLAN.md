# TEST PLAN - Courier Credentials Management

**Date:** November 3, 2025  
**Feature:** Per-Merchant Courier API Credentials  
**Version:** 1.0  
**Status:** Ready for Testing

---

## 1. TEST OVERVIEW

### 1.1 Scope
- Merchant courier selection
- API credentials management
- Credentials testing
- Status tracking
- Database triggers
- RLS policies

### 1.2 Test Environment
- **Frontend:** https://performile.vercel.app
- **Database:** Supabase Production
- **Test Account:** merchant@performile.com
- **Test Couriers:** DHL, Instabox, PostNord

### 1.3 Test Types
- [ ] Unit Tests
- [ ] Integration Tests
- [x] Manual E2E Tests (Primary)
- [ ] Performance Tests
- [ ] Security Tests

---

## 2. PRE-TEST CHECKLIST

### 2.1 Environment Setup
- [ ] Frontend deployed to Vercel
- [ ] Database migrations applied
- [ ] Test account credentials available
- [ ] Browser DevTools ready
- [ ] Network tab monitoring enabled

### 2.2 Database Verification
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('courier_api_credentials', 'merchant_courier_selections');

-- Verify view exists
SELECT table_name FROM information_schema.views 
WHERE table_name = 'vw_merchant_courier_credentials';

-- Verify trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'update_credentials_configured_trigger';

-- Verify functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%courier%';
```

### 2.3 API Endpoint Verification
- [ ] GET /api/merchant/couriers exists
- [ ] POST /api/courier-credentials exists
- [ ] POST /api/courier-credentials/test exists

---

## 3. TEST CASES

### 3.1 Navigation Tests

#### TC-001: Access Courier Settings
**Priority:** HIGH  
**Precondition:** Logged in as merchant@performile.com

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Navigate to Settings | Settings page loads | [ ] |
| 2 | Look for "Couriers" tab | Tab is visible | [ ] |
| 3 | Click "Couriers" tab | Courier settings page loads | [ ] |
| 4 | Verify page title | Shows "Courier Settings" | [ ] |

**Notes:**
- If tab not visible, check Settings navigation component
- Should be at same level as General, Security, etc.

---

### 3.2 Courier Selection Tests

#### TC-002: View Selected Couriers
**Priority:** HIGH  
**Precondition:** On Courier Settings page

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | View "Your Selected Couriers" section | Section visible | [ ] |
| 2 | Check courier count | Shows (X) couriers | [ ] |
| 3 | Verify courier cards | Each shows logo, name, stats | [ ] |
| 4 | Check credentials status | Shows ⚠️ No Credentials | [ ] |

#### TC-003: Add New Courier
**Priority:** HIGH  
**Precondition:** On Courier Settings page

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Add Courier" button | Dialog opens | [ ] |
| 2 | View available couriers | List shows unselected couriers | [ ] |
| 3 | Click on DHL | DHL added to selections | [ ] |
| 4 | Dialog closes | Returns to main page | [ ] |
| 5 | Verify DHL appears | Shows in selected couriers | [ ] |
| 6 | Check status | Shows ⚠️ No Credentials | [ ] |

---

### 3.3 Credentials Management Tests

#### TC-004: Open Credentials Modal
**Priority:** HIGH  
**Precondition:** DHL courier selected

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Find DHL courier card | Card visible | [ ] |
| 2 | Click "Add Credentials" button | Modal opens | [ ] |
| 3 | Verify modal title | Shows "Add DHL Credentials" | [ ] |
| 4 | Check form fields | All 4 fields visible | [ ] |
| 5 | Verify base URL | Pre-filled with DHL URL | [ ] |

#### TC-005: Validate Form Fields
**Priority:** MEDIUM  
**Precondition:** Credentials modal open

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Leave customer number empty | Field required | [ ] |
| 2 | Leave API key empty | Field required | [ ] |
| 3 | Click "Test Connection" | Button disabled | [ ] |
| 4 | Fill customer number | Field accepts input | [ ] |
| 5 | Fill API key | Field masks password | [ ] |
| 6 | Check "Test Connection" button | Now enabled | [ ] |

#### TC-006: Test Connection - Invalid Credentials
**Priority:** HIGH  
**Precondition:** Form filled with invalid data

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Enter fake customer number | "12345" | [ ] |
| 2 | Enter fake API key | "invalid_key" | [ ] |
| 3 | Click "Test Connection" | Button shows loading | [ ] |
| 4 | Wait for response | Error alert appears | [ ] |
| 5 | Check error message | Shows "Connection failed" | [ ] |
| 6 | Check "Save" button | Still disabled | [ ] |

#### TC-007: Test Connection - Valid Credentials
**Priority:** HIGH  
**Precondition:** Form filled with valid DHL credentials

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Enter valid customer number | Real DHL customer # | [ ] |
| 2 | Enter valid API key | Real DHL API key | [ ] |
| 3 | Click "Test Connection" | Button shows loading | [ ] |
| 4 | Wait for response | Success alert appears | [ ] |
| 5 | Check success message | Shows "Connection successful!" | [ ] |
| 6 | Check "Save" button | Now enabled | [ ] |

#### TC-008: Save Credentials
**Priority:** HIGH  
**Precondition:** Test connection passed

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Save Credentials" | Loading indicator | [ ] |
| 2 | Wait for save | Success toast appears | [ ] |
| 3 | Modal closes | Returns to main page | [ ] |
| 4 | Check DHL card | Status updated | [ ] |
| 5 | Verify status chip | Shows ✅ Credentials: #12345 | [ ] |
| 6 | Check button | Changed to 🔑 icon | [ ] |

---

### 3.4 Edit Credentials Tests

#### TC-009: Edit Existing Credentials
**Priority:** HIGH  
**Precondition:** DHL has configured credentials

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click 🔑 icon on DHL card | Modal opens | [ ] |
| 2 | Verify modal title | Shows "Edit DHL Credentials" | [ ] |
| 3 | Check customer number | Pre-filled with existing # | [ ] |
| 4 | Check API key | Masked (password field) | [ ] |
| 5 | Update API key | New value entered | [ ] |
| 6 | Click "Test Connection" | Tests with new key | [ ] |
| 7 | Wait for success | Success alert appears | [ ] |
| 8 | Click "Save" | Credentials updated | [ ] |
| 9 | Verify toast | Shows "Credentials saved" | [ ] |

---

### 3.5 Multiple Couriers Tests

#### TC-010: Add Second Courier
**Priority:** MEDIUM  
**Precondition:** DHL configured

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Add Courier" | Dialog opens | [ ] |
| 2 | Select Instabox | Instabox added | [ ] |
| 3 | Verify both couriers | DHL and Instabox visible | [ ] |
| 4 | Check DHL status | Still shows ✅ Configured | [ ] |
| 5 | Check Instabox status | Shows ⚠️ No Credentials | [ ] |

#### TC-011: Configure Second Courier
**Priority:** MEDIUM  
**Precondition:** Instabox added

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click "Add Credentials" on Instabox | Modal opens | [ ] |
| 2 | Fill Instabox credentials | Form accepts input | [ ] |
| 3 | Test connection | Success | [ ] |
| 4 | Save credentials | Saved successfully | [ ] |
| 5 | Verify both couriers | Both show ✅ Configured | [ ] |

---

### 3.6 Remove Courier Tests

#### TC-012: Remove Courier Without Credentials
**Priority:** MEDIUM  
**Precondition:** Add new courier without credentials

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Add PostNord courier | Added successfully | [ ] |
| 2 | Don't add credentials | Status: ⚠️ No Credentials | [ ] |
| 3 | Click trash icon | Confirmation dialog | [ ] |
| 4 | Confirm removal | Courier removed | [ ] |
| 5 | Verify removal | PostNord not in list | [ ] |

#### TC-013: Remove Courier With Credentials
**Priority:** HIGH  
**Precondition:** Courier has configured credentials

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Click trash icon on DHL | Confirmation dialog | [ ] |
| 2 | Confirm removal | Courier removed | [ ] |
| 3 | Verify removal | DHL not in list | [ ] |
| 4 | Check database | Credentials also deleted | [ ] |

---

### 3.7 Database Tests

#### TC-014: Verify Database Updates
**Priority:** HIGH  
**Precondition:** Credentials saved for DHL

```sql
-- Check credentials exist
SELECT * FROM courier_api_credentials 
WHERE merchant_id = (SELECT user_id FROM users WHERE email = 'merchant@performile.com')
  AND courier_id = (SELECT courier_id FROM couriers WHERE courier_code = 'DHL');

-- Expected: 1 row with customer_number, encrypted api_key

-- Check selection status
SELECT credentials_configured FROM merchant_courier_selections
WHERE merchant_id = (SELECT user_id FROM users WHERE email = 'merchant@performile.com')
  AND courier_id = (SELECT courier_id FROM couriers WHERE courier_code = 'DHL');

-- Expected: credentials_configured = true

-- Check view
SELECT * FROM vw_merchant_courier_credentials
WHERE merchant_id = (SELECT user_id FROM users WHERE email = 'merchant@performile.com')
  AND courier_code = 'DHL';

-- Expected: has_credentials = true, customer_number visible
```

| Check | Query | Expected Result | Status |
|-------|-------|----------------|--------|
| 1 | Credentials exist | 1 row returned | [ ] |
| 2 | API key encrypted | Not plain text | [ ] |
| 3 | Status updated | credentials_configured = true | [ ] |
| 4 | View shows data | has_credentials = true | [ ] |

#### TC-015: Verify Trigger Functionality
**Priority:** HIGH  
**Precondition:** Database access

```sql
-- Test trigger on INSERT
-- 1. Add credentials
INSERT INTO courier_api_credentials (...)
-- 2. Check merchant_courier_selections.credentials_configured
-- Expected: Automatically set to true

-- Test trigger on DELETE
-- 1. Delete credentials
DELETE FROM courier_api_credentials WHERE ...
-- 2. Check merchant_courier_selections.credentials_configured
-- Expected: Automatically set to false
```

| Test | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Insert credentials | Status auto-updates to true | [ ] |
| 2 | Delete credentials | Status auto-updates to false | [ ] |
| 3 | Update credentials | Status remains true | [ ] |

---

### 3.8 Security Tests

#### TC-016: RLS Policy Verification
**Priority:** HIGH  
**Precondition:** Two merchant accounts

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Login as merchant@performile.com | Can see own couriers | [ ] |
| 2 | Add DHL credentials | Saved successfully | [ ] |
| 3 | Logout | Session ended | [ ] |
| 4 | Login as different merchant | Can see own couriers | [ ] |
| 5 | Check courier list | Cannot see first merchant's DHL | [ ] |
| 6 | Try to access credentials | RLS blocks access | [ ] |

#### TC-017: API Key Encryption
**Priority:** HIGH  
**Precondition:** Credentials saved

```sql
-- Check API key is encrypted
SELECT api_key FROM courier_api_credentials 
WHERE merchant_id = (SELECT user_id FROM users WHERE email = 'merchant@performile.com')
LIMIT 1;

-- Expected: Encrypted string, not plain text
```

| Check | Query | Expected Result | Status |
|-------|-------|----------------|--------|
| 1 | View api_key column | Encrypted/hashed value | [ ] |
| 2 | Not plain text | Cannot read actual key | [ ] |

---

### 3.9 Error Handling Tests

#### TC-018: Network Error Handling
**Priority:** MEDIUM  
**Precondition:** On credentials modal

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Open DevTools | Network tab visible | [ ] |
| 2 | Set network to "Offline" | Network disabled | [ ] |
| 3 | Click "Test Connection" | Loading starts | [ ] |
| 4 | Wait for timeout | Error message appears | [ ] |
| 5 | Check error text | Shows network error | [ ] |

#### TC-019: Duplicate Credentials
**Priority:** MEDIUM  
**Precondition:** DHL credentials exist

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Try to add DHL again | Should prevent or update | [ ] |
| 2 | Check database constraint | UNIQUE constraint enforced | [ ] |

---

### 3.10 UI/UX Tests

#### TC-020: Loading States
**Priority:** LOW  
**Precondition:** On courier settings page

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Refresh page | Loading spinner shows | [ ] |
| 2 | Wait for data | Couriers load | [ ] |
| 3 | Click "Test Connection" | Button shows loading | [ ] |
| 4 | Wait for response | Loading stops | [ ] |

#### TC-021: Responsive Design
**Priority:** LOW  
**Precondition:** On courier settings page

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Resize to mobile (375px) | Layout adjusts | [ ] |
| 2 | Check courier cards | Stack vertically | [ ] |
| 3 | Open modal | Modal fits screen | [ ] |
| 4 | Resize to tablet (768px) | Layout adjusts | [ ] |
| 5 | Resize to desktop (1920px) | Layout optimal | [ ] |

---

## 4. TEST DATA

### 4.1 Test Accounts
```
Merchant 1:
- Email: merchant@performile.com
- Password: [from secure storage]
- Stores: Demo Store, Demo Electronics Store

Merchant 2:
- Email: merchant2@performile.com (if exists)
- Password: [from secure storage]
```

### 4.2 Test Credentials

**DHL Test:**
```
Customer Number: [Real DHL test account]
API Key: [Real DHL test key]
Base URL: https://api-eu.dhl.com
```

**Instabox Test:**
```
Customer Number: [Real Instabox test account]
API Key: [Real Instabox test key]
Base URL: https://api.instabox.io
```

**Invalid Test:**
```
Customer Number: 12345
API Key: invalid_key_for_testing
Base URL: https://api2.postnord.com
```

---

## 5. TEST EXECUTION

### 5.1 Test Sequence
1. Pre-test verification (Section 2)
2. Navigation tests (TC-001)
3. Courier selection (TC-002, TC-003)
4. Credentials management (TC-004 to TC-008)
5. Edit credentials (TC-009)
6. Multiple couriers (TC-010, TC-011)
7. Remove courier (TC-012, TC-013)
8. Database verification (TC-014, TC-015)
9. Security tests (TC-016, TC-017)
10. Error handling (TC-018, TC-019)
11. UI/UX tests (TC-020, TC-021)

### 5.2 Test Schedule
- **Day 1:** TC-001 to TC-008 (Core functionality)
- **Day 2:** TC-009 to TC-015 (Advanced features)
- **Day 3:** TC-016 to TC-021 (Security & polish)

---

## 6. DEFECT TRACKING

### 6.1 Defect Template
```
ID: BUG-XXX
Title: [Brief description]
Severity: Critical / High / Medium / Low
Priority: P0 / P1 / P2 / P3
Steps to Reproduce:
1. ...
2. ...
Expected Result: ...
Actual Result: ...
Environment: Browser, OS, etc.
Screenshots: [Attach if applicable]
```

### 6.2 Known Issues
1. **Settings Navigation Missing** (P0)
   - Status: Known
   - Fix: Add Couriers tab to Settings navigation
   - ETA: 30 minutes

2. **API Endpoints Unverified** (P1)
   - Status: Pending verification
   - Fix: Create missing endpoints
   - ETA: 1 hour

---

## 7. TEST COMPLETION CRITERIA

### 7.1 Exit Criteria
- [ ] All HIGH priority tests passed
- [ ] Zero P0 defects
- [ ] < 2 P1 defects
- [ ] Database integrity verified
- [ ] Security tests passed
- [ ] Documentation complete

### 7.2 Success Metrics
- **Pass Rate:** > 95%
- **Critical Bugs:** 0
- **Performance:** < 2s page load
- **Security:** All RLS policies working

---

## 8. TEST REPORT TEMPLATE

```markdown
# TEST EXECUTION REPORT

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Environment]

## Summary
- Total Tests: XX
- Passed: XX
- Failed: XX
- Blocked: XX
- Pass Rate: XX%

## Critical Issues
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Sign-off
Tested by: [Name]
Date: [Date]
Status: [PASS/FAIL]
```

---

## 9. APPENDIX

### 9.1 SQL Verification Queries

```sql
-- Check all courier credentials for merchant
SELECT 
    c.courier_name,
    cac.customer_number,
    cac.account_name,
    cac.is_active,
    cac.created_at
FROM courier_api_credentials cac
JOIN couriers c ON cac.courier_id = c.courier_id
WHERE cac.merchant_id = (SELECT user_id FROM users WHERE email = 'merchant@performile.com')
ORDER BY c.courier_name;

-- Check credentials status in selections
SELECT 
    c.courier_name,
    mcs.credentials_configured,
    mcs.is_active,
    mcs.added_during
FROM merchant_courier_selections mcs
JOIN couriers c ON mcs.courier_id = c.courier_id
WHERE mcs.merchant_id = (SELECT user_id FROM users WHERE email = 'merchant@performile.com')
ORDER BY mcs.display_order;

-- Check view data
SELECT * FROM vw_merchant_courier_credentials
WHERE merchant_id = (SELECT user_id FROM users WHERE email = 'merchant@performile.com')
ORDER BY courier_name;
```

### 9.2 Browser Console Commands

```javascript
// Check if credentials modal state exists
console.log(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Monitor API calls
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/'))
  .forEach(r => console.log(r.name, r.duration));

// Check localStorage
console.log(localStorage.getItem('token'));
```

---

**Test Plan Version:** 1.0  
**Created:** November 3, 2025  
**Status:** Ready for Execution  
**Estimated Duration:** 6-8 hours
