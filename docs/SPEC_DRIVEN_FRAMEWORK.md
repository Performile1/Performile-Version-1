# 🎯 Spec-Driven Development Framework

## 📜 **Hard Rules**

### **Rule #1: Never Hide Issues - Always Fix Root Cause**

**🚫 FORBIDDEN PRACTICES:**
- ❌ Returning empty data to hide missing functionality
- ❌ Skipping queries because of "complexity"
- ❌ Bypassing features with TODO comments
- ❌ Returning success when there's an error
- ❌ Using temporary workarounds without fixing root cause
- ❌ Commenting out broken code instead of fixing it
- ❌ Adding `if (false)` blocks to disable features

**✅ REQUIRED APPROACH:**
1. Identify the root cause of the problem
2. Provide multiple solution options with pros/cons
3. Explain trade-offs of each approach
4. Include database schema changes if needed
5. Include code implementation for each option
6. Let user choose the best solution
7. Implement the chosen solution completely
8. Test the fix end-to-end

---

### **Rule #2: Present Options, Not Assumptions**

**When facing a technical decision:**

**❌ WRONG:**
```typescript
// I'll just use this approach
const result = await simpleQuery();
```

**✅ CORRECT:**
```markdown
## Solution Options

### Option 1: Simple Query
- Pros: Easy, fast to implement
- Cons: Slower performance
- Time: 15 min

### Option 2: Optimized Query
- Pros: Better performance
- Cons: More complex
- Time: 45 min

### Option 3: Cached Results
- Pros: Fastest
- Cons: Stale data
- Time: 1 hour

Which do you prefer?
```

---

### **Rule #3: Complete Implementation**

**Every feature must include:**

1. **Database Schema**
   - Tables with proper types
   - Indexes for performance
   - Foreign keys for integrity
   - Constraints for validation

2. **Backend API**
   - Proper error handling
   - Input validation
   - Authentication/authorization
   - Logging

3. **Frontend UI**
   - User interface
   - Form validation
   - Error messages
   - Loading states

4. **Tests**
   - Unit tests
   - Integration tests
   - E2E tests (if applicable)

5. **Documentation**
   - API documentation
   - User guide
   - Developer notes

**No half-implementations. No TODOs. No "we'll add this later."**

---

### **Rule #4: Security First**

**Every endpoint must have:**
- ✅ Authentication check
- ✅ Authorization check (role-based)
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ Rate limiting (if public)

**❌ NEVER:**
```typescript
// TODO: Add authentication
const data = await query(req.query.userId);
```

**✅ ALWAYS:**
```typescript
const user = await verifyAuth(req);
if (!user) return res.status(401).json({ error: 'Unauthorized' });

const userId = validateUUID(req.query.userId);
if (user.role !== 'admin' && user.id !== userId) {
  return res.status(403).json({ error: 'Forbidden' });
}

const data = await query(userId);
```

---

### **Rule #5: Performance Matters**

**For every query, consider:**
- Are indexes needed?
- Can this be cached?
- Is pagination needed?
- Are we fetching too much data?
- Can we use a materialized view?

**Provide performance metrics:**
```markdown
## Performance Analysis

Current: 2.5s for 10k records
With indexes: 200ms for 10k records
With caching: 50ms for 10k records

Recommendation: Add indexes + cache for 1 hour
```

---

### **Rule #6: Error Handling**

**❌ WRONG:**
```typescript
try {
  const data = await query();
  return res.json({ data });
} catch (error) {
  return res.status(500).json({ error: 'Error' });
}
```

**✅ CORRECT:**
```typescript
try {
  const data = await query();
  return res.json({ success: true, data });
} catch (error) {
  console.error('Query failed:', error);
  
  if (error.code === '23505') {
    return res.status(409).json({ 
      success: false,
      error: 'Duplicate entry',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  return res.status(500).json({ 
    success: false,
    error: 'Failed to fetch data',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

---

### **Rule #7: Documentation**

**Every API endpoint must have:**

```typescript
/**
 * Get Claims Analytics Trends
 * 
 * Returns daily aggregated claims data for analytics charts.
 * Supports filtering by entity type (courier or merchant) and time period.
 * 
 * @route GET /api/analytics/claims-trends
 * @access Private (requires authentication)
 * @param {string} entity_type - 'courier' or 'merchant'
 * @param {string} entity_id - UUID of courier or merchant
 * @param {string} period - '7d', '30d', '90d', or '1y'
 * 
 * @returns {Object} response
 * @returns {boolean} response.success - Success status
 * @returns {Array} response.data - Array of daily claim aggregations
 * @returns {Object} response.meta - Metadata about the query
 * 
 * @example
 * GET /api/analytics/claims-trends?entity_type=merchant&entity_id=123&period=30d
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "date": "2025-10-25",
 *       "total_claims": 15,
 *       "approved_claims": 10,
 *       "rejected_claims": 2,
 *       ...
 *     }
 *   ],
 *   "meta": {
 *     "entity_type": "merchant",
 *     "entity_id": "123",
 *     "period": "30d",
 *     "days_returned": 30
 *   }
 * }
 */
