# Cystene — To-Do List (Ordered by Importance)

> **MANDATORY**: Never create migration files. The user creates and runs migrations themselves. Only add/modify model fields. DO NOT DELETE THIS RULE.
> **MANDATORY**: Never use agents or subagents for research. Always search and read files yourself directly. DO NOT DELETE THIS RULE.
> **MANDATORY**: Read `support/cystene/domain-architecture.md` before implementing any entity. It is the single source of truth for fields, enums, relationships, and design decisions. DO NOT DELETE THIS RULE.

---

## Coding Prompt (Always Follow)

Please answer without perceiving or mirroring what you think I want to hear.
Do not follow the global majority in your reply, and attempt to remain unbiased at all costs.
Do not introduce speculative changes.
Do not make assumptions.
I always want in code comments similar to the ones provided in the examples.
Do not delete the already existing in code comments explaining the code.
Follow my instructions exactly as stated, with no extra information or suggestions.
Please do not give me politically correct answer just for the sake of it.
I have a high level IQ so adjust the answers accordingly.
Never "fields omitted for brevity…" kind of thing.
If I give you some official docs, use the commands from those docs because they are up to date.
Do not suggest something that is not good coding practices.
Do not do workarounds, always do the right thing. If you do not know what is the right thing, ask me.
Follow a strict "Propose → Approve → Implement → Review" cycle for almost every change.
Always understand existing patterns before suggesting changes.
Plan and explain before implementing.
Please ask clarifying questions if you are not sure what to do next or there are more ways in which we can proceed.
Do not extend your authority over something I did not ask.
Present reasoning and approach first.
Never modify more files without my explicit permission. "Ask → Allow → Modify".
Stick to my rules and provide exactly what's needed without adding extra complexity.
Simple better that complex.
One component at a time: Complete each component fully before moving to next.
Clear communication: Explain planned changes and get approval.
Pattern consistency: Apply the exact same patterns established in other modules.
Quality over speed: Ensure each component is properly updated before proceeding.
Read all the files I give you entirely before even attempting to respond or suggest something.
When adding fields, models, or changes, always include a brief "Why:" explaining the reason it exists - not what it does, but why it's needed.

---

## MANDATORY RULES — Read Before Any Implementation

1. **Read 2-3 reference files BEFORE creating or modifying ANY file.** Read from nexotype, accounts, ecommerce (kept as reference), or finpy — both frontend and backend — to understand exact patterns, naming, comments, structure.

2. **File naming mirrors model names.** The backend model name dictates the file name across the ENTIRE stack:
   - Model: `ScanTarget` → backend: `scan_target_schemas.py`, `scan_target_subrouter.py` → frontend: `scan-targets.schemas.ts`, `scan-targets.service.ts`, `scan-targets.store.ts`, `scan-targets-provider.tsx`, `use-scan-targets.ts`
   - Model: `ScanTemplate` → backend: `scan_template_schemas.py`, `scan_template_subrouter.py` → frontend: `scan-templates.schemas.ts`, `scan-templates.service.ts`, `scan-templates.store.ts`, `scan-templates-provider.tsx`, `use-scan-templates.ts`
   - Model: `ScanSchedule` → backend: `scan_schedule_schemas.py`, `scan_schedule_subrouter.py` → frontend: `scan-schedules.schemas.ts`, `scan-schedules.service.ts`, `scan-schedules.store.ts`, `scan-schedules-provider.tsx`, `use-scan-schedules.ts`
   - Model: `ScanJob` → backend: `scan_job_schemas.py`, `scan_job_subrouter.py` → frontend: `scan-jobs.schemas.ts`, `scan-jobs.service.ts`, `scan-jobs.store.ts`, `scan-jobs-provider.tsx`, `use-scan-jobs.ts`
   - Model: `Finding` → backend: `finding_schemas.py`, `finding_subrouter.py` → frontend: `findings.schemas.ts`, `findings.service.ts`, `findings.store.ts`, `findings-provider.tsx`, `use-findings.ts`
   - Model: `Asset` → backend: `asset_schemas.py`, `asset_subrouter.py` → frontend: `assets.schemas.ts`, `assets.service.ts`, `assets.store.ts`, `assets-provider.tsx`, `use-assets.ts`
   - Model: `Report` → backend: `report_schemas.py`, `report_subrouter.py` → frontend: `reports.schemas.ts`, `reports.service.ts`, `reports.store.ts`, `reports-provider.tsx`, `use-reports.ts`
   - This applies to ALL file types: schemas, subrouters, services, stores, providers, hooks, pages.

3. **Frontend schema fields MUST match backend response fields exactly.** Same field names (snake_case), same types, same enum values.

4. **Never guess patterns.** If unsure how a file should look, find and read a working example first.

---

## Architecture Reference

**Domain architecture document:** `support/cystene/domain-architecture.md` — entities, fields, relationships, enums, scan engine, directory structure.

**Handover document:** `support/cystene/claude-code-handover.md` — 15-layer pipeline, tech stack, infrastructure, coding rules.

### Models (9 entities)

