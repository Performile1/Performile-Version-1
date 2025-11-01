# 📅 DAILY DOCUMENTATION GUIDE

**Purpose:** Quick reference for updating documentation daily  
**Last Updated:** October 18, 2025

---

## 🌙 END OF DAY ROUTINE

### Step 1: Create New Date Folder
```bash
# Create folder for today's date
mkdir -p docs/YYYY-MM-DD

# Example for October 19, 2025
mkdir -p docs/2025-10-19
```

### Step 2: Copy Previous Version
```bash
# Copy all files from previous date
cp docs/2025-10-18/* docs/2025-10-19/

# Or copy specific files
cp docs/2025-10-18/PERFORMILE_MASTER_V1.18.md docs/2025-10-19/PERFORMILE_MASTER_V1.19.md
cp docs/2025-10-18/PERFORMILE_FEATURES_AUDIT_V1.18.md docs/2025-10-19/PERFORMILE_FEATURES_AUDIT_V1.19.md
```

### Step 3: Update Version Numbers
**In each file, update:**
- Version number (V1.18 → V1.19)
- Date (October 18 → October 19)
- File names in links

**Example:**
```markdown
# Before
**Date:** October 18, 2025, 7:45 PM UTC+2  
**Platform Version:** 1.18.0

# After
**Date:** October 19, 2025, 8:00 PM UTC+2  
**Platform Version:** 1.19.0
```

### Step 4: Update Content

**PERFORMILE_MASTER_V1.XX.md:**
- [ ] Update "Recent Achievements" section
- [ ] Update "Overall Completion" percentage
- [ ] Update "Next Steps" section
- [ ] Add today's work to "Version History"

**PERFORMILE_FEATURES_AUDIT_V1.XX.md:**
- [ ] Mark completed features with ✅
- [ ] Update in-progress features with new %
- [ ] Add any new features discovered
- [ ] Update "Known Issues" section

**Other files as needed:**
- Update GTM strategy if market changes
- Update business plan if financials change
- Update daily workflow if process changes

### Step 5: Update Main README
```bash
# Edit docs/README.md
```

**Update these sections:**
- Version number in header
- "Latest Documentation" links
- "Documentation Versions" section
- Add new date to archive list

**Example:**
```markdown
### 📅 Documentation Versions

### Date-Based Archive
- **[2025-10-19](2025-10-19/)** - V1.19 (Current) - [Today's changes]
- **[2025-10-18](2025-10-18/)** - V1.18 - Phase 1 Complete, Claims System
```

### Step 6: Commit and Push
```bash
# Stage all changes
git add docs/

# Commit with descriptive message
git commit -m 'docs: Update documentation to V1.19 (Oct 19, 2025)

- Updated master document with today progress
- Marked [Feature X] as complete
- Updated completion to XX%
- Documented [Decision/Blocker]'

# Push to remote
git push origin main
```

---

## 🌅 START OF DAY ROUTINE

### Step 1: Read Yesterday's Documentation
```bash
# Open yesterday's master document
cat docs/2025-10-18/PERFORMILE_MASTER_V1.18.md

# Focus on these sections:
# - Recent Achievements
# - Next Steps
# - Any documented blockers
```

### Step 2: Check Git Status
```bash
# Pull latest changes
git pull origin main

# Check status
git status

# View recent commits
git log --oneline -5
```

### Step 3: Plan Today's Work
Based on yesterday's "Next Steps" section, create today's task list.

---

## 📝 QUICK CHECKLIST

### Daily (End of Day)
- [ ] Create new date folder
- [ ] Copy and update master documents
- [ ] Increment version numbers
- [ ] Update completion percentages
- [ ] Document today's achievements
- [ ] Update main README
- [ ] Commit and push

### Weekly (Friday)
- [ ] Review week's progress
- [ ] Calculate weekly completion gain
- [ ] Update roadmap if needed
- [ ] Plan next week's priorities
- [ ] Archive old documentation

### Monthly
- [ ] Comprehensive audit
- [ ] Update all statistics
- [ ] Review and update business plan
- [ ] Update GTM strategy
- [ ] Major version increment (V2.0)

---

## 📂 FOLDER STRUCTURE

```
docs/
├── README.md                          # Main documentation index
├── DAILY_DOCUMENTATION_GUIDE.md       # This file
├── 2025-10-18/                        # Date-based folders
│   ├── PERFORMILE_MASTER_V1.18.md
│   ├── PERFORMILE_FEATURES_AUDIT_V1.18.md
│   ├── PERFORMILE_GTM_STRATEGY_V1.18.md
│   ├── PERFORMILE_BUSINESS_PLAN_V1.18.md
│   ├── PERFORMILE_DAILY_WORKFLOW.md
│   └── README_MASTER_DOCS.md
├── 2025-10-19/                        # Next day
│   ├── PERFORMILE_MASTER_V1.19.md
│   └── ...
├── current/                           # Legacy docs
├── guides/                            # User guides
├── technical/                         # Technical docs
└── archive/                           # Old versions
```

---

## 🎯 WHAT TO UPDATE DAILY

### Always Update
1. **Master Document** - Central hub, always current
2. **Features Audit** - Track completion percentages
3. **Main README** - Keep version links current

### Update When Changed
4. **GTM Strategy** - When market strategy changes
5. **Business Plan** - When financials/projections change
6. **Daily Workflow** - When process improves

---

## 💡 TIPS & BEST PRACTICES

### Version Numbering
- **V1.18 → V1.19** - Daily increments
- **V1.99 → V2.0** - Major milestone (Phase complete)
- **V2.99 → V3.0** - Major release

### Commit Messages
```bash
# Good
git commit -m 'docs: Update to V1.19 - Feature X complete, 70% done'

# Better
git commit -m 'docs: Update to V1.19 (Oct 19, 2025)

- Completed Feature X
- Updated completion to 70%
- Documented decision on Y
- Fixed blocker Z'
```

### File Naming
- Use consistent format: `PERFORMILE_[TYPE]_V1.XX.md`
- Date folders: `YYYY-MM-DD` format
- No spaces in filenames

### Documentation Quality
- ✅ Be specific and detailed
- ✅ Use consistent formatting
- ✅ Include dates and versions
- ✅ Link related documents
- ✅ Keep it up-to-date

---

## 🚨 COMMON MISTAKES TO AVOID

❌ **Don't skip version increments** - Always increment daily  
❌ **Don't forget to update README** - Keep main index current  
❌ **Don't leave broken links** - Update all file references  
❌ **Don't commit without testing** - Check all links work  
❌ **Don't forget to push** - Always push to remote

---

## 📞 QUICK REFERENCE

### File Locations
- **Latest docs:** `docs/YYYY-MM-DD/`
- **Main index:** `docs/README.md`
- **This guide:** `docs/DAILY_DOCUMENTATION_GUIDE.md`

### Key Commands
```bash
# Create folder
mkdir -p docs/YYYY-MM-DD

# Copy files
cp docs/OLD-DATE/* docs/NEW-DATE/

# Commit
git add docs/
git commit -m 'docs: Update to V1.XX'
git push
```

### Version Format
- **File:** `PERFORMILE_MASTER_V1.XX.md`
- **Folder:** `docs/YYYY-MM-DD/`
- **Version:** V1.XX (increment daily)

---

**Remember:** Documentation is as important as code. Keep it current, accurate, and comprehensive!

---

*Last Updated: October 18, 2025*  
*Next Review: Daily*