export default async function handler(req, res) {
  // Implementation
}
```

---

## 🔄 **Problem-Solving Workflow**

### **Step 1: Identify the Problem**
```markdown
## Problem
Claims analytics returns empty data

## Root Cause
Claims table doesn't have direct courier_id/merchant_id columns

## Why It Matters
Dashboard shows no data, users can't track claims performance
```

### **Step 2: Research Solutions**
```markdown
## Solution Options

### Option 1: JOIN Query
- Database: No changes
- Code: Add JOIN to orders and stores tables
- Performance: 50-200ms
- Complexity: Medium
- Time: 30 min

### Option 2: Denormalize
- Database: Add courier_id and merchant_id columns
- Code: Update insert logic, backfill data
- Performance: 30-100ms
- Complexity: Low
- Time: 1-2 hours

### Option 3: Materialized View
- Database: Create materialized view
- Code: Query view, add refresh mechanism
- Performance: 10-20ms
- Complexity: High
- Time: 1-2 hours
```

### **Step 3: Present to User**
```markdown
## Recommendation
Option 1 (JOIN Query) because:
- No schema changes needed
- Works immediately
- Real-time data
- Easy to maintain

## Trade-offs
- Slightly slower than denormalized (but acceptable)
- More complex query (but well-optimized)

## Your Decision
Which option do you prefer? A, B, or C?
```

### **Step 4: Implement Completely**
```markdown
## Implementation Checklist
- [ ] Database migration (if needed)
- [ ] Database function/query
- [ ] Indexes
- [ ] API endpoint
- [ ] Error handling
- [ ] Input validation
- [ ] Authentication
- [ ] Tests
- [ ] Documentation
- [ ] Deployment
```

### **Step 5: Verify**
```markdown
## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing in dev
- [ ] Performance testing
- [ ] Security review
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production
```

---

## 📋 **Code Review Checklist**

Before committing any code, verify:

### **Functionality**
- [ ] Does it solve the actual problem?
- [ ] Are there any shortcuts or TODOs?
- [ ] Is error handling complete?
- [ ] Are edge cases handled?

### **Security**
- [ ] Is authentication required?
- [ ] Is authorization checked?
- [ ] Is input validated?
- [ ] Are SQL queries parameterized?
- [ ] Is sensitive data protected?

### **Performance**
- [ ] Are indexes in place?
- [ ] Is pagination used for large datasets?
- [ ] Are N+1 queries avoided?
- [ ] Is caching considered?

### **Code Quality**
- [ ] Is code readable and maintainable?
- [ ] Are functions small and focused?
- [ ] Are variables named clearly?
- [ ] Is there proper documentation?
- [ ] Are there tests?

### **Database**
- [ ] Are migrations reversible?
- [ ] Are foreign keys defined?
- [ ] Are constraints in place?
- [ ] Are indexes optimized?

---

## 🎯 **Examples**

### **Example 1: Claims Analytics (Current Issue)**

**❌ WRONG APPROACH:**
```typescript
// Skip materialized view - claims table doesn't have courier_id/merchant_id
// Would need complex join with orders table, so return empty for now
console.log('Claims trends: returning empty data');
return res.status(200).json({ success: true, data: [] });
```

**✅ CORRECT APPROACH:**
```markdown
## Problem
Claims analytics needs courier_id and merchant_id but claims table doesn't have them directly.

## Options
1. JOIN Query - 30 min, no schema changes
2. Denormalize - 1-2 hours, add columns
3. Materialized View - 1-2 hours, best performance

## Recommendation
Option 1 because it's fastest to implement and doesn't require schema changes.

## Implementation
[Full SQL query, TypeScript code, indexes, tests]

## User Decision
Which option do you prefer?
```

### **Example 2: Email Integration**

**❌ WRONG APPROACH:**
```typescript
// TODO: Integrate with email service
console.log('Sending email to', user.email);
return { success: true };
```

**✅ CORRECT APPROACH:**
```markdown
## Problem
Need to send emails for review requests, invitations, notifications.

## Options
1. SendGrid - $15/mo, 40k emails, easy setup
2. AWS SES - $0.10/1k emails, complex setup, unlimited
3. Resend - $20/mo, 50k emails, modern API

