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

### Phase 3 — All 12 Scanners + Dispatcher ✅ COMPLETE

| Step | Status |
|---|---|
| `scanners/__init__.py` — SCANNERS dict registry (12 entries) | ✅ |
| `scanners/external/common_ports.py` — TOP_100 + TOP_1000 port lists | ✅ |
| `scanners/external/service_signatures.py` — port→service mapping, banner probes, version extraction | ✅ |
| `scanners/external/port_scan.py` — TCP connect, banner grabbing, service ID, asyncio.Semaphore concurrency | ✅ |
| `scanners/external/dns_scan.py` — DNS records, crt.sh subdomain enum, SPF/DKIM/DMARC checks | ✅ |
| `scanners/external/ssl_scan.py` — Certificate validation, TLS version testing, cipher analysis, HSTS | ✅ |
| `scanners/external/web_scan.py` — Security headers, server disclosure, sensitive file discovery | ✅ |
| `scanners/external/vuln_scan.py` — CVE matching against detected service versions | ✅ |
| `scanners/external/vuln_database.py` — Known CVEs by service (OpenSSH, Apache, nginx, etc.) | ✅ |
| `scanners/external/api_scan.py` — GraphQL introspection, CORS, rate limiting detection | ✅ |
| `scanners/external/active_web_scan.py` — Detection-only SQLi, XSS, cmd injection, LFI, open redirect | ✅ |
| `scanners/external/password_audit_scan.py` — Default credential check for SSH/FTP | ✅ |
| `scanners/internal/host_audit_scan.py` — SSH-based privilege escalation audit (SUID, cron, credentials) | ✅ |
| `scanners/internal/cloud_audit_scan.py` — AWS S3, IAM, security groups, CloudTrail, EBS encryption | ✅ |
| `scanners/internal/ad_audit_scan.py` — LDAP-based AD audit: Kerberoastable, ASREPRoastable, delegation, stale accounts, password policy (11 checks) | ✅ |
| `scanners/upload/mobile_scan.py` — APK analysis: manifest, permissions, code scanning, certificates | ✅ |
| Scanner dispatcher in `scan_job_subrouter.py` (Step 3M.2) — background task, asyncio.gather, fingerprint dedup, credential decrypt, security_score, partial results | ✅ |

**Phase 3 Result:** 12 scanners + dispatcher. POST /start creates job → runs scanners in background → writes findings + assets to DB → updates summary counts + security_score. Supports upload + URL download for mobile_scan. Internal scanners decrypt credentials via Fernet. Active web scan gated by consent flag.

---

## Phase 2: Frontend Foundation ✅ COMPLETE

**Goal:** Build frontend modules for all 9 entities (Infrastructure, Credential, ScanTarget, ScanTemplate, ScanSchedule, ScanJob, Finding, Asset, Report) + Organizations + Dashboard. Pattern from assetmanager (7-layer pipeline per entity).

### Module Layer (client/src/modules/cybersecurity/) ✅

| Layer | Files | Status |
|---|---|---|
| `utils/api.endpoints.ts` — URL constants for all 9 entities | 1 | ✅ |
| `schemas/infrastructure/` — infrastructure, credentials, scan-targets | 3 | ✅ |
| `schemas/execution/` — scan-templates, scan-schedules, scan-jobs | 3 | ✅ |
| `schemas/discovery/` — findings, assets, reports | 3 | ✅ |
| `service/infrastructure/` — CRUD + verify | 3 | ✅ |
| `service/execution/` — CRUD + activate/deactivate + start/cancel | 3 | ✅ |
| `service/discovery/` — list/detail + triage + generate/delete | 3 | ✅ |
| `store/infrastructure/` — Zustand + devtools + persist + immer | 3 | ✅ |
| `store/execution/` — including startScan, cancelScan, activate/deactivate | 3 | ✅ |
| `store/discovery/` — including updateFindingStatus, generateReport | 3 | ✅ |
| `providers/infrastructure/` — React Context + rehydrate + initialFetch | 3 | ✅ |
| `providers/execution/` | 3 | ✅ |
| `providers/discovery/` | 3 | ✅ |
| `providers/cybersecurity-providers.tsx` — 9 providers nested | 1 | ✅ |
| `hooks/infrastructure/` — context + store combined + helpers | 3 | ✅ |
| `hooks/execution/` | 3 | ✅ |
| `hooks/discovery/` | 3 | ✅ |
| `components/cybersecurity-sidebar.tsx` — org switcher + 5 groups + footer | 1 | ✅ |
| `components/cybersecurity-breadcrumb.tsx` — Cybersecurity root label | 1 | ✅ |

