# START OF DAY BRIEFING - DAY 1 (WEEK 3)

**Date:** Monday, November 17, 2025  
**Week:** Week 3 – Credential Recovery & Checkout Momentum  
**Launch Countdown:** 22 days until December 9, 2025  
**Platform Version:** v2.2 (Spec-Driven Framework v1.28)  
**Status:** Re-entry after credential rotation block

---

## ✅ YESTERDAY'S ACCOMPLISHMENTS (Sunday, Nov 16)
- ✅ Verified Vercel environment variables post-investigation (SUPABASE secrets confirmed server-only).  
- ✅ Audited codebase for hard-coded Supabase keys; none detected (scripts rely on env vars only).  
- ✅ Reviewed Thursday carry-over checklist and documented remaining dependencies for Monday restart.  
- ⏳ Pending: Await Supabase support confirmation for service-role key rotation.

---

## 🚨 TODAY'S PRIORITIES

### 1. **Supabase Credential Rotation & Validation (75 minutes)** 🚨
**Priority:** CRITICAL  
**Status:** BLOCKING importer + automation work  

**Tasks:**
- [ ] Receive refreshed service-role key from Supabase support & revoke obsolete key.  
- [ ] Update `.env`, Vercel, CI, and documentation with rotation timestamp.  
- [ ] Run smoke test of `scripts/import-postal-codes.js` (100-row batch) and review logs.  

**Files to Check:**
- `scripts/import-postal-codes.js`  
- `scripts/lib/postal-code-importer.js`  
- `docs/daily/2025-11-11/TYPESCRIPT_ERRORS_TO_FIX.md`

**Success Criteria:**
- ✅ New key active and old key disabled.  
- ✅ Smoke batch completes without auth errors; log archived.  
- ✅ RLS/auth sanity checks pass (`auth.uid()` verifies in importer + API sample call).

**📄 Detailed Guide:** See `docs/daily/2025-11-13/CREDENTIAL_ROTATION_PLAYBOOK.md`

---

### 2. **Coverage Strategy Recommendation (90 minutes)** ⚠️
**Priority:** HIGH  
**Status:** NON-BLOCKING once credentials restored  

**Tasks:**
- [ ] Compare regional slicing vs. alternative datasets to break the 10k OpenDataSoft cap.  
- [ ] Document schema impacts, data freshness, and engineering effort.  
- [ ] Draft recommended path with next-step backlog items.

**Files to Check:**
- `docs/daily/2025-11-12/COVERAGE_ANALYSIS_NOTES.md`  
- `docs/daily/2025-11-05/CHECKOUT_INTEGRATIONS.md`

**Success Criteria:**
- ✅ Recommendation doc committed with decision, trade-offs, and implementation outline.  
- ✅ Jira/Linear tickets (placeholder) or TODO list created for execution.

**📄 Detailed Guide:** See `docs/daily/2025-11-13/COVERAGE_RECOMMENDATION_TEMPLATE.md`

---

### 3. **Automation Platform Decision (60 minutes)** ⚠️
**Priority:** HIGH  
**Status:** NON-BLOCKING  

**Tasks:**
- [ ] Evaluate Vercel Cron vs Supabase Scheduler (secrets, logging, reliability, cost).  
- [ ] Define implementation plan (owner, timeline, monitoring).  
- [ ] Capture SOP for secret rotation per platform.

**Files to Check:**
- `docs/daily/2025-11-10/AUTOMATION_OPTIONS_MATRIX.md`  
- `scripts/vercel-deploy.js`

**Success Criteria:**
- ✅ Decision documented with SOP, monitoring hooks, and rollback plan.  
- ✅ Tasks scheduled for implementation (backlog updated).

**📄 Detailed Guide:** See `docs/daily/2025-11-13/AUTOMATION_DECISION_PLAN.md`

---

### 4. **Checkout Preview & Dynamic Ranking Reboot (120 minutes)** ⚙️
**Priority:** MEDIUM  
**Status:** DEPENDS on credential validation  

