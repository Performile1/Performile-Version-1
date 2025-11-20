# POSTAL CODE IMPORTER AUTOMATION DECISION – NOVEMBER 17, 2025

**Author:** Cascade  
**Week:** 3 – Day 1 (Credential rotation complete)  
**Related Docs:**  
- `docs/daily/2025-11-17/COVERAGE_RECOMMENDATION.md`  
- `docs/daily/2025-11-17/START_OF_DAY_BRIEFING.md`  
- `scripts/import-postal-codes.js` / `scripts/lib/postal-code-importer.js`

---

## 1. Goal
Automate the Nordic postal-code importer so that data stays fresh without manual intervention, while honoring Supabase-first rules and secure secret management.

---

## 2. Options Evaluated

### Option A – Vercel Scheduled Functions (Cron Jobs)
- **How it works:** add a `vercel.json` cron schedule invoking a serverless function that runs the importer.
- **Security:** Secrets stored in Vercel project settings (encrypted). Needs service role key + OpenDataSoft API key (if required) injected via environment variables.
- **Logging:** Vercel captures execution logs (accessible in dashboard). For persistent metrics we can POST back to Supabase.
- **Pros:**
  - Native to existing deployment (no new infrastructure).
  - Simple YAML configuration and easy rollback.
  - Auto scales; minimal DevOps overhead.
- **Cons/Risks:**
  - 10-minute maximum execution per function. Full multi-slice import may exceed this once we add all countries.
  - Cold-start latency; limited concurrency (1 run at a time).
  - Less suited for long-running jobs unless we split country slices into separate schedules.

### Option B – Supabase Scheduled Function
- **How it works:** create a Supabase function or edge runtime script triggered by Supabase Scheduler (cron). The function calls the importer logic (rewritten to run inside Supabase environment or as HTTP call to Vercel endpoint).
- **Security:** Service role key not needed if running inside Supabase; uses internal auth context. However, would need network access to OpenDataSoft (allowed).
- **Logging:** Supabase logs stored in platform; can write to custom tables easily.
- **Pros:**
  - Runs close to the database; fewer network hops.
  - Scheduler allows longer execution (up to 15 minutes) and better observability via Supabase logs.
  - Easier to persist job metadata inside Supabase (write to `import_runs` table during execution).
- **Cons/Risks:**
  - Requires deploying new Supabase Edge Function (TypeScript) or SQL function handling HTTP fetch + upsert.
  - Local development/test story more complex (need Supabase CLI or remote testing).
  - Slightly higher initial setup time compared to Vercel cron.

### Option C – External Runner (GitHub Actions / Self-hosted)
- **Pros:** Full control, long execution windows, can run heavy data processing.
- **Cons:** Introduces new infrastructure, diverges from MVP simplicity, additional secret management. Not recommended pre-launch.

---

## 3. Decision
**Adopt Option A (Vercel Scheduled Functions) for MVP automation**, with the following guardrails:
1. Schedule separate cron jobs per country slice (e.g., Mondays 02:00 CET for Sweden, Tuesdays for Norway, etc.) to stay within 10-minute window.
2. The cron-invoked function will `import` the shared `postal-code-importer` library to avoid duplication.
3. Logs remain in Vercel; for durability we append summary entries to Supabase via a lightweight insert after each run.
4. Maintain SOP for rotating Supabase service role key and updating Vercel environment variables immediately.

We will revisit Supabase Scheduler (Option B) post-launch if/when runtime limits or observability needs grow.

---

## 4. Implementation Plan (Vercel Cron)
| Step | Description | Owner | ETA |
| --- | --- | --- | --- |
| 1 | Create serverless function `api/cron/import-postal-codes.ts` that accepts country/slice params | Backend | Nov 18 |
| 2 | Refactor importer library to expose orchestrator usable by serverless function | Backend | Nov 18 |
| 3 | Add Vercel cron entries per country (staggered weekly schedule) | DevOps | Nov 19 |
| 4 | Update README/SOP with rotation + manual trigger instructions | Docs | Nov 19 |
| 5 | Deploy & monitor first automated run; capture metrics | Backend | Nov 20 |

**Monitoring & Alerts:**
- Add `console.error` output to surface errors in Vercel logs. Future enhancement: send failure hooks to Slack/email via Supabase `http_request` or Vercel integrations.

---

## 5. SOP (Standard Operating Procedure)
1. **Secret Rotation:**
   - Rotate Supabase service role key → update Vercel env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
   - Redeploy Vercel project to propagate cron runtime environment.
2. **Manual Trigger:**
   - Run `node scripts/import-postal-codes.js --country SE --max-records 100` locally to verify before/after rotation.
   - Optional: call the cron endpoint manually (`/api/cron/import-postal-codes?country=SE`).
3. **Failure Handling:**
   - Check Vercel deployment logs.
   - Re-run importer manually.
   - Document incident in `docs/daily/YYYY-MM-DD/AUTOMATION_RUNBOOK.md` (to be created on failure).

---

## 6. Follow-up Tasks
- [ ] Implement cron function + deploy.  
- [ ] Update `scripts/package.json` to include manual trigger script (if needed).  
- [ ] Draft basic runbook section in upcoming `AUTOMATION_RUNBOOK.md`.  
- [ ] Evaluate Supabase Scheduler after launch for longer-term ingestion reliability.

---

**Decision Owner:** Product/Engineering  
**Decided:** November 17, 2025  
**Next Review:** Post-launch retrospective (January 2026 or earlier if cron limits hit).
