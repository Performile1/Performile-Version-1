# Cascade Agent Operating Guide

**Version:** 2025-11-11  
**Scope:** Performile Platform (Spec-Driven Framework)  
**Owner:** Cascade (GPT-5)  

---

## 1. Purpose
This guide keeps the AI assistant aligned with Performile's Spec-Driven Development Framework after the transition from Claude. It captures non-negotiable rules, preferred workflows, and coding style so that future work stays consistent and compliant.

---

## 2. Core Principles
1. **Validate First, Code Second, Never Assume** — Database is the source of truth. Always validate real schema before planning or writing code.
2. **Spec-Driven Implementation** — No coding without an approved spec that records validation outputs, scope, success criteria, and rollback strategy.
3. **Additive-Only Database Changes** — New tables, columns, indexes, functions, and RLS policies may be added using `IF NOT EXISTS`; altering or dropping existing structures requires explicit written approval and rollback plans.
4. **Supabase + Vercel Conventions** — Follow existing serverless handler template, Supabase auth context, UUID primary keys, and TIMESTAMPTZ columns.
5. **Launch Discipline** — Work must support the current five-week MVP launch plan; avoid feature creep and document any deviation.

### 2.1 Canonical Framework Reference
- Full rulebook: `docs/daily/2025-11-08/SPEC_DRIVEN_FRAMEWORK_COMPLIANCE.md`. Treat it as the single source of truth for every rule (#1–#32) and update cadence details.
- Always consult that document before changing process, adding migrations, or adjusting enforcement checklists.
- If the framework evolves, update the reference here and append key deltas in the daily spec or master doc—do not duplicate entire sections inside `AGENT.md`.

### 2.2 Critical Rules at a Glance (Quick Reminder)
- **Rule #1 – Database Validation Before Every Sprint:** Run discovery queries, detect duplicates, and document findings before planning or coding.
- **Rule #2 – Never Change Existing Database:** Only additive changes with `IF NOT EXISTS`; any alteration requires explicit written approval plus rollback plan.
- **Rule #3 – Conform to Existing Schema:** Use exact table/column names and data types discovered during validation—no assumptions.
- **Rule #5 – Vercel Serverless Architecture:** APIs live in `api/`, use Supabase client with service role, enforce JWT auth, and follow the production handler template.
- **Rule #6 – Spec-Driven Implementation:** No implementation without an approved spec capturing objectives, validation results, success criteria, and rollback steps.
- **Rule #7 – Incremental Validation:** End each day with verification SQL, event logging checks, and documentation updates.
- **Rule #23 – Check for Duplicates Before Building:** Search codebase and schema for existing tables/APIs/components to reuse before creating anything new.
- **Rule #29 – Launch Plan Adherence:** Stay within the 5-week MVP scope; defer non-launch work unless explicitly reprioritized.

---

## 3. Required Workflow (Per Feature or Sprint)

### 3.1 Planning
- Create or update the feature spec in `docs/specs/` using the standard template.
- Run database validation queries (table discovery, column structure, foreign keys, sample data).
- Document actual schema results inside the spec.
- Review Hard Rules checklist with the user and obtain explicit approval before implementation.

### 3.2 Implementation
- Re-run relevant validation queries at the start of each coding session.
- Follow the approved spec verbatim; if new requirements surface, pause and amend the spec first.
- Keep code changes additive and aligned with existing naming, types, and folder structure.
- For APIs, use the established Supabase service-role client pattern and enforce JWT-based auth where required.
- Commit incrementally with descriptive messages once changes are validated locally.

### 3.3 Verification & Close-Out
- Execute verification SQL to confirm new objects exist and RLS policies are active.
- Run automated tests and manual spot checks of APIs/UI flows involved.
- Update master, investor, and daily docs as applicable.
- Provide rollback scripts for every migration.
- Deliver a completion summary and next-step recommendations to the user.

---

## 4. Coding & Documentation Standards
- **TypeScript/React Frontend:** Use functional components, hooks, and existing utility patterns. Respect feature flags and fallbacks already in place.
- **Serverless APIs:** Keep handlers pure, validate HTTP methods, log errors, and return typed responses.
- **SQL Migrations:** Place in `database/migrations/` with timestamped filenames; use `CREATE ... IF NOT EXISTS`; enable RLS before adding policies.
- **Testing:** Add regression coverage when fixing bugs or introducing core features; prefer minimal, targeted tests over broad refactors.
- **Docs:** Master (`docs/current/`), investor (`docs/investors/`), and daily (`docs/daily/`) documents must mirror deployed reality.

---

## 5. Communication Guidelines
- Stay concise and action-focused in updates.
- Surface blockers immediately, especially when validation uncovers duplicate tables or schema conflicts.
- Cite relevant files and line ranges when referencing code in summaries.
- Acknowledge the Spec-Driven Framework memory when it informs decisions.

---

## 6. Prohibited Shortcuts
- No coding without prior validation and approved spec.
- No schema alterations (ALTER/DROP/RENAME) without user-approved justification and rollback plan.
- No divergence from Supabase/Vercel templates or auth requirements.
- No silent feature additions beyond the current launch scope.

---

## 7. Compliance Checklist (Use Daily)
- [ ] Spec exists and is up to date.
- [ ] Database validation executed today; results documented.
- [ ] No duplicate tables/columns detected.
- [ ] Changes remain additive-only.
- [ ] Supabase/Vercel conventions followed.
- [ ] Tests and verification queries complete.
- [ ] Documentation refreshed.
- [ ] Rollback steps prepared.
- [ ] User sign-off captured.

---

## 8. Escalation Protocol
If any hard rule will be broken or an assumption is required:
1. Pause implementation immediately.
2. Document findings, risks, and proposed alternatives.
3. Present summary to the user for explicit approval.
4. Proceed only after approval is logged inside the relevant spec or communication channel.

---

*End of guide — keep this file updated when processes evolve.*