| # | Model | BaseMixin | Table | FK Dependencies |
|---|---|---|---|---|
| 1 | `Infrastructure` | YES | `infrastructure` | `organizations.id` |
| 2 | `Credential` | YES | `credentials` | `organizations.id`, `infrastructure.id?` |
| 3 | `ScanTarget` | YES | `scan_targets` | `users.id`, `organizations.id`, `infrastructure.id?` |
| 4 | `ScanTemplate` | YES | `scan_templates` | `scan_targets.id` |
| 5 | `ScanSchedule` | YES | `scan_schedules` | `scan_targets.id`, `scan_templates.id` |
| 6 | `ScanJob` | YES | `scan_jobs` | `scan_targets.id`, `scan_templates.id`, `scan_schedules.id` |
| 7 | `Finding` | NO | `findings` | `scan_jobs.id`, `scan_jobs.id` (first_found_job_id) |
| 8 | `Asset` | NO | `assets` | `scan_jobs.id` |
| 9 | `Report` | YES | `reports` | `scan_targets.id`, `scan_jobs.id` |

### Router (`server/apps/cybersecurity/router.py`)

Prefix: `/cybersecurity`. All routes gated via `require_active_subscription` + `enforce_rate_limit`.
No ungated routes in MVP (no external platform integrations, no public endpoints).

### Utils (`server/apps/cybersecurity/utils/`)

- `dependency_utils.py` — `get_user_target()`, `require_active_subscription`, `get_user_organization_id()`
- `subscription_utils.py` — Tier constants, limits, `is_service_active()`
- `scan_scheduler.py` — Background scheduler for ScanSchedule execution

### Scanners (`server/apps/cybersecurity/scanners/`)

- `port_scan.py` — `async def run(target, params)` (TCP connect, banner grabbing)
- `dns_scan.py` — `async def run(target, params)` (DNS records, subdomain discovery)
- `ssl_scan.py` — `async def run(target, params)` (certificate, cipher, protocol checks)
- `web_scan.py` — `async def run(target, params)` (security headers, misconfigurations, directory/file discovery)
- `vuln_scan.py` — `async def run(target, params)` (CVE matching against detected service versions)
- `api_scan.py` — `async def run(target, params)` (JWT analysis, GraphQL, CORS, rate limiting)
- `active_web_scan.py` — `async def run(target, params)` (detection-only: SQLi, XSS, LFI, cmd injection — requires consent)
- `password_audit_scan.py` — `async def run(target, params)` (brute force, default credentials, weak passwords)
- `host_audit_scan.py` — `async def run(target, params)` (privilege escalation, SUID, cron via SSH — requires Credential)
- `cloud_audit_scan.py` — `async def run(target, params)` (S3 buckets, IAM, security groups — requires Credential)
- `ad_audit_scan.py` — `async def run(target, params)` (AD enumeration, Kerberoasting — requires Credential)
- `mobile_scan.py` — `async def run(target, params)` (APK analysis — file upload, scan, delete)

---

## Phase 0: Cleanup (Remove Ecommerce from Boot Path) ✅ COMPLETE

**Goal:** Remove ecommerce from `main.py`, `env.py`, and `config.py` so the server boots clean with only accounts. Keep ecommerce directory as reference (do not delete).

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 0.1 | ✅ | `server/main.py` | Removed ecommerce_router, sync scheduler, ecommerce static mount. | Server boots clean. |
| 0.2 | ✅ | `server/migrations/env.py` | Replaced ecommerce import with cybersecurity. | Migrations work. |
| 0.3 | ✅ | `server/core/config.py` | Removed Shopify settings. | No missing env var errors. |
| 0.4 | ✅ | `server/main.py` | Port 8003 confirmed. | ✅ |
| 0.5 | ✅ | `client/package.json` | Port 3003 confirmed. | ✅ |
| 0.6 | ✅ | `client/src/modules/accounts/utils/api.endpoints.ts` | API_BASE_URL = 8003. | ✅ |
| 0.7 | ✅ | `server/apps/cybersecurity/__init__.py` | Created. | ✅ |
| 0.8 | ✅ | `server/apps/cybersecurity/models/__init__.py` | Created. | ✅ |

Also done: `client/src/app/(ecommerce)` renamed to `_ecommerce` (disabled in Next.js routing). Stripe env keys updated to Cystene account (`acct_1TFIscCgafRZki0X`). Old ecommerce migration files deleted.

---

## Phase 1: Backend Foundation (Models → Schemas → Subrouters → Router → main.py)

**Goal:** Build 9 entities in 3 domain-grouped model files + schemas/subrouters in domain subfolders (nexotype pattern). Test via FastAPI docs (`/docs`) after each domain.

**Reference files to read before implementing:**
- Model pattern: `server/apps/nexotype/models/clinical_models.py` (multiple classes in one domain file, FK relationships between them)
- Model re-export: `server/apps/nexotype/models/__init__.py` (from .clinical_models import * pattern)
- Schema pattern: `server/apps/nexotype/schemas/clinical/` (subfolder with per-entity schema files)
- Subrouter pattern: `server/apps/nexotype/subrouters/clinical/` (subfolder with per-entity subrouter files)
- Utils: `server/apps/ecommerce/utils/dependency_utils.py` (subscription gating), `server/apps/ecommerce/utils/encryption_utils.py` (Fernet encrypt/decrypt)
- Infrastructure pattern: `server/apps/assetmanager/models/entity_models.py` (Entity with type, owner, business context)

### Infrastructure Domain ✅ COMPLETE

| Step | Status |
|---|---|
| `models/mixin_models.py` — BaseMixin | ✅ |
| `models/infrastructure_models.py` — Infrastructure + Credential + ScanTarget | ✅ |
| `models/__init__.py` — re-exports all | ✅ |
| `schemas/infrastructure_schemas/` — 3 schema files (infrastructure, credential, scan_target) | ✅ |
| `subrouters/infrastructure_subrouters/` — 3 subrouter files (CRUD + verify endpoints) | ✅ |