## Recommendation
Resend because:
- Modern API
- Good documentation
- React email templates
- Reasonable pricing

## Implementation
[Full code with error handling, retry logic, templates]

## User Decision
Which email service do you prefer?
```

---

## 🚀 **Getting Started**

### **For Every New Feature:**

1. **Understand the requirement**
   - What problem are we solving?
   - Who are the users?
   - What are the success criteria?

2. **Design the solution**
   - Database schema
   - API endpoints
   - UI components
   - Security considerations

3. **Present options**
   - Multiple approaches
   - Pros and cons
   - Time estimates
   - Performance implications

4. **Get approval**
   - Wait for user decision
   - Clarify any questions
   - Confirm approach

5. **Implement completely**
   - Database
   - Backend
   - Frontend
   - Tests
   - Documentation

6. **Deploy and verify**
   - Deploy to staging
   - Test thoroughly
   - Get user approval
   - Deploy to production

---

## 📚 **Additional Resources**

- [Database Design Best Practices](./DATABASE_BEST_PRACTICES.md)
- [API Security Checklist](./API_SECURITY_CHECKLIST.md)
- [Performance Optimization Guide](./PERFORMANCE_GUIDE.md)
- [Testing Strategy](./TESTING_STRATEGY.md)

---

## 🎓 **Remember**

> "The bitterness of poor quality remains long after the sweetness of meeting the schedule has been forgotten."
> 
> — Karl Wiegers

**Quality over speed. Proper solutions over shortcuts. Always.**

---

---

### **Rule #30: VERSION CONTROL - MAINTAIN DOCUMENT VERSIONS (HARD)**

**🎯 PURPOSE:**
Keep version history intact and track all changes systematically.

**📋 REQUIRED PRACTICES:**

**1. Version Numbering:**
- Use semantic versioning: `MAJOR.MINOR`
- MAJOR: Significant changes (e.g., V2.0 → V3.0)
- MINOR: Daily updates, fixes, additions (e.g., V3.0 → V3.1)
- Create new version file for each day's updates

**2. Version History:**
- Maintain complete version history in each document
- Document what changed in each version
- Include date and reason for update
- Never delete previous versions

**3. File Naming:**
- Format: `DOCUMENT_NAME_V{MAJOR}.{MINOR}.md`
- Examples:
  - `PERFORMILE_MASTER_V3.0.md` (morning)
  - `PERFORMILE_MASTER_V3.1.md` (end of day)
  - `PERFORMILE_MASTER_V3.2.md` (next day)

**4. When to Create New Version:**
- ✅ End of each day (minor version bump)
- ✅ Major strategic changes (major version bump)
- ✅ Significant feature additions
- ✅ Important fixes or updates
- ❌ NOT for typo fixes or formatting

**5. Version Control Block:**
Every document must include:
```markdown
**Document Version:** V3.1
**Last Updated:** October 30, 2025 (End of Day 4)
**Previous Version:** V3.0 (October 30, 2025 - Morning)
**Status:** [Current status]

### Version History:
- V1.0 (Date): Description
- V2.0 (Date): Description
- V3.0 (Date): Description
- V3.1 (Date): Description ⭐ NEW
```

**✅ CORRECT APPROACH:**
```bash
# End of Day 4
docs/2025-10-30/PERFORMILE_MASTER_V3.0.md (morning version)
docs/2025-10-30/PERFORMILE_MASTER_V3.1.md (EOD version) ⭐ NEW

