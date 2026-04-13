# Cystene Implementation Status

> **MANDATORY**: Never create migration files. The user creates and runs migrations themselves. Only add/modify model fields. DO NOT DELETE THIS RULE.
> **MANDATORY**: Never use agents or subagents for research. Always search and read files yourself directly. DO NOT DELETE THIS RULE.
> **MANDATORY**: Read `support/cystene/domain-architecture.md` before implementing any entity. It is the single source of truth for fields, enums, relationships, and design decisions. DO NOT DELETE THIS RULE.

---

## Architecture Reference

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

Prefix: `/cybersecurity`. All routes gated via `require_active_subscription`. Rate limiting inline on POST /start and POST /generate only.

### Utils (`server/apps/cybersecurity/utils/`)

- `dependency_utils.py` — `get_user_target()`, `require_active_subscription`, `get_user_organization_id()`
- `subscription_utils.py` — Tier constants (FREE/PRO/ENTERPRISE), limits, `is_service_active()`
- `rate_limiting_utils.py` — DragonflyDB sliding window, memory/dragonfly backends
- `encryption_utils.py` — Fernet encrypt/decrypt for Credential.encrypted_value
- `audit_utils.py` — model_to_dict, log_audit, query functions
- `scan_scheduler.py` — Background scheduler for ScanSchedule execution (60s interval, FOR UPDATE SKIP LOCKED)

### Scanners (`server/apps/cybersecurity/scanners/`)

12 scanners in 3 categories:
- **external/ (8):** port_scan, dns_scan, ssl_scan, web_scan, vuln_scan, api_scan, active_web_scan, password_audit_scan
- **internal/ (3):** host_audit_scan (SSH), cloud_audit_scan (AWS), ad_audit_scan (LDAP/AD)
- **upload/ (1):** mobile_scan (APK analysis)

### Rust Engine (`server/apps/cybersecurity/engine/`)

PyO3/maturin engine with 5 functions:
- `port_scan.rs` — Tokio async TCP connect scan
- `subdomain_enum.rs` — Rayon parallel DNS resolution
- `http_probe.rs` — Tokio parallel HTTP path checks
- `hash_crack.rs` — Rayon parallel SHA-1/SHA-256/MD5 wordlist cracking
- `banner_match.rs` — Rayon parallel regex bulk matching

Build: `maturin develop --release` (local) / `pip install ./apps/cybersecurity/engine` (production)
Deployment: `nixpacks.toml` includes `python313, rustc, cargo, gcc`

### Stripe (Cystene account `acct_1TFIscCgafRZki0X`)

- Pro ($49/mo) + Enterprise ($199/mo), FREE tier = no Stripe product
- Products created in test + live mode with metadata (tier, tier_order, features)
- Webhooks: `server.cystene.com/accounts/subscriptions/webhook`
- Customer Portal: switch plans, prorate, cancel

---

## Phase 0: Cleanup ✅ COMPLETE

Removed ecommerce from boot path (main.py, env.py, config.py). Kept `server/apps/ecommerce/` as reference. Renamed `client/src/app/(ecommerce)` to `_ecommerce`. Ports: server 8003, client 3003.

---

## Phase 1: Backend Foundation ✅ COMPLETE

9 entities in 3 domain-grouped model files (infrastructure_models.py, execution_models.py, discovery_models.py) + audit_models.py. Schemas and subrouters in domain subfolders (nexotype pattern). All utils implemented. Router wired in main.py. Migrations applied. 41 cybersecurity endpoints.

---

## Phase 2: Frontend Foundation ✅ COMPLETE

7-layer pipeline per entity (schemas → services → stores → providers → hooks → pages + components). Pattern from assetmanager.

- **49 module files:** 9 schemas + 9 services + 9 stores + 10 providers + 9 hooks + 3 components (sidebar, breadcrumb, providers wrapper)
- **29 page files:** Dashboard + 10 list pages + 5 create pages + 9 detail pages + 4 organization pages + layout
- Sidebar: org switcher, 5 groups (Organizations, Dashboard, Infrastructure, Scanning, Results)
- Dashboard: 6 stat cards, security score circle, severity breakdown bars, recent scans

---

## Phase 3: Scanners + Dispatcher ✅ COMPLETE

