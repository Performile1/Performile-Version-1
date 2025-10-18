# 📅 PERFORMILE DAILY WORKFLOW SYSTEM

**Purpose:** Maintain development continuity and track progress systematically  
**Framework:** Spec-Driven Development  
**Version:** 1.0

---

## 🌅 START OF DAY ROUTINE

### 1. Review Yesterday's Work
```bash
# Read the latest master document
cat PERFORMILE_MASTER_V1.XX.md

# Check Git status
git status
git log --oneline -5

# Pull latest changes
git pull origin main
```

### 2. Review Priorities
- [ ] Read "Next Steps" section from master doc
- [ ] Check for blockers documented yesterday
- [ ] Review any pending decisions
- [ ] Check GitHub issues/PRs

### 3. Plan Today's Tasks
- [ ] Identify 3-5 main tasks for today
- [ ] Prioritize by impact and dependencies
- [ ] Estimate time for each task
- [ ] Set realistic goals

### 4. Environment Check
```bash
# Verify services are running
npm run dev  # Frontend
npm run api  # Backend

# Check database connection
# Test key endpoints
```

### 5. Create Task List
```markdown
## TODAY'S PRIORITIES (Oct XX, 2025)

### High Priority
1. [ ] Task 1 - Est: 2h
2. [ ] Task 2 - Est: 1.5h

### Medium Priority
3. [ ] Task 3 - Est: 1h

### Low Priority
4. [ ] Task 4 - Est: 30m

### Blockers
- None / [List any blockers]
```

---

## 🌙 END OF DAY ROUTINE

### 1. Commit All Changes
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: [description of work done]

- Bullet point 1
- Bullet point 2
- Bullet point 3"

# Push to remote
git push origin main
```

### 2. Create Next Version Master Doc
```bash
# Increment version number
# Example: V1.18 → V1.19