**Tasks:**
- [ ] Resume capability filters + preview validation (QR vs printed flows, subscription gating).  
- [ ] Sync postal code data usage with importer outputs; handle missing municipalities gracefully.  
- [ ] Progress scaffolding for dynamic ranking (weighting inputs, analytics alignment).

**Files to Check:**
- `apps/web/src/pages/checkout/CheckoutPreview.tsx`  
- `apps/api/src/routes/checkout/options.ts`  
- `docs/2025-11-01/DYNAMIC_COURIER_RANKING_SPEC.md`

**Success Criteria:**
- ✅ Feature branch updated with measurable progress (commits pushed).  
- ✅ TypeScript build clean for touched files.  
- ✅ Preview reflects postal code validation and ranking stubs without runtime errors.

**📄 Detailed Guide:** See `docs/daily/2025-11-11/CHECKOUT_POLISH_PLAN.md`

---

## 📈 CURRENT STATUS SNAPSHOT
- **Database:** 100% objects intact; importer paused pending key rotation.  
- **Backend APIs:** 70% verified this week; credential-dependent tasks on hold.  
- **Frontend:** Checkout/ranking updates staged but behind due to data freeze.  
- **Testing:** Playwright suite idle until importer verification complete.  
- **Security:** No leak detected; rotation still mandatory for defense-in-depth.

---

## 🚀 LAUNCH TIMELINE CHECK (Dec 9, 2025)
- **Week 3 (Nov 17–21):** Credential rotation, coverage plan, checkout polish.  
- **Week 4 (Nov 24–28):** Beta onboarding prep & marketing assets.  
- **Week 5 (Dec 1–5):** Iterate on beta feedback, prepare public launch assets.  
- **Week 6 (Dec 6–9):** Final polish and launch.  
- **Status:** ON TRACK *if* credential rotation closes today; otherwise risk of 1–2 day slip.

---

## 📚 REFERENCE DOCUMENTS

**Today's Work:**
- `docs/daily/2025-11-13/CREDENTIAL_ROTATION_PLAYBOOK.md` ⭐ **START HERE**  
- `docs/daily/2025-11-13/AUTOMATION_DECISION_PLAN.md`  
- `docs/daily/2025-11-13/COVERAGE_RECOMMENDATION_TEMPLATE.md`

**Yesterday's Work:**
- `docs/daily/2025-11-12/COVERAGE_ANALYSIS_NOTES.md`  
- `docs/daily/2025-11-11/TYPESCRIPT_ERRORS_TO_FIX.md`

**Launch Plan:**
- `docs/daily/2025-11-05/REVISED_LAUNCH_PLAN_WITH_APPS.md`  
- `docs/planning/DEVELOPMENT_ROADMAP.md`

**Framework:**
- `SPEC_DRIVEN_FRAMEWORK.md`

---

## 🎯 SUCCESS CRITERIA FOR TODAY
- **Minimum:** Supabase key rotated & importer smoke test passes.  
- **Target:** Coverage recommendation + automation decision documented.  
- **Stretch:** Checkout preview & ranking scaffolding pushed with TS errors cleared.

---

## 🗒️ TODAY'S CHECKLIST

**Morning (3 hours):**
- [ ] **PRIORITY:** Supabase credential rotation & smoke test (75 min)  
  - [ ] Retrieve new key & revoke old  
  - [ ] Update secrets + `.env` templates  
  - [ ] Run 100-row importer batch  
- [ ] Coverage strategy deep-dive (90 min)

**Afternoon (3 hours):**
- [ ] Automation platform decision workshop (60 min)  
- [ ] Break / context reset (30 min)  
- [ ] Checkout preview + ranking reboot (120 min)

**Evening (Optional 1 hour):**
- [ ] Validate TS build, document progress, prep EOD summary

---

**Execute with precision: rotate, validate, then accelerate feature delivery.**