**Total module files: 49**

### Pages (client/src/app/(cybersecurity)/) ✅

| Entity | list | new | [id]/details | special | Status |
|---|---|---|---|---|---|
| Root dashboard | page.tsx | — | — | security score, severity bars, recent scans | ✅ |
| Organizations | page.tsx | new | [id]/details | [id]/subscription | ✅ |
| Infrastructure | page.tsx | new | [id]/details (tabs: details+edit+danger) | — | ✅ |
| Credentials | page.tsx | new | [id]/details (encrypted_value hidden) | — | ✅ |
| Scan Targets | page.tsx | new | [id]/details + verify button | — | ✅ |
| Scan Templates | page.tsx | new | [id]/details (scan type config) | — | ✅ |
| Scan Schedules | page.tsx | new | [id]/details + activate/deactivate | — | ✅ |
| Scan Jobs | page.tsx | — | [id]/details (status, score, cancel) | — | ✅ |
| Findings | page.tsx | — | [id]/details (triage, compliance, evidence) | severity/status filters | ✅ |
| Assets | page.tsx | — | [id]/details (service, banner, metadata) | — | ✅ |
| Reports | page.tsx | — | [id]/details (content, delete) | — | ✅ |
| Layout | layout.tsx | — | — | AccountsProviders → CybersecurityProviders → Sidebar | ✅ |

**Total page files: 28 + 1 layout = 29**

**Phase 2 Result:** 49 module files + 29 page files = 78 frontend files. Sidebar with org switcher, 5 groups (Organizations, Dashboard, Infrastructure, Scanning, Results). Dashboard with stat cards, security score circle, severity breakdown bars, recent scans. All CRUD entities have list + create + detail/edit + delete pages. Read-only entities (findings, assets, scan-jobs) have list + detail pages.

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

### 3A. Port Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3A.1 | ✅ | `server/apps/cybersecurity/scanners/external/port_scan.py` | TCP connect scan, banner grabbing, service ID, asyncio.Semaphore concurrency. Tested on scanme.nmap.org — 2 findings (SSH + HTTP), 3 assets, 1.3s. | ✅ |

### 3B. DNS Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3B.1 | ✅ | `server/apps/cybersecurity/scanners/external/dns_scan.py` | DNS records (A/AAAA/MX/NS/TXT/CNAME/SOA), crt.sh subdomain enum, SPF/DKIM/DMARC checks. Uses dnspython via asyncio.to_thread(). | ✅ |

### 3C. SSL Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3C.1 | ✅ | `server/apps/cybersecurity/scanners/external/ssl_scan.py` | Certificate validation, TLS version testing (1.0/1.1/1.2/1.3), cipher analysis, HSTS check. Uses ssl + cryptography via asyncio.to_thread(). | ✅ |

### 3D. Web Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3D.1 | ✅ | `server/apps/cybersecurity/scanners/external/web_scan.py` | Security headers (CSP, HSTS, X-Frame-Options, etc.), server disclosure, sensitive file discovery (/.git/HEAD, /.env, /admin, etc.), robots.txt parsing. Uses httpx. | ✅ |