# Day 5
docs/2025-10-31/PERFORMILE_MASTER_V3.2.md (new day)
```

**❌ WRONG APPROACH:**
```bash
# Overwriting same file
docs/2025-10-30/PERFORMILE_MASTER_V3.0.md (updated multiple times)
# Lost version history!
```

**🎯 BENEFITS:**
- ✅ Track all changes over time
- ✅ Revert to previous versions if needed
- ✅ Understand evolution of decisions
- ✅ Maintain audit trail
- ✅ Clear documentation history

**📊 ENFORCEMENT:**
- Required for all master documents
- Required for all specification documents
- Required for all strategy documents
- Optional for temporary/working documents

**🚨 VIOLATION CONSEQUENCES:**
- Loss of version history
- Confusion about what changed
- Unable to track decisions
- Difficulty debugging issues

**💡 EXAMPLE:**

**Day 4 Morning:**
- Create `PERFORMILE_MASTER_V3.0.md`
- Document strategic pivot to MVP

**Day 4 End of Day:**
- Create `PERFORMILE_MASTER_V3.1.md`
- Document 2 blocking issues fixed
- Update progress metrics
- Keep V3.0 intact

**Day 5:**
- Create `PERFORMILE_MASTER_V3.2.md`
- Document Day 5 progress
- Keep V3.0 and V3.1 intact

**REMEMBER:** Version control is not optional. It's a hard requirement for maintaining project integrity.

---

---

### **Rule #31: MANDATORY DOCUMENTATION - SPEC-DRIVEN FRAMEWORK (HARD)**

**🎯 PURPOSE:**
Every feature MUST have complete documentation before it's considered "done". No exceptions.

**📋 REQUIRED DOCUMENTS FOR EVERY FEATURE:**

#### **1. TECHNICAL_SPECIFICATION.md** (MANDATORY)
**Location:** `docs/daily/YYYY-MM-DD/TECHNICAL_SPECIFICATION.md`

**Required Sections:**
```markdown
1. OVERVIEW
   - Purpose (what problem does this solve?)
   - Scope with ALL 4 SYSTEM ROLES:
     * MERCHANT: How merchants interact
     * COURIER: How couriers interact  
     * ADMIN: How admins monitor/manage
     * CONSUMER: How consumers benefit
   - Business Model (revenue impact, cost savings)

2. ARCHITECTURE
   - System Components (all 4 roles with diagrams)
   - Data Flow (step-by-step)
   - Integration Points

3. DATABASE SCHEMA
   - Tables (with all columns, types, constraints)
   - Views (materialized and regular)
   - Triggers (with logic explanation)
   - Functions (with parameters and return types)
   - Indexes (for performance)
   - RLS Policies (for security)

4. API SPECIFICATIONS
   - All endpoints (GET, POST, PUT, DELETE)
   - Request/Response formats
   - Authentication requirements
   - Error responses
   - Rate limiting

5. FRONTEND SPECIFICATIONS
   - Component structure
   - State management
   - User flows (step-by-step)
   - UI/UX mockups or descriptions

