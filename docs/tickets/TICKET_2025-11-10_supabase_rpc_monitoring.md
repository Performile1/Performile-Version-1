# TICKET: Supabase RPC Monitoring & Alerts

**Date Created:** November 10, 2025  
**Owner:** Platform Engineering  
**Priority:** High  
**Status:** Open

---

## 🎯 Objective
Implement monitoring and alerting for Supabase RPC calls involved in the checkout analytics and ranking pipeline, ensuring we detect failures or performance regressions early.

---

## 📌 Scope
- Functions: `update_courier_ranking_scores`, `save_ranking_snapshot`, `calculate_courier_selection_rate`, `calculate_position_performance`
- Invocations: Backend APIs (`log-courier-display`, `log-courier-selection`, `cron/update-rankings`)
- Environment: Production Supabase project

---

## ✅ Deliverables
1. **Logging Configuration**
   - [ ] Enable Supabase function execution logs for the four RPCs above
   - [ ] Tag logs with request context (courier_id, postal_code, source)

2. **Metrics & Dashboards**
   - [ ] Track invocation count, error count, average duration (5-min buckets)
   - [ ] Graph daily snapshot count vs. target (>= 1 per day)

3. **Alerting Rules**
   - [ ] Error rate > 5% over 10 minutes (Slack #alerts)
   - [ ] Average execution time > 2s over 5 minutes
   - [ ] No successful `save_ranking_snapshot` in 24 hours

4. **Runbook**
   - [ ] Document troubleshooting steps in `RUNBOOK_SUPABASE_RPC.md`
   - [ ] Include manual recovery commands (`SELECT update_courier_ranking_scores(NULL, NULL)`)

---

## 🛠️ Implementation Steps
1. Configure Supabase Log Drains to our monitoring provider (Datadog / Logflare)
2. Define metrics and dashboards (Datadog dashboards or Supabase Insights)
3. Create alert rules and link to on-call rotation
4. Update runbook and share with engineering Slack

---

## 📅 Timeline
- **Kick-off:** Nov 11, 2025  
- **ETA:** Nov 12, 2025 (EOD)

---

## 🤝 Dependencies
- Access to Supabase project settings
- Monitoring provider API keys (Datadog or alternative)
- Slack webhook / PagerDuty integration

---

## 🧾 Notes
- Ensure alerts differentiate between manual API triggers and cron job
- Add correlation IDs when calling RPCs from backend for traceability
- Consider adding success log to nightly cron to confirm snapshot creation
