# GPT-5 PILOT CHECKLIST

**Date Created:** November 10, 2025  
**Owner:** Engineering Enablement  
**Status:** Draft  
**Duration:** 1-week controlled pilot (Nov 11–Nov 17)

---

## 🎯 Goals
- Validate GPT-5 as a primary coding assistant without derailing MVP launch
- Measure productivity, quality, and adherence to spec-driven workflow
- Identify gaps in prompts, SOPs, and team training before full rollout

---

## 👥 Pilot Team
- **Primary developers:** 2 (checkout + pricing squads)
- **Reviewer:** 1 staff engineer to audit outputs
- **Project manager:** 1 to track metrics & cadence

---

## 🧠 Training & Onboarding
- [ ] Schedule 2-hour kickoff (tool overview, limitations, comparison vs Claude)
- [ ] Prepare prompt templates aligned with Spec-Driven framework
- [ ] Document escalation paths (when to revert to Claude)
- [ ] Train on security guidelines (no secrets, no production data)

---

## 📝 SOP Updates
- [ ] Create “GPT-5 Usage SOP” draft: prompts, retries, verification steps
- [ ] Update code review checklist to include AI-generated diff verification
- [ ] Add logging requirement: tag commits/issues with `AI=GPT5`
- [ ] Set up shared feedback log (Notion/Confluence page)

---

## 📊 Metrics to Track (Daily)
1. **Productivity**
   - Story points or ticket throughput
   - Time-to-completion compared to Week 2 baseline
2. **Quality**
   - Review comments per PR (count & severity)
   - Bugs/regressions attributed to AI suggestions
3. **Adherence**
   - % of tasks following Spec-Driven checks (DB validation, docs updated)
   - Number of SOP deviations (missing validation, missing tests)
4. **Sentiment**
   - Quick survey (1-5) on usefulness + friction points

---

## ⚙️ Environment Setup
- [ ] Enable GPT-5 workspace keys in VS Code / IDE
- [ ] Configure model fallback (Claude) for blocked tasks
- [ ] Set rate limits & usage caps (monitor spend)
- [ ] Update `.env.example` with new tool credentials (no hardcoding)

---

## ✅ Pilot Execution Checklist
- [ ] Kickoff meeting completed (recording stored)
- [ ] All pilot members granted access
- [ ] Daily standup includes GPT-5 usage updates
- [ ] Mid-week sync to review metrics & blockers
- [ ] End-of-week retrospective scheduled (Nov 18)

---

## 🧪 Evaluation Criteria
- GPT-5 delivers ≥ same quality with ≤ 10% time increase
- No critical bugs introduced by GPT-5 suggestions
- Developers report equal or better satisfaction vs Claude
- Spec-driven compliance >= 95%

---

## 🚨 Abort Conditions
- >2 critical issues traced to GPT-5 output
- Productivity drop >20% over 2 consecutive days
- Security incident related to AI usage

---

## 📦 Deliverables (Nov 18)
- Pilot summary report (metrics + qualitative feedback)
- Recommendation: adopt / continue pilot / revert to Claude
- Updated SOPs + training materials
- Risk mitigation plan if adopting GPT-5

---

**Next Action:** PM to slot kickoff on Nov 11 @ 10:00 AM and assign owners to metric tracking. ✅