### 3E. Vuln Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3E.1 | ✅ | `server/apps/cybersecurity/scanners/external/vuln_scan.py` + `vuln_database.py` | CVE matching against detected service versions. Local vulnerability database (OpenSSH, Apache, nginx, IIS, vsftpd, etc.). | ✅ |

### 3F. API Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3F.1 | ✅ | `server/apps/cybersecurity/scanners/external/api_scan.py` | GraphQL introspection, CORS misconfiguration, rate limiting detection, common API paths. Uses httpx. | ✅ |

### 3G. Active Web Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3G.1 | ✅ | `server/apps/cybersecurity/scanners/external/active_web_scan.py` | Detection-only: SQLi, XSS, cmd injection, LFI, open redirect. Requires active_scan_consent=True on template. Uses httpx. | ✅ |

### 3H. Password Audit Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3H.1 | ✅ | `server/apps/cybersecurity/scanners/external/password_audit_scan.py` | Default credential check for SSH (asyncssh) and FTP (asyncio). 11 common username:password pairs. | ✅ |

### 3I. Host Audit Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3I.1 | ✅ | `server/apps/cybersecurity/scanners/internal/host_audit_scan.py` | SSH-based privilege escalation audit. 8 checks: SUID binaries, writable dirs, shadow readable, cron jobs, env secrets, history creds, SSH keys, OS-specific (macOS SIP). Uses asyncssh. | ✅ |

### 3J. Cloud Audit Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3J.1 | ✅ | `server/apps/cybersecurity/scanners/internal/cloud_audit_scan.py` | AWS-first: S3 public buckets + encryption, IAM MFA + stale keys + password policy, security groups (SSH/RDP/all), CloudTrail logging, EBS encryption. Uses boto3 via asyncio.to_thread(). | ✅ |

### 3K. AD Audit Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3K.1 | ✅ | `server/apps/cybersecurity/scanners/internal/ad_audit_scan.py` | LDAP-based AD audit. 11 checks: Kerberoastable, ASREPRoastable, unconstrained delegation, constrained delegation, stale accounts, disabled accounts, privileged groups, password policy, password never expires, orphaned admins, reversible encryption. Uses ldap3 via asyncio.to_thread(). | ✅ |

### 3L. Mobile Scanner ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3L.1 | ✅ | `server/apps/cybersecurity/scanners/upload/mobile_scan.py` | APK analysis: manifest (debuggable, allowBackup, exported components, minSdkVersion), permissions (dangerous Android permissions), code scanning (hardcoded credentials, insecure HTTP, weak crypto, SSL bypass), certificate (debug cert, weak signature). Uses androguard via asyncio.to_thread(). Cleanup in finally block. | ✅ |

### 3M. Scanner Dispatcher (in scan_job_subrouter) ✅

| # | Step | File | Action | Test |
|---|---|---|---|---|
| 3M.1 | ✅ | `server/apps/cybersecurity/scanners/__init__.py` | SCANNERS dict registry with all 12 scanners. | ✅ |
| 3M.2 | ✅ | `server/apps/cybersecurity/subrouters/execution_subrouters/scan_job_subrouter.py` | `run_scan_job()` background task: asyncio.create_task → parse scan_types → build params from template + credential → asyncio.gather(return_exceptions=True) → fingerprint dedup (is_new, first_found_job_id) → bulk insert Finding + Asset → severity counts + security_score → status lifecycle (pending→running→completed/failed). Credential decrypt via encryption_utils. Mobile scan: apk_file_path (upload) + apk_url (URL download) + temp file cleanup. active_web_scan gated by consent. Internal scanners gated by credential. | ✅ |

**Phase 3 Result:** All 12 scanners + dispatcher fully implemented. POST /start creates job → returns immediately → scan runs in background → findings + assets written to DB → summary counts + security_score computed. Dependencies: `ldap3>=2.9.1` added via uv. `pyproject.toml` + `requirements.txt` updated.

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