### Execution Domain ✅ COMPLETE

| Step | Status |
|---|---|
| `models/execution_models.py` — ScanTemplate + ScanSchedule + ScanJob | ✅ |
| `schemas/execution_schemas/` — 3 schema files (scan_template, scan_schedule, scan_job) | ✅ |
| `subrouters/execution_subrouters/` — 3 subrouter files (CRUD + start/cancel + activate/deactivate) | ✅ |

### Discovery Domain ✅ COMPLETE

| Step | Status |
|---|---|
| `models/discovery_models.py` — Finding (NO BaseMixin) + Asset (NO BaseMixin) + Report | ✅ |
| `models/audit_models.py` — CybersecurityAuditLog (NO BaseMixin, immutable) | ✅ |
| `schemas/discovery_schemas/` — 3 schema files (finding, asset, report) | ✅ |
| `subrouters/discovery_subrouters/` — 3 subrouter files (findings triage, assets read-only, reports generate) | ✅ |

### Utils ✅ COMPLETE

| Step | Status |
|---|---|
| `utils/subscription_utils.py` — TIER_LIMITS, get_org_tier, is_service_active, credit counting | ✅ |
| `utils/rate_limiting_utils.py` — DragonflyDB sliding window, memory/dragonfly backends | ✅ |
| `utils/dependency_utils.py` — require_active_subscription, enforce_rate_limit, enforce_scan_credits | ✅ |
| `utils/encryption_utils.py` — Fernet encrypt/decrypt | ✅ |
| `utils/audit_utils.py` — model_to_dict, log_audit, query functions | ✅ |

### Router + Wiring ✅ COMPLETE

| Step | Status |
|---|---|
| `router.py` — Main router, gated behind subscription + rate limiting | ✅ |
| `server/main.py` — cybersecurity_router mounted | ✅ |
| `server/migrations/env.py` — cybersecurity models imported | ✅ |
| Migrations created + applied (`2026_04_07_0045-5df0fe077132_add_cybersecurity_models.py`) | ✅ |

### Stripe Setup ✅ COMPLETE

| Step | Status |
|---|---|
| Stripe CLI login to Cystene account (`acct_1TFIscCgafRZki0X`) | ✅ |
| Products created (Pro $49/mo, Enterprise $199/mo) — test + live | ✅ |
| Metadata set (tier=PRO/ENTERPRISE, tier_order, features) | ✅ |
| Webhooks created (test + live) — `server.cystene.com/accounts/subscriptions/webhook` | ✅ |
| Customer Portal configured (switch plans, prorate, cancel) | ✅ |
| .env updated with Cystene test keys + webhook secret | ✅ |
| .env.production updated with Cystene live keys + webhook secret | ✅ |

**Phase 1 Result:** Server boots with 41 cybersecurity endpoints. `/ping` returns 200. All models, schemas, subrouters, utils functional. Stripe configured.

### Phase 3 — First Scanner ✅ STARTED

| Step | Status |
|---|---|
| `scanners/__init__.py` — SCANNERS dict registry | ✅ |
| `scanners/external/common_ports.py` — TOP_100 + TOP_1000 port lists | ✅ |
| `scanners/external/service_signatures.py` — port→service mapping, banner probes, version extraction | ✅ |
| `scanners/external/port_scan.py` — TCP connect, banner grabbing, service ID, asyncio.Semaphore concurrency | ✅ |
| Tested on scanme.nmap.org — 2 findings (SSH + HTTP), 3 assets, 1.3s | ✅ |

**Remaining scanners (11):** dns_scan, ssl_scan, web_scan, vuln_scan, api_scan, active_web_scan, password_audit, host_audit, cloud_audit, ad_audit, mobile_scan

---

## Phase 2: Frontend Foundation (Schemas → Endpoints → Services → Stores → Providers → Hooks → Pages)

**Goal:** Build frontend modules for all 7 entities. Each entity follows the 7-layer frontend pipeline. After each entity: `tsc --noEmit` + `npm run build`.

**Reference files to read before each entity:**
- Frontend schema: `client/src/modules/nexotype/schemas/` (any schema file — Zod patterns, JSDoc headers, snake_case fields)
- Frontend endpoints: `client/src/modules/ecommerce/utils/api.endpoints.ts` or `client/src/modules/nexotype/utils/api.endpoints.ts`
- Frontend service: `client/src/modules/nexotype/service/` (any service file — fetchClient, CRUD functions, JSDoc)
- Frontend store: `client/src/modules/nexotype/store/` (any store file — Zustand + devtools + persist + immer)
- Frontend provider: `client/src/modules/nexotype/providers/` (any provider file — React Context wrapping Zustand)
- Frontend hook: `client/src/modules/nexotype/hooks/` (any hook file — combined context + store interface)
- Frontend page: `client/src/app/(ecommerce)/` (any page file — uses hook, never imports store/service directly)

### 2.0 Setup

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 2.0.1 | ❌ | `client/src/modules/cybersecurity/utils/api.endpoints.ts` | Create URL constants for all 7 entities: `/cybersecurity/scan-targets`, `/cybersecurity/scan-templates`, `/cybersecurity/scan-schedules`, `/cybersecurity/scan-jobs`, `/cybersecurity/findings`, `/cybersecurity/assets`, `/cybersecurity/reports`. | `tsc --noEmit` passes. |

