# POSTAL CODE COVERAGE RECOMMENDATION – NOVEMBER 17, 2025

**Author:** Cascade (with WEEK 3 data team)  
**Week:** 3 – Day 1 (Re-entry after credential rotation)  
**Related Docs:**  
- `docs/current/PERFORMILE_MASTER_V4.3.md`
- `docs/daily/2025-11-11/END_OF_DAY_SUMMARY_WEEK3_DAY2.md`
- `docs/daily/2025-11-17/START_OF_DAY_BRIEFING.md`
- `scripts/lib/postal-code-importer.js`

---

## 1. Executive Summary
- The OpenDataSoft datasets we use (e.g., `geonames-postal-code`) enforce a 10,000 record pagination ceiling. Sweden alone nearly exhausts this cap (≈9,800 rows). The Nordics combined require ~35k postal codes.
- We must extend coverage without breaking the existing importer flow, preserving idempotent upserts and Supabase-first discipline.
- Recommended approach: **regional slicing of the current OpenDataSoft dataset (Option A)** with automation to cycle through region filters, combined with a fallback pipeline for direct CSV ingestion if the provider rate limits increase. Implementation requires dataset metadata audit, region taxonomy mapping, and importer enhancements to iterate slices.

---

## 2. Current State & Constraints
| Item | Status |
| --- | --- |
| Dataset in use | `geonames-postal-code` via OpenDataSoft search API |
| Importer | `scripts/lib/postal-code-importer.js` with CLI wrapper & service-role Supabase key |
| Batch size | 100 rows/request (default); loop stops at API 400 offset fault |
| Coverage today | Sweden only (~9,800 rows inserted). Other Nordics pending |
| Known limits | API returns HTTP 400 when `start >= 10000`; rate limits soft but uncharted |
| Data quality | Acceptable (latitude/longitude, municipality, county available) |
| Automation | Not yet scheduled (decision pending) |
| Logging | Console logs archived manually; no persistent sink |

---

## 3. Options Analysis

### Option A – Regional Slicing within OpenDataSoft (Recommended)
- **Approach:** Issue multiple API runs per country, refining by administrative region (e.g., Swedish counties, Finnish "maakunta"), each limited to ≤10k rows. Merge results via upsert.
- **Implementation Needs:**
  - Extend importer CLI with `--slice-field` & `--slice-values` (array of filters).
  - Build region taxonomy per country (`configs/postal-slices.json`).
  - Introduce dedupe guard (UPSERT handles, but track processed slices to avoid re-fetch).
  - Enhance logging to include slice identifier + record counts.
- **Pros:**
  - Reuses current infrastructure (no schema changes, no new vendor).
  - Maintains consistent data format.
  - Fast to implement (1.5–2 engineering days including testing).
- **Cons/Risks:**
  - Requires ongoing maintenance if region definitions change.
  - More API calls ⇒ potential throttling; monitor for 429 responses.
  - Slightly longer runtime (~5–7 minutes per full country).

### Option B – Switch to Official National Datasets (CSV / GeoJSON)
- **Examples:**
  - Sweden: `https://www.postnord.se/...` CSV exports
  - Finland: Paikkatieto (`Postinumeroalueet` GeoJSON)
- **Implementation Needs:**
  - New ingestion path (download file → transform → upsert).
  - Storage for large files (S3/GCS or Supabase storage bucket).
  - Schema alignment (field naming, coordinate formats).
- **Pros:**
  - Full coverage with fewer API calls.
  - Often richer metadata (population, area polygons).
- **Cons/Risks:**
  - Higher initial engineering effort (3–4 days per country).
  - Need to manage file hosting, versioning, checksum validation.
  - Legal review of licensing terms per dataset.
  - More complex automation (scheduled downloads + diffing).

### Option C – Third-Party Commercial API (e.g., HERE, Loqate)
- **Approach:** Purchase coverage from vendor with global postal data and robust API/pagination controls.
- **Pros:**
  - SLA-backed service, consistent schema, high data freshness.
  - Additional attributes (demographics, address validation).
- **Cons/Risks:**
  - Cost (monthly/annual licensing) – not aligned with current budget.
  - Vendor lock-in, contract negotiations, legal overhead.
  - Requires key management and potential quota monitoring.

---

## 4. Recommendation
- **Primary Path:** Implement **Option A** (regional slicing) immediately to unblock Week 3 deliverables and maintain momentum. The importer changes are incremental, and we can reuse the service-role workflow.
- **Secondary Path:** Start discovery for Option B (national datasets) to assess data richness and legal/licensing implications. Only proceed after slicing is in production, ensuring fallback exists if OpenDataSoft changes policy.
- **Avoid** commercial vendors (Option C) until post-launch due to budget focus on MVP.

---

## 5. Implementation Plan (Option A)
| Step | Description | Owner | ETA |
| --- | --- | --- | --- |
| 1 | Compile region taxonomies per Nordics (SE, NO, DK, FI, IS) | Data analyst | Nov 18 |
| 2 | Extend importer CLI (`--slice-config`) + config file support | Backend | Nov 18–19 |
| 3 | Update automation design (cron job iterates slices sequentially) | Backend | Nov 19 |
| 4 | Run staged imports (per country) and log counts | Backend | Nov 20 |
| 5 | Document SOP + metrics dashboard updates | Ops/Docs | Nov 20 |

**Monitoring:** Add summary stats to importer output (rows inserted, slices processed, API errors). Optionally persist to Supabase `import_runs` table later.

---

## 6. Data Quality & Schema Considerations
- No schema changes needed; existing columns support regional metadata.
- Ensure importer retains `postal_code`, `city`, `municipality`, `county`, `latitude`, `longitude`, `area_type`, `country` fields.
- Add optional telemetry (slice name) to logs; future enhancement could store in separate audit table.

---

## 7. Dependencies & Risks
| Risk | Mitigation |
| --- | --- |
| OpenDataSoft rate limiting (429) | Add exponential backoff; respect `requestDelayMs`. Consider caching slices locally if limits hit. |
| Region taxonomy drift | Schedule quarterly audit; store taxonomy in repo with source references. |
| Automation secrets | Ensure service-role key rotation SOP is updated before scheduling importer cron. |
| Dataset gaps | Cross-check counts against national statistics to detect missing regions. |

---

## 8. Next Steps & Decision Log
- ✅ Deliver this recommendation document (Nov 17).
- 🔄 Implement Option A enhancements in importer codebase.
- 🔄 Update automation plan (see forthcoming `AUTOMATION_DECISION.md`).
- 🔄 After slicing rollout, run full Nordic import and record final row counts.
- 🔄 Document learnings for PERFORMILE_MASTER_V4.4.

**Decision:** Proceed with regional slicing (Option A) immediately; begin research on national datasets as a medium-term enhancement.