# Copy template
cp PERFORMILE_MASTER_V1.18.md PERFORMILE_MASTER_V1.19.md
```

### 3. Update Master Document

**Update these sections:**

#### Version History
```markdown
| Version | Date | Changes |
|---------|------|---------|
| V1.19 | Oct 19, 2025 | [Today's major changes] |
| V1.18 | Oct 18, 2025 | Phase 1 Complete, Claims System |
```

#### Development Status
```markdown
### Completion Breakdown

COMPLETED (XX%)  ← Update percentage
├── [Feature] (XX%)  ← Update if changed
```

#### Recent Achievements
```markdown
✅ **Oct 19, 2025:** [What you completed today]
✅ **Oct 18, 2025:** Phase 1 Dashboard Analytics Complete
```

#### Next Steps
```markdown
### Immediate Priorities (Next 7 Days)

1. **[Priority 1]** (Priority: HIGH)
   - Task 1
   - Task 2

2. **[Priority 2]** (Priority: MEDIUM)
   - Task 1
```

### 4. Document Decisions & Blockers

**Add to master doc:**
```markdown
## DECISIONS MADE TODAY

### Decision 1: [Title]
- **Context:** Why this decision was needed
- **Options Considered:** A, B, C
- **Decision:** Chose option B
- **Rationale:** Because X, Y, Z
- **Impact:** Affects [areas]

## BLOCKERS ENCOUNTERED

### Blocker 1: [Title]
- **Issue:** Description of blocker
- **Impact:** What it's blocking
- **Attempted Solutions:** What we tried
- **Status:** Unresolved / Resolved
- **Next Steps:** How to resolve
```

### 5. Update Feature Audit
```bash
# Update PERFORMILE_FEATURES_AUDIT_V1.XX.md
# Mark completed features with ✅
# Update in-progress features with current %
# Add any new features discovered
```

### 6. Create Daily Summary

**Add to master doc:**
```markdown
## DAILY SUMMARY - Oct XX, 2025

### Work Completed
- ✅ Feature X implemented
- ✅ Bug Y fixed
- ✅ Documentation Z updated

### Code Statistics
- Files changed: XX
- Lines added: +XXX
- Lines removed: -XX
- Commits: X

### Time Breakdown
- Development: Xh
- Testing: Xh
- Documentation: Xh
- Meetings: Xh

### Learnings
- Learning 1
- Learning 2

### Tomorrow's Focus
1. Priority task 1
2. Priority task 2
3. Priority task 3
```

---

## 📊 WEEKLY REVIEW (Friday EOD)

### 1. Calculate Weekly Progress
```markdown
## WEEK XX SUMMARY (Oct XX-XX, 2025)

### Completion Progress
- Start of week: XX%
- End of week: XX%
- Progress: +X%

### Features Completed
- ✅ Feature 1
- ✅ Feature 2

### Features In Progress
- 🔄 Feature 3 (XX%)
- 🔄 Feature 4 (XX%)

### Metrics
- Commits: XX
- Files changed: XX
- Lines of code: +XXX
- API endpoints added: X
- Database tables added: X
```

### 2. Update Roadmap
- [ ] Review Phase completion
- [ ] Adjust timeline if needed
- [ ] Reprioritize features
- [ ] Update stakeholders

### 3. Plan Next Week
```markdown
## NEXT WEEK PRIORITIES (Oct XX-XX, 2025)

### Goals
1. Complete [Feature X]
2. Start [Feature Y]
3. Fix [Critical Bug Z]

### Estimated Completion
- Feature X: XX%
- Feature Y: XX%
```

---

## 🔄 CONTINUOUS PRACTICES

### Throughout the Day

**Every 2 Hours:**
- [ ] Commit work in progress
- [ ] Test changes
- [ ] Update task list

**Before Lunch:**
- [ ] Review morning progress
- [ ] Adjust afternoon priorities

**After Lunch:**
- [ ] Quick standup (self-review)
- [ ] Focus on high-priority tasks

**Before Breaks:**
- [ ] Commit current work
- [ ] Document where you left off

---

## 📝 DOCUMENTATION RULES

### Always Follow Spec-Driven Framework
✅ Write specs before coding  
✅ Update docs with code changes  
✅ Keep master doc current  
✅ Document all decisions  
✅ Track all blockers

### Master Document Versions
- **V1.XX** = Daily updates
- **V2.XX** = Major milestone (Phase complete)
- **V3.XX** = Major release

### File Naming Convention
```
PERFORMILE_MASTER_V1.XX.md
PERFORMILE_FEATURES_AUDIT_V1.XX.md
PERFORMILE_GTM_STRATEGY_V1.XX.md
PERFORMILE_BUSINESS_PLAN_V1.XX.md
```

---

## 🎯 SUCCESS METRICS

### Daily Targets
- [ ] 3-5 tasks completed
- [ ] 2-3 commits pushed
- [ ] Documentation updated
- [ ] No critical bugs introduced

### Weekly Targets
- [ ] 1-2 features completed
- [ ] 10-15 commits
- [ ] +1-2% overall completion
- [ ] All docs up to date

### Monthly Targets
- [ ] 1 Phase milestone
- [ ] +5-10% overall completion
- [ ] Major feature release
- [ ] Comprehensive testing

---

## 🚨 EMERGENCY PROCEDURES

### Critical Bug Found
1. Stop current work
2. Create hotfix branch
3. Fix and test thoroughly
4. Deploy immediately
5. Document in master doc
6. Post-mortem analysis

### Blocker Encountered
1. Document blocker immediately
2. Try 3 different approaches
3. Research solutions (30 min max)
4. Ask for help if needed
5. Move to next task if stuck
6. Revisit with fresh perspective

### Production Issue
1. Assess severity
2. Notify stakeholders
3. Create incident report
4. Fix and deploy
5. Update monitoring
6. Document lessons learned

---

## 📚 REFERENCE LINKS

- **Master Doc:** [PERFORMILE_MASTER_V1.18.md](./PERFORMILE_MASTER_V1.18.md)
- **Features:** [PERFORMILE_FEATURES_AUDIT_V1.18.md](./PERFORMILE_FEATURES_AUDIT_V1.18.md)
- **Framework:** [SPEC_DRIVEN_DEVELOPMENT_FRAMEWORK.md](./SPEC_DRIVEN_DEVELOPMENT_FRAMEWORK.md)
- **GTM:** [PERFORMILE_GTM_STRATEGY_V1.18.md](./PERFORMILE_GTM_STRATEGY_V1.18.md)
- **Business:** [PERFORMILE_BUSINESS_PLAN_V1.18.md](./PERFORMILE_BUSINESS_PLAN_V1.18.md)

---

## 🤖 WINDSURF COMMANDS (Future Enhancement)

### Proposed Commands

```bash
# End of day automation
windsurf:end-of-day
  → Creates next version master doc
  → Updates completion percentages
  → Generates daily summary
  → Commits and pushes changes

# Start of day automation
windsurf:start-of-day
  → Reads yesterday's master doc
  → Shows priorities and blockers
  → Checks Git status
  → Creates today's task list

# Quick status check
windsurf:status
  → Shows current completion %
  → Lists today's completed tasks
  → Shows active blockers
  → Estimates time to next milestone
```

**Note:** These commands are proposed for future Windsurf IDE integration.

---

**Last Updated:** October 18, 2025  
**Next Review:** Weekly (Every Friday)  
**Owner:** Development Team