### 2A. ScanTarget (Frontend — 7 layers)

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 2A.1 | ❌ | `client/src/modules/cybersecurity/schemas/scan-targets.schemas.ts` | Zod schemas mirroring backend. Include `TargetType`, `VerificationMethod` enums. | `tsc --noEmit` passes. |
| 2A.2 | ❌ | `client/src/modules/cybersecurity/service/scan-targets.service.ts` | Service functions: `getScanTargets()`, `getScanTarget(id)`, `createScanTarget()`, `updateScanTarget()`, `deleteScanTarget()`, `verifyScanTarget(id)`. | `tsc --noEmit` passes. |
| 2A.3 | ❌ | `client/src/modules/cybersecurity/store/scan-targets.store.ts` | Zustand store with devtools + persist + immer. | `tsc --noEmit` passes. |
| 2A.4 | ❌ | `client/src/modules/cybersecurity/providers/scan-targets-provider.tsx` | React Context wrapping Zustand store. | `tsc --noEmit` passes. |
| 2A.5 | ❌ | `client/src/modules/cybersecurity/hooks/use-scan-targets.ts` | Combined context + store interface hook. | `tsc --noEmit` passes. |
| 2A.6 | ❌ | `client/src/app/(cybersecurity)/scan-targets/page.tsx` | Page using hook. CRUD UI: list targets, create form, edit, delete. | `tsc --noEmit` + `npm run build` passes. |

### 2B. ScanTemplate (Frontend — 7 layers)

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 2B.1 | ❌ | `client/src/modules/cybersecurity/schemas/scan-templates.schemas.ts` | Zod schemas. Include `ScanType`, `PortRange`, `ScanSpeed` enums. | `tsc --noEmit` passes. |
| 2B.2 | ❌ | `client/src/modules/cybersecurity/service/scan-templates.service.ts` | Service functions: CRUD. | `tsc --noEmit` passes. |
| 2B.3 | ❌ | `client/src/modules/cybersecurity/store/scan-templates.store.ts` | Zustand store. | `tsc --noEmit` passes. |
| 2B.4 | ❌ | `client/src/modules/cybersecurity/providers/scan-templates-provider.tsx` | Provider. | `tsc --noEmit` passes. |
| 2B.5 | ❌ | `client/src/modules/cybersecurity/hooks/use-scan-templates.ts` | Hook. | `tsc --noEmit` passes. |
| 2B.6 | ❌ | `client/src/app/(cybersecurity)/scan-templates/page.tsx` | Page: list templates per target, create/edit with scan type checkboxes and parameter forms. | `tsc --noEmit` + `npm run build` passes. |

### 2C. ScanSchedule (Frontend — 7 layers)

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 2C.1 | ❌ | `client/src/modules/cybersecurity/schemas/scan-schedules.schemas.ts` | Zod schemas. Include `ScheduleFrequency` enum. | `tsc --noEmit` passes. |
| 2C.2 | ❌ | `client/src/modules/cybersecurity/service/scan-schedules.service.ts` | Service functions: CRUD + activate/deactivate. | `tsc --noEmit` passes. |
| 2C.3 | ❌ | `client/src/modules/cybersecurity/store/scan-schedules.store.ts` | Zustand store. | `tsc --noEmit` passes. |
| 2C.4 | ❌ | `client/src/modules/cybersecurity/providers/scan-schedules-provider.tsx` | Provider. | `tsc --noEmit` passes. |
| 2C.5 | ❌ | `client/src/modules/cybersecurity/hooks/use-scan-schedules.ts` | Hook. | `tsc --noEmit` passes. |
| 2C.6 | ❌ | `client/src/app/(cybersecurity)/scan-schedules/page.tsx` | Page: list schedules, create with frequency/cron, activate/deactivate toggle. | `tsc --noEmit` + `npm run build` passes. |

### 2D. ScanJob (Frontend — 7 layers)

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 2D.1 | ❌ | `client/src/modules/cybersecurity/schemas/scan-jobs.schemas.ts` | Zod schemas. Include `JobStatus` enum. | `tsc --noEmit` passes. |
| 2D.2 | ❌ | `client/src/modules/cybersecurity/service/scan-jobs.service.ts` | Service functions: `getScanJobs()`, `getScanJob(id)`, `startScan()`, `cancelScan(id)`. | `tsc --noEmit` passes. |
| 2D.3 | ❌ | `client/src/modules/cybersecurity/store/scan-jobs.store.ts` | Zustand store. | `tsc --noEmit` passes. |
| 2D.4 | ❌ | `client/src/modules/cybersecurity/providers/scan-jobs-provider.tsx` | Provider. | `tsc --noEmit` passes. |
| 2D.5 | ❌ | `client/src/modules/cybersecurity/hooks/use-scan-jobs.ts` | Hook. | `tsc --noEmit` passes. |
| 2D.6 | ❌ | `client/src/app/(cybersecurity)/scan-jobs/page.tsx` | Page: list jobs with status badges, "Start Scan" button, cancel running scans, severity summary bars. | `tsc --noEmit` + `npm run build` passes. |

### 2E. Finding (Frontend — 7 layers)

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 2E.1 | ❌ | `client/src/modules/cybersecurity/schemas/findings.schemas.ts` | Zod schemas. Include `Severity`, `FindingStatus`, `FindingCategory` enums. | `tsc --noEmit` passes. |
| 2E.2 | ❌ | `client/src/modules/cybersecurity/service/findings.service.ts` | Service functions: `getFindings()`, `getFinding(id)`, `updateFindingStatus(id, status)`. | `tsc --noEmit` passes. |
| 2E.3 | ❌ | `client/src/modules/cybersecurity/store/findings.store.ts` | Zustand store. | `tsc --noEmit` passes. |
| 2E.4 | ❌ | `client/src/modules/cybersecurity/providers/findings-provider.tsx` | Provider. | `tsc --noEmit` passes. |
| 2E.5 | ❌ | `client/src/modules/cybersecurity/hooks/use-findings.ts` | Hook. | `tsc --noEmit` passes. |
| 2E.6 | ❌ | `client/src/app/(cybersecurity)/findings/page.tsx` | Page: list findings with severity color coding, category filters, status dropdown for triage, detail expand. | `tsc --noEmit` + `npm run build` passes. |

