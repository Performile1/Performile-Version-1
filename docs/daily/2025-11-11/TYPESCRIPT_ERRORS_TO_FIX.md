# TypeScript Errors to Fix

**Date:** Tuesday, November 11, 2025  
**Priority:** CRITICAL  
**Status:** 🚨 BLOCKING — Build fails  
**Estimated Time:** 120 minutes

---

## 🐛 Errors Discovered

### 1. UnifiedNotificationService relation typing failure
```
api/lib/services/UnifiedNotificationService.ts(197,42): error TS2339: Property 'users' does not exist on type '{ store_name: any; owner_user_id: any; users: { email: any; full_name: any; }[]; }[]'.
api/lib/services/UnifiedNotificationService.ts(198,41): error TS2339: Property 'users' does not exist on type '{ store_name: any; owner_user_id: any; users: { email: any; full_name: any; }[]; }[]'.
```
**Frequency:** Every build  
**Impact:** HIGH — Notifications cannot compile  
**Likely Cause:** Supabase relation is returned as array; typings expect singular object.

### 2. WebhookRouter argument mismatch
```
api/lib/webhooks/WebhookRouter.ts(233,9): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string | null'.
```
**Frequency:** Every build  
**Impact:** MEDIUM — Webhook router compilation blocked  
**Likely Cause:** Optional header value not normalised before passing to helper expecting null when absent.

### 3. Tracking search relation typing regression
```
api/tracking/search.ts(175,66): error TS2339: Property 'courier_code' does not exist on type '{ courier_id: any; courier_name: any; courier_code: any; logo_url: any; }[]'.
api/tracking/search.ts(192,34): error TS2339: Property 'store_id' does not exist on type '{ store_id: any; store_name: any; owner_user_id: any; }[]'.
api/tracking/search.ts(193,36): error TS2339: Property 'store_name' does not exist on type '{ store_id: any; store_name: any; owner_user_id: any; }[]'.
api/tracking/search.ts(196,38): error TS2339: Property 'courier_id' does not exist on type '{ courier_id: any; courier_name: any; courier_code: any; logo_url: any; }[]'.
api/tracking/search.ts(197,40): error TS2339: Property 'courier_name' does not exist on type '{ courier_id: any; courier_name: any; courier_code: any; logo_url: any; }[]'.
api/tracking/search.ts(198,40): error TS2339: Property 'courier_code' does not exist on type '{ courier_id: any; courier_name: any; courier_code: any; logo_url: any; }[]'.
api/tracking/search.ts(199,36): error TS2339: Property 'logo_url' does not exist on type '{ courier_id: any; courier_name: any; courier_code: any; logo_url: any; }[]'.
```
**Frequency:** Every build  
**Impact:** CRITICAL — Tracking search API unusable  
**Likely Cause:** Supabase relation typing still interpreted as array after latest refactor.

---

## 🔍 Root Cause Analysis
- Supabase `.select()` with relation joins returns arrays when multiple matches exist; our typings assumed singular objects. Need a resolver function and proper casting in both UnifiedNotificationService and tracking search logic.
- Header extraction in WebhookRouter does not coerce `undefined` to `null`, violating helper signature.
- Tracking search still maps raw `orders` without applying new `resolveRelation` helper consistently (likely missed in build output or stale file compiled before commit).

---

## 📋 Investigation Checklist
- [ ] Inspect Supabase join shapes in `UnifiedNotificationService.fetchStoreAdmins()` (or equivalent) and confirm return type.  
- [ ] Verify whether `.maybeSingle()` or `.single()` should be used to avoid array responses.  
- [ ] Update notification payload assembly to guard against missing relations.  
- [ ] Review WebhookRouter parameter expectations; adjust helper signature or caller to use `?? null`.  
- [ ] Re-run TypeScript build after each fix to ensure no cascading errors.  
- [ ] Audit other files for similar relation typing patterns introduced today.

---

## 🔧 Files to Check
- `api/lib/services/UnifiedNotificationService.ts`
- `api/lib/webhooks/WebhookRouter.ts`
- `api/tracking/search.ts`
- `api/lib/types/*.ts` (ensure shared interfaces are accurate)

---

## 🎯 Solution Steps

### Step 1: Normalise store admin payload (30 min)
- Introduce `resolveRelation` helper or array guard before accessing `users[0]`.  
- Adjust TypeScript types to reflect actual Supabase response.  
- Ensure email notification recipients deduplicate correctly.

### Step 2: Fix webhook header typing (10 min)
- Use `?? null` when passing optional values.  
- Add guard so downstream helper never receives `undefined`.

### Step 3: Finalise tracking search typings (45 min)
- Confirm latest commit compiled; if not, ensure `resolveRelation` is exported and used.  
- Add unit or integration test to prevent regression.  
- Ensure response still matches front-end contract.

### Step 4: Regression build & documentation (15 min)
- Run `npm run lint` and `npm run build` (or equivalent).  
- Update this file with completion notes.

---

## ✅ Success Criteria
- ✅ TypeScript build completes with zero errors.  
- ✅ Tracking search API responds with typed store and courier objects.  
- ✅ Notifications service sends emails without runtime relation errors.  
- ✅ Webhook routing handles missing headers gracefully.

---

## 📊 Testing Checklist
- [ ] `npm run build` at repo root.  
- [ ] Invoke `/api/tracking/search` via local request to confirm payload structure.  
- [ ] Trigger sample notification (existing unit/integration harness) to validate recipients.  
- [ ] Execute webhook simulation to ensure router handles missing signature header.

---

## 📚 Resources
- `docs/daily/2025-11-08/COURIER_DASHBOARD_UNIFIED_ARCHITECTURE.md`
- `docs/daily/2025-11-04/FUTURE_FEATURES_RMA_TA_WMS_SPEC.md`
- `SPEC_DRIVEN_FRAMEWORK.md`