12 production scanners implemented. Dispatcher in `scan_job_subrouter.py`: POST /start → background task → asyncio.gather → fingerprint dedup (SHA-256) → bulk insert Finding + Asset → severity counts + security_score. Supports credential decrypt (Fernet), APK upload + URL download, active scan consent gating.

---

## Phase 4: Advanced Features

| # | Feature | Status |
|---|---|---|
| 4A | Scheduling — background loop, 60s interval, FOR UPDATE SKIP LOCKED, lifespan context manager | ✅ COMPLETE |
| 4B.1 | Reports — HTML/JSON generation service, 4 types (full, executive_summary, compliance, delta) | ✅ COMPLETE |
| 4C | Dashboard — backend summary endpoint + frontend stat cards/score/bars | ✅ COMPLETE |
| 4D | Rust Engine — PyO3, 5 functions, nixpacks deployment config | ✅ COMPLETE |
| 4H | Website — landing page, pricing, blog, legal, AI discoverability, deployed to Vercel | ✅ COMPLETE |
| 4B.2 | PDF/CSV export — ReportLab branded PDF + CSV on findings, assets, reports. ExportButton component. Cystene green-600 branding. | ✅ COMPLETE |
| 4D.2 | Python ↔ Rust engine integration — `try: import engine` fallback in port_scan.py + dns_scan.py. Tokio/Rayon when compiled, asyncio fallback. | ✅ COMPLETE |
| 4G | Target verification — DNS TXT, file upload (.well-known), meta tag. Auto-verify for IP targets. Enforcement on POST /start. | ✅ COMPLETE |
| 4E | External tool parsers — nmap XML, nuclei JSON → Finding/Asset dicts | ❌ |
| 4F | Notifications — email on critical findings, webhook to user-configured URL | ❌ |

---

## Done

- ✅ Repo bootstrapped from nudgio, Coolify PostgreSQL, DNS configured (server/client/www.cystene.com)
- ✅ Planning documents: domain-architecture.md, claude-code-handover.md, this file
- ✅ Rate limiting fix: removed from router level, applied inline on POST /start and POST /generate only
- ✅ Subscription page sort by price ascending (matching nexotype pattern)
- ✅ Stripe env vars fixed in Coolify (was pointing to Nudgio account)
- ✅ Python ↔ Rust engine integration: port_scan.py + dns_scan.py use `engine.*` when compiled, asyncio fallback when not
- ✅ PDF/CSV export: export_utils.py (ReportLab, green-600 branding), GET /export on findings + assets + reports, ExportButton component, export.utils.ts blob download
- ✅ Target verification: verification_utils.py (DNS TXT, file upload, meta tag), real POST /verify endpoint, token auto-generated at create, POST /generate-token, enforcement on POST /start (403 if not verified), IP targets auto-verify

---

## Next Up

- 🔴 **External tool parsers (4E)** — Import nmap XML / nuclei JSON scan results
- 🔴 **Notifications (4F)** — Email/Slack alerts on critical findings, webhook delivery

---

## Nice to Have

- 🟡 **MCP Server** — FastMCP wrapping Cystene API for LLM-driven scanning and triage
- 🟡 **Audit Trail Page** — Frontend for cybersecurity_audit_logs with diff view (follow Finpy pattern)

---

## Backlog

- 🔵 Multi-scanner comparison (delta report across N scans, not just last 2)
- 🔵 RBAC per organization (admin/viewer/scanner roles)
- 🔵 Bulk import targets (CSV upload)

---

## Lessons Learned

- **No `/api/v1/` prefix**: Routes are directly at `/cybersecurity/...`
- **No PG enums**: Use `String(50)` columns, Python `(str, Enum)` in schemas only, `.value` when writing to DB
- **Finding and Asset have NO BaseMixin**: Append-only scanner output, no soft delete
- **ScanJob.schedule_id uses SET NULL on delete**: Historical results survive schedule deletion
- **Coolify env vars override .env.production**: Always verify Stripe account ID prefix matches project
- **Local test subscriptions share production DB**: Test checkout creates real Subscription records

---

## Verification

1. `cd client && npx tsc --noEmit`
2. `cd client && npm run build`
3. Browser smoke check