### 2F. Asset (Frontend — 7 layers)

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 2F.1 | ❌ | `client/src/modules/cybersecurity/schemas/assets.schemas.ts` | Zod schemas. Include `AssetType`, `AssetConfidence` enums. | `tsc --noEmit` passes. |
| 2F.2 | ❌ | `client/src/modules/cybersecurity/service/assets.service.ts` | Service functions: `getAssets()`, `getAsset(id)`. Read-only. | `tsc --noEmit` passes. |
| 2F.3 | ❌ | `client/src/modules/cybersecurity/store/assets.store.ts` | Zustand store. | `tsc --noEmit` passes. |
| 2F.4 | ❌ | `client/src/modules/cybersecurity/providers/assets-provider.tsx` | Provider. | `tsc --noEmit` passes. |
| 2F.5 | ❌ | `client/src/modules/cybersecurity/hooks/use-assets.ts` | Hook. | `tsc --noEmit` passes. |
| 2F.6 | ❌ | `client/src/app/(cybersecurity)/assets/page.tsx` | Page: list discovered assets by type, filter by scan job, service details expand. | `tsc --noEmit` + `npm run build` passes. |

### 2G. Report (Frontend — 7 layers)

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 2G.1 | ❌ | `client/src/modules/cybersecurity/schemas/reports.schemas.ts` | Zod schemas. Include `ReportType`, `ReportFormat` enums. | `tsc --noEmit` passes. |
| 2G.2 | ❌ | `client/src/modules/cybersecurity/service/reports.service.ts` | Service functions: `getReports()`, `getReport(id)`, `generateReport()`, `deleteReport(id)`. | `tsc --noEmit` passes. |
| 2G.3 | ❌ | `client/src/modules/cybersecurity/store/reports.store.ts` | Zustand store. | `tsc --noEmit` passes. |
| 2G.4 | ❌ | `client/src/modules/cybersecurity/providers/reports-provider.tsx` | Provider. | `tsc --noEmit` passes. |
| 2G.5 | ❌ | `client/src/modules/cybersecurity/hooks/use-reports.ts` | Hook. | `tsc --noEmit` passes. |
| 2G.6 | ❌ | `client/src/app/(cybersecurity)/reports/page.tsx` | Page: list reports, "Generate Report" button, severity summary, view/download. | `tsc --noEmit` + `npm run build` passes. |

### 2H. Layout + Providers + Sidebar

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 2H.1 | ❌ | `client/src/app/(cybersecurity)/layout.tsx` | Create layout with `CybersecurityProviders` (nesting all 7 providers) + sidebar + breadcrumbs. Pattern from ecommerce layout. | `tsc --noEmit` + `npm run build` passes. |
| 2H.2 | ❌ | Sidebar component | Cybersecurity sidebar: Scan Targets, Scan Templates, Scan Schedules, Scan Jobs, Findings, Assets, Reports, Dashboard (Phase 4). | Sidebar renders with correct links. |

**Phase 2 completion test:** `tsc --noEmit` passes. `npm run build` succeeds. All 7 entity pages render. Navigation between pages works. CRUD operations work end-to-end (frontend → backend → database → response → UI update).

---

## Phase 3: Scanners (Python — 12 Production Scanners)

**Goal:** Implement 12 plain async scanner functions for comprehensive ESPM coverage — external scanning, internal audit, cloud audit, AD audit, password audit, and mobile analysis. Each scanner is independently testable. A simple dict-based dispatcher in the subrouter coordinates them per ScanJob.

> **Note:** The implementation details below are not set in stone. They are based on patterns from Black Hat Python (Seitz/Arnold) and Black Hat Rust (Kerkour), adapted for our async Python stack. The exact approach may change as we implement — treat these as starting points, not rigid specs.

**Reference files to read:**
- `.examples/infosec-research/scripts/lesson_01_recon/port_scanner.py` — basic port scanning pattern
- `.examples/infosec-research/scripts/lesson_05_network_service/network_scanner.py` — service detection, banner grabbing, vulnerability checking
- `support/cystene/domain-architecture.md` §4 — simplified scanners, no ABC/orchestrator
- `support/cystene/readings/BHPCode/Chapter02/` — TCP client, netcat (banner grabbing pattern), TCP server
- `support/cystene/readings/BHPCode/Chapter03/scanner.py` — raw socket host discovery, IP/ICMP header decoding
- `support/cystene/readings/BHPCode/Chapter05/` — web directory brute-forcing, WordPress mapping
- `support/cystene/readings/BHRCode/black-hat-rust-code/ch_02/tricoder/` — subdomain enumeration (crt.sh API), port scanning (TCP connect + timeout), rayon threadpool
- `support/cystene/readings/BHRCode/black-hat-rust-code/ch_03/tricoder/` — async port scan with tokio channels + bounded concurrency (`for_each_concurrent`)
- `support/cystene/readings/BHRCode/black-hat-rust-code/ch_04/tricoder/` — modular scanner architecture: trait-based HTTP vulnerability checks (git HEAD disclosure, .env disclosure, directory listing, etc.), each check is a small struct with name/description/scan