6. SECURITY
   - Encryption (what and how)
   - RLS Policies (who can see what)
   - Input Validation (what's checked)
   - Authentication/Authorization

7. ERROR HANDLING
   - Frontend errors
   - Backend errors
   - Database errors
   - Network errors

8. PERFORMANCE
   - Database indexes
   - Caching strategy
   - Optimization techniques
   - Expected load times

9. TESTING REQUIREMENTS
   - Unit tests needed
   - Integration tests needed
   - E2E tests needed

10. DEPLOYMENT PROCEDURES
    - Migration steps
    - Rollback plan
    - Environment variables

11. MONITORING & ALERTS
    - Metrics to track
    - Alerts to set up
    - Health checks

12. FUTURE ENHANCEMENTS
    - Phase 2 features
    - Phase 3 features
    - Long-term roadmap
```

#### **2. TEST_PLAN.md** (MANDATORY)
**Location:** `docs/daily/YYYY-MM-DD/TEST_PLAN.md`

**Required Sections:**
```markdown
1. TEST OVERVIEW
   - Scope
   - Test Environment
   - Test Types

2. PRE-TEST CHECKLIST
   - Environment setup
   - Database verification
   - API endpoint verification

3. TEST CASES (minimum 15-20)
   - Navigation tests
   - CRUD operation tests
   - Security tests
   - Error handling tests
   - UI/UX tests
   - Performance tests
   - Each test case must have:
     * Test ID
     * Priority (HIGH/MEDIUM/LOW)
     * Steps
     * Expected Results
     * Status checkbox

4. TEST DATA
   - Test accounts
   - Test credentials
   - Sample data

5. DATABASE VERIFICATION QUERIES
   - SQL queries to verify data
   - Expected results

6. DEFECT TRACKING
   - Template for bugs
   - Known issues list

7. TEST COMPLETION CRITERIA
   - Exit criteria
   - Success metrics

8. TEST REPORT TEMPLATE
```

#### **3. INVESTOR_UPDATE.md** (MANDATORY)
**Location:** `docs/daily/YYYY-MM-DD/INVESTOR_UPDATE.md`

**Required Sections:**
```markdown
1. EXECUTIVE SUMMARY
   - Status (On Track / At Risk / Behind)
   - Week progress
   - Timeline status

2. STRATEGIC CONTEXT
   - Business model clarification
   - Why this feature matters
   - Market impact

3. BUSINESS VALUE DELIVERED
   - Revenue impact
   - Cost savings
   - Competitive advantage
   - Risk mitigation

4. TECHNICAL ACHIEVEMENTS
   - Database work (% complete)
   - Frontend work (% complete)
   - Backend work (% complete)
   - Code quality metrics

5. PROGRESS METRICS
   - Week goals vs actual
   - Launch timeline status
   - Velocity metrics

6. FINANCIAL IMPACT
   - Cost savings realized
   - ROI calculation
   - Revenue projections

7. RISK MANAGEMENT
   - Risks eliminated
   - Remaining risks
   - Mitigation plans

8. NEXT STEPS
   - Immediate priorities (48 hours)
   - Short-term (this week)
   - Medium-term (next 2 weeks)

9. LESSONS LEARNED
   - What went well
   - What could improve
   - Process improvements

10. SUCCESS CRITERIA
    - How we measure success
    - Completion checklist

11. STAKEHOLDER ACTIONS NEEDED
    - From investors
    - From team
```

#### **4. END_OF_DAY_SUMMARY.md** (MANDATORY)
**Location:** `docs/daily/YYYY-MM-DD/END_OF_DAY_SUMMARY.md`

**Required Sections:**
```markdown
1. SESSION SUMMARY
   - Time spent
   - Main objective
   - Status

2. COMPLETED TASKS
   - Database changes
   - Frontend changes
   - Backend changes
   - Documentation created

3. KNOWN ISSUES
   - Critical (P0)
   - High (P1)
   - Medium (P2)
   - With fix estimates

4. NEXT SESSION PRIORITIES
   - Immediate (first 30 min)
   - Short-term (next 2 hours)
   - Testing (next 4 hours)

5. CURRENT STATUS
   - Database: X% complete
   - Frontend: X% complete
   - Backend: X% complete
   - Testing: X% complete
   - Overall: X% complete

6. FILES MODIFIED/CREATED
   - List all files
   - Line counts

7. TECHNICAL NOTES
   - Important decisions
   - Database structure
   - API endpoints
```

#### **5. IMPLEMENTATION_GUIDES** (AS NEEDED)
**Location:** `docs/daily/YYYY-MM-DD/[FEATURE]_IMPLEMENTATION_GUIDE.md`

**When to Create:**
- Complex features
- Multi-step processes
- Configuration-heavy features

---

**🚨 ENFORCEMENT:**

**❌ FEATURE IS NOT COMPLETE WITHOUT:**
- [ ] TECHNICAL_SPECIFICATION.md
- [ ] TEST_PLAN.md
- [ ] INVESTOR_UPDATE.md
- [ ] END_OF_DAY_SUMMARY.md

**✅ WORKFLOW:**
1. Create TECHNICAL_SPECIFICATION.md FIRST (before coding)
2. Implement feature following spec
3. Create TEST_PLAN.md
4. Execute tests
5. Create INVESTOR_UPDATE.md
6. Create END_OF_DAY_SUMMARY.md
7. Commit all documents together

**🎯 QUALITY STANDARDS:**
- **Completeness:** 100% coverage of feature
- **Clarity:** Easy to understand for all stakeholders
- **Actionability:** Clear next steps
- **Investor-Ready:** Professional presentation
- **All 4 System Roles:** Merchant, Courier, Admin, Consumer documented

**📊 BENEFITS:**
- ✅ Investors always informed
- ✅ Team always aligned
- ✅ Features fully specified
- ✅ Testing comprehensive
- ✅ Knowledge preserved
- ✅ Onboarding easier
- ✅ Debugging faster

**🚨 VIOLATION CONSEQUENCES:**
- Feature marked as incomplete
- Cannot move to next feature
- Cannot deploy to production
- Technical debt accumulates

**💡 EXAMPLE:**

**November 3, 2025 - Courier Credentials Feature:**
```
docs/daily/2025-11-03/
├── TECHNICAL_SPECIFICATION.md (17.5 KB) ✅
├── TEST_PLAN.md (21.8 KB) ✅
├── INVESTOR_UPDATE.md (15.2 KB) ✅
├── END_OF_DAY_SUMMARY.md (8.5 KB) ✅
├── COURIER_INTEGRATION_SUMMARY.md (8.3 KB) ✅
├── COURIER_SETTINGS_ENHANCEMENT_COMPLETE.md (6.5 KB) ✅
└── FINAL_SESSION_SUMMARY.md (13.2 KB) ✅

Total: 90.9 KB of documentation
Status: COMPLETE ✅
```

**REMEMBER:** Documentation is not optional. It's a hard requirement for feature completion.

---

**Last Updated:** November 3, 2025 (End of Day)  
**Version:** 1.27 (added RULE #31 - Mandatory Documentation)  
**Previous Version:** 1.26  
**Total Rules:** 31 (19 Hard, 8 Medium, 4 Soft)  
**Status:** Active