**Implementation notes from reference material:**

- **Port scanning** — TCP connect technique: `asyncio.open_connection(host, port)` with timeout (Python equivalent of Rust's `TcpStream::connect_timeout`). Use `asyncio.Semaphore` for bounded concurrency (like BHR ch_03's `for_each_concurrent`). Banner grabbing: send probe bytes, read response within timeout. Service identification from port number + banner content.
- **Subdomain enumeration** — crt.sh certificate transparency API: `GET https://crt.sh/?q=%25.{domain}&output=json`. Dedup entries, filter wildcards, verify each subdomain resolves via DNS. Pattern from BHR ch_02 `subdomains.rs`.
- **Web vulnerability checks** — Each check is a simple function: HTTP GET to a specific path, check response status + body content. Example from BHR ch_04: GitHeadDisclosure fetches `/.git/HEAD`, checks if body starts with `ref:`. Same pattern applies to `.env` disclosure, directory listing, exposed dashboards, etc. BHP ch_05 `bruter.py` shows threaded directory brute-forcing with wordlists.
- **Concurrency model** — Python async: `asyncio.gather()` to run scanners in parallel per job, `asyncio.Semaphore(max_concurrent)` within each scanner to limit concurrent connections. No thread pools needed — asyncio handles I/O-bound scanning well. For CPU-bound work (future Rust port scanner via PyO3), use `asyncio.to_thread()` or `run_in_executor()`.

### 3A. Port Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3A.1 | ❌ | `server/apps/cybersecurity/scanners/port_scanner.py` | Plain async function `async def scan_ports(target, params) -> dict`. TCP connect scan using `asyncio.open_connection()` with `asyncio.wait_for()` timeout. Banner grabbing: send minimal probe, read response. Service identification from port + banner. `asyncio.Semaphore(max_concurrent)` for concurrency control. Respects `port_range`, `scan_speed`, `timeout_seconds` from template params. Returns dict with `findings` (open ports, outdated services) + `assets` (hosts, services) + `errors` + `duration_seconds`. | Scan `scanme.nmap.org` → returns findings and assets. |

### 3B. DNS Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3B.1 | ❌ | `server/apps/cybersecurity/scanners/dns_scanner.py` | Plain async function `async def scan_dns(target, params) -> dict`. Uses `dns.resolver` (dnspython) via `asyncio.to_thread()`. Queries A, AAAA, MX, NS, TXT, CNAME, SOA records. Subdomain discovery via crt.sh API (pattern from BHR ch_02 `subdomains.rs`). Checks SPF/DKIM/DMARC in TXT records. Returns dict with `findings` (missing SPF/DKIM/DMARC, zone transfer possible) + `assets` (DNS records, discovered subdomains). | Scan any public domain → returns DNS findings and record assets. |

### 3C. SSL Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3C.1 | ❌ | `server/apps/cybersecurity/scanners/ssl_scanner.py` | Plain async function `async def scan_ssl(target, params) -> dict`. Uses `ssl` + `asyncio.open_connection()` with SSL context + `cryptography` for cert parsing. Certificate validation (expiry, hostname match, chain completeness, self-signed). Cipher enumeration via `SSLSocket.cipher()`. Protocol version detection (TLS 1.0/1.1/1.2/1.3). Returns dict with `findings` (expired cert, weak cipher, old TLS, missing HSTS) + `assets` (certificates with issuer, subject, validity dates). | Scan any HTTPS domain → returns SSL findings and certificate assets. |

### 3D. Web Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3D.1 | ❌ | `server/apps/cybersecurity/scanners/web_scanner.py` | Plain async function `async def scan_web(target, params) -> dict`. Uses `httpx.AsyncClient`. Security header checks: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`. Server info disclosure (`Server`, `X-Powered-By` headers). Redirect analysis (HTTP→HTTPS). Sensitive file checks (pattern from BHR ch_04): `/.git/HEAD`, `/.env`, `/.ds_store`, `/robots.txt` parsing. Returns dict with `findings` (missing headers, info disclosure, exposed files) + `assets` (technologies detected, server software). | Scan any HTTP/HTTPS URL → returns web findings and technology assets. |

### 3E. Vuln Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3E.1 | ❌ | `server/apps/cybersecurity/scanners/vuln_scanner.py` | Plain async function `async def run(target, params) -> dict`. Takes service versions from port_scan output, compares against local database of known vulnerable versions (dict of service→version→CVE). Produces KNOWN_VULNERABILITY findings with cve_id, cvss_score, cwe_id, owasp_category. Pattern from `network_scanner.py` KNOWN_VULNERABILITIES dict. | Run against target with known outdated services → returns CVE findings with severity. |

### 3F. API Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3F.1 | ❌ | `server/apps/cybersecurity/scanners/api_scanner.py` | Plain async function `async def run(target, params) -> dict`. Uses `httpx`. JWT analysis (decode without verification, check for weak signing algo like "none", expired tokens). GraphQL introspection detection (`POST /graphql` with introspection query). CORS misconfiguration (check Access-Control-Allow-Origin for wildcard). Common API paths discovery (/api/v1/, /swagger/, /openapi.json, /graphql). Rate limiting detection (send N requests, check for 429). | Scan target with API endpoints → returns API_VULNERABILITY findings. |

### 3G. Active Web Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3G.1 | ❌ | `server/apps/cybersecurity/scanners/active_web_scanner.py` | Plain async function `async def run(target, params) -> dict`. **Detection-only** using safe payloads. SQLi detection: inject `'` in query params, check for SQL error patterns in response. Reflected XSS: inject `<script>CYSTENE_XSS_TEST</script>`, check if reflected in response body. Command injection: inject `; echo CYSTENE_CMD_TEST`, check for marker in output. LFI: test `../../etc/passwd`, check for root: in response. Open redirect: test `?redirect=https://evil.com`, check Location header. **Only runs if template.active_scan_consent=True.** Pattern from sql_injector.py, cmd_injector.py. | Run against DVWA or known vulnerable target → detects injection points without exploiting them. |

### 3H. Password Audit Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3H.1 | ❌ | `server/apps/cybersecurity/scanners/password_audit_scanner.py` | Plain async function. Brute force on detected services (SSH, FTP, HTTP login). Default credentials check (admin/admin, root/root, common defaults). Weak password detection against wordlist. Uses `asyncssh` for SSH, `httpx` for HTTP. Pattern from hash_cracker.py, BHP Ch5-6. | Run against target with SSH/HTTP services → detects weak passwords. |

### 3I. Host Audit Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3I.1 | ❌ | `server/apps/cybersecurity/scanners/host_audit_scanner.py` | Plain async function. Connects via SSH using Credential entity. Checks: SUID binaries, weak file permissions, cron jobs, sudo config, exposed credentials in config/env/history. OS-aware: Linux (SUID, systemd) vs macOS (SIP, TCC, FileVault, LaunchAgents). Pattern from privesc_scanner.py, BHP Ch2/Ch10. | SSH into test host → detects privilege escalation vectors, weak permissions. |

### 3J. Cloud Audit Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3J.1 | ❌ | `server/apps/cybersecurity/scanners/cloud_audit_scanner.py` | Plain async function. Uses cloud API keys from Credential entity. AWS: `boto3` — S3 bucket exposure, IAM overprivileged roles, security groups, metadata service (IMDSv1), unencrypted storage, public snapshots, stale access keys. Azure: `azure-mgmt` — similar checks. Pattern from Lesson 11. | Run with AWS test credentials → detects public S3 buckets, overprivileged IAM. |

### 3K. AD Audit Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3K.1 | ❌ | `server/apps/cybersecurity/scanners/ad_audit_scanner.py` | Plain async function. Uses domain credentials from Credential entity. LDAP queries via `ldap3`: enumerate users, groups, computers. Kerberoastable accounts (SPN set, no preauth). ASREPRoastable accounts. Unconstrained delegation. Stale accounts (no login in 90+ days). Weak trust configs. Password policy audit. Pattern from Lesson 9, BHP Ch10. | Run with domain test credentials → detects Kerberoastable accounts, stale users. |

### 3L. Mobile Scanner

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3L.1 | ❌ | `server/apps/cybersecurity/scanners/mobile_scanner.py` | Plain async function. User uploads APK file. Uses `androguard` for analysis: manifest permissions, exported components, debuggable flag, hardcoded credentials (regex search in decompiled code), insecure data storage patterns, missing SSL pinning, backup flag. **File deleted immediately after scan.** Pattern from apk_analyzer.py, Lesson 8. | Upload test APK → detects hardcoded credentials, insecure permissions. File cleaned up after. |

### 3M. Scanner Dispatcher (in scan_job_subrouter)

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3M.1 | ❌ | `server/apps/cybersecurity/scanners/__init__.py` | Export scanner registry with all 12 scanners: `SCANNERS = {"port_scan": ..., "dns_enum": ..., "ssl_check": ..., "web_scan": ..., "vuln_scan": ..., "api_scan": ..., "active_web_scan": ..., "password_audit": ..., "host_audit": ..., "cloud_audit": ..., "ad_audit": ..., "mobile_scan": ...}`. | Python imports without error. |
| 3M.2 | ❌ | `server/apps/cybersecurity/subrouters/scan_job_subrouter.py` | `POST /start` endpoint: create ScanJob → `asyncio.create_task()` background task → iterate `scan_types` from template → call `SCANNERS[scan_type](target, params)` → `asyncio.gather()` all selected scanners → write findings + assets to DB → update job status + summary counts + security_score. If one scanner fails, continue others (partial results). **Check active_scan_consent before running active_web_scan. Check Credential exists before running host_audit/cloud_audit/ad_audit. Handle APK upload for mobile_scan.** | "Start Scan" creates job → returns immediately → scan runs in background → job status transitions pending → running → completed. |

**Phase 3 completion test:** Start a scan via frontend "Start Scan" button → job transitions through status lifecycle → findings and assets populated → severity summary counts + security_score correct. All 12 scanners independently callable. Active web scan blocked without consent. Internal scanners blocked without valid Credential. Mobile scan cleans up uploaded file.

---

## Phase 4: Advanced (Not Blocked by Phase 1-3)

**Goal:** Production features. Each item is independent and can be built in any order after Phase 3.

### 4A. Scheduling

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 4A.1 | ❌ | `server/apps/cybersecurity/utils/scan_scheduler.py` | Background scheduler: periodically checks `scan_schedules` for due schedules (`next_run_at <= now AND is_active = TRUE`). Creates `ScanJob` and calls orchestrator. Uses `SKIP LOCKED` pattern from ecommerce sync scheduler. | Scheduled scans trigger automatically at configured intervals. |
| 4A.2 | ❌ | `server/main.py` | Add scan scheduler to lifespan (startup/shutdown). | Scheduler starts with server, stops on shutdown. |

### 4B. Reports

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 4B.1 | ❌ | Report generation engine | Implement report generation: aggregate findings/assets for a target or scan job → generate HTML content → store in `reports.content`. Templates for each `report_type` (full, executive_summary, compliance, delta). | "Generate Report" produces readable HTML report with severity breakdown. |
| 4B.2 | ❌ | PDF export | Convert HTML report to PDF using `weasyprint` or `reportlab`. | Download PDF report. |

### 4C. Dashboard

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 4C.1 | ❌ | `client/src/app/(cybersecurity)/dashboard/page.tsx` | Summary dashboard: total targets, total scans, finding severity breakdown (chart), recent scan jobs, top vulnerabilities. | Dashboard renders with aggregated data. |
| 4C.2 | ❌ | Backend dashboard endpoint | `GET /cybersecurity/dashboard/summary` — aggregated stats across all user targets. | Returns correct counts and breakdowns. |

### 4D. Rust Performance Modules (PyO3)

**Location:** `server/apps/cybersecurity/rust/`
**Build tool:** maturin (compiles Rust → Python module via PyO3)
**Pattern:** Python scanner imports Rust module if available, falls back to pure Python if not compiled.
**Reference:** BHR Ch2-3 (rayon threadpool, tokio async), `support/cystene/readings/BHRCode/`

| # | Step | File | Action | Test |
|---|---|---|---|---|
| — | ❌ | `rust/port_scan_rs/` | Rust port scanner: tokio TcpStream + rayon for parallel connections. Compiled as Python module. Same return type as Python port_scan.run(). | Port scan 10-50x faster than pure Python asyncio. |
| — | ❌ | `rust/password_rs/` | Rust password brute force: hash computation (bcrypt, SHA, NTLM) in Rust. Called from password_audit_scan.py. | Hash cracking 100x+ faster than pure Python hashlib. |
| — | ❌ | `rust/banner_rs/` | Rust banner parsing: regex matching on large banner datasets. Called from vuln_scan.py for CVE version matching. | Banner parsing on 10k+ services in milliseconds. |
| — | ❌ | Python fallback | Each scanner checks `try: import cystene_rust_port_scan` → uses Rust if available, pure Python if not. | All scanners work without Rust compiled. Rust is optional performance boost. |

### 4E. External Tool Parsers

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 4E.1 | ❌ | `server/apps/cybersecurity/engine/parsers/nmap_parser.py` | Parse nmap XML output → list of Finding/Asset dicts. | Parse sample nmap XML → correct findings/assets. |
| 4E.2 | ❌ | `server/apps/cybersecurity/engine/parsers/nuclei_parser.py` | Parse nuclei JSON output → list of Finding/Asset dicts. | Parse sample nuclei JSON → correct findings/assets. |

### 4F. Notifications

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 4F.1 | ❌ | Email notifications | Send email when scan completes with critical/high findings. | Email received with finding summary. |
| 4F.2 | ❌ | Webhook notifications | POST scan results to user-configured webhook URL. | Webhook receives JSON payload. |

### 4G. Target Verification Implementation

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 4G.1 | ❌ | DNS TXT verification | Check if target domain has TXT record with verification token. | Verify target via DNS TXT record. |
| 4G.2 | ❌ | File upload verification | Check if target URL serves `/.well-known/cystene-verify.txt` with correct token. | Verify target via file upload. |
| 4G.3 | ❌ | Meta tag verification | Check if target URL homepage has `<meta name="cystene-verify" content="token">`. | Verify target via meta tag. |

### 4H. Website / Landing Page

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 4H.1 | ✅ | `website/` | Full rebrand from nudgio to cystene. Cybersecurity positioning, features, pricing, blog, legal, AI discoverability (llms.txt, robots.txt, JSON-LD, H1 audit). | Landing page deploys to Vercel at `www.cystene.com`. |

---

## ✅ Done

### Repo Setup & Infrastructure
- ✅ Cystene repo bootstrapped from nudgio, server config (port 8003/3003), Coolify PostgreSQL, .env files
- ✅ DNS: `server.cystene.com`, `client.cystene.com`, `www.cystene.com` configured
- ✅ CORS origins updated for cystene domains
- ✅ `config.py` updated: PROJECT_NAME, VERSION, DESCRIPTION, SERVER_URL, FRONTEND_URL

### Planning Documents
- ✅ `support/cystene/claude-code-handover.md` — comprehensive handover document
- ✅ `support/cystene/domain-architecture.md` — 7 entities, fields, relationships, enums, scan engine architecture
- ✅ `support/to-do/0_order.md` — phased execution plan (this document)

---

## Lessons Learned / Gotchas

### General
- **Cystene server has NO `/api/v1/` prefix**: Routes are directly at `/cybersecurity/...`. Never add `/api/v1/`.
- **No PG enums in DB**: Use `String(50)` columns, Python `(str, Enum)` in schemas only, `.value` when writing to DB.
- **Ecommerce directory kept as reference**: `server/apps/ecommerce/` is NOT deleted — it serves as a canonical reference for patterns, naming, comments, router gating. Just removed from boot path (main.py, env.py).
- **Target verification is required before scanning**: Legal/ethical requirement. Prevents scanning targets you don't own.
- **Finding and Asset have NO BaseMixin**: Append-only scanner output. No soft delete, no user audit fields. Same pattern as ecommerce's `APIUsageTracking` and `RecommendationAnalytics`.
- **ScanJob.schedule_id uses SET NULL on delete**: Historical scan results survive schedule deletion.
