# Cystene Implementation Status

<!--
  HOW TO USE THIS FILE — PERMANENT STRUCTURE. NEVER DELETE OR REPLACE.

  Layout:
    1. Mandatory rules + reference-doc pointers (guardrails — never delete)
    2. Roadmap — Next Up / Nice To Have / Backlog / Long Term (always present, even if empty)
    3. Completed work (oldest → newest, archive of what shipped)
    4. Reference — Architecture / Lessons Learned / Verification (permanent)

  When to add a "COMPLETE" entry:
    - Substantial feature, refactor, or architecture decision
    - Bug fix only if it carries an insight worth remembering later
    - Skip: routine polish, comment passes, dependency bumps, formatting
    - Keep entries terse: 1–3 sentences + key file paths or commit SHAs

  Color legend for the roadmap sections below:
    🔴 Next Up        — active priority, working on now
    🟡 Nice To Have   — customers may ask, implement when time allows
    🔵 Backlog        — planned but not urgent
    🟣 Long Term      — future vision, no timeline

  Rules:
    - Move items between sections as they progress (e.g., 🔵 → 🔴 when starting)
    - When Next Up is empty, set to: 🔴 *(nothing planned — all major features complete)*
    - NEVER delete the four colored sections, even if empty
    - NEVER change the color/emoji system
    - The Reference block at the bottom (Architecture, Lessons Learned, Verification) is also permanent
-->

> **MANDATORY**: Never create migration files. The user creates and runs migrations themselves. Only add/modify model fields. DO NOT DELETE THIS RULE.
> **MANDATORY**: Never use agents or subagents for research. Always search and read files yourself directly. DO NOT DELETE THIS RULE.
> **MANDATORY**: Read `support/cystene/domain-architecture.md` before implementing any entity. It is the single source of truth for fields, enums, relationships, and design decisions. DO NOT DELETE THIS RULE.

**Reference docs:** `support/cystene/domain-architecture.md` (domain SoT) · `support/cystene/claude-code-handover.md` (full bootstrap) · `support/cystene/lessons-coverage-map.md` (Black Hat Python/Rust → scanners) · `support/cystene/market-vibe-scanners.md` (adjacent-market analysis + inspiration).

---

# ============================================================
# ROADMAP — Planned / Future Work
# ============================================================

> **Implementation approach (per `support/prompts/coding-prompt.md`):** Implementation is the priority — but we think each feature through first. Per feature: (1) write a short implementation plan, (2) Propose → Approve, (3) implement **one feature at a time**, fully, before the next. Per feature also decide: **Rust (`engine/`, PyO3) vs plain Python** — Python when simple, Rust only when CPU/IO-heavy justifies it (port scan, hashing, bulk regex). And decide **external package vs from-scratch** — we prefer writing everything ourselves; pull an external dependency only when genuinely justified (don't add deps casually). DO NOT DELETE THIS NOTE.

## Next Up

Strategic priority = ship the sellable **vibe-coded-app slice** (acquisition wedge) + complete **continuous-protection** monetization. Cystene stays a general ESPM platform — these are checks + a preset, not a separate product. Listed by priority; build one at a time.

- 🔴 **A2 — `baas_scan` scanner (Backend-as-a-Service data exposure)** — *highest value*: single most-cited vibe-coded vuln (leaks PII directly), and a self-contained external scanner with no deps. Supabase (anon key in JS → OpenAPI `/rest/v1/` table enum → per-table probe → flag sensitive fields) + Firebase (Firestore/RTDB rules), general/extensible. See `market-vibe-scanners.md` §4.3 + §5.
- 🔴 **A1 — Secret-grep in JS bundles + source maps** — second most-cited (exposed API keys → real $ damage). Extend `web_scan`: grep bundles + `.map` for 150+ secret patterns (OpenAI/Anthropic/Stripe/AWS/GCP/Supabase anon). New `Finding.category = "exposed_secret"`. See `market-vibe-scanners.md` §4.2.
- 🔴 **B2 — AI-fix-prompt format on `Finding.remediation_script`** — cheap, high-leverage; the signature VAS UX ("a fix list, formatted for your AI tool — that's the whole product"). Field already exists; standardize content as a copy-paste prompt block. **Set this convention early** so all 12 existing scanners + every new one emit it. See `market-vibe-scanners.md` §3.3.
- 🔴 **Notifications (4F)** — email/Slack on critical findings + webhook to user URL. Completes scheduling (4A, already shipped) → unlocks "continuous protection" monetization; scheduled scans are worthless without alerts. Low effort, cross-cutting.

## Nice To Have

Next in line after the Next Up slice. Cystene stays a general ESPM platform.

- 🟡 **A3 — Client-side auth logic check** — Wiz #1; detect hardcoded password comparison in JS + predictable `localStorage` auth flags. One tier below A1/A2 (parsing JS auth logic is more false-positive-prone). See `market-vibe-scanners.md` §4.1.
- 🟡 **B1 — "Vibe-Coded App" `ScanTemplate` preset (seed)** — the one-click "scan my vibe-coded app" funnel entry. Bundles A1/A2 (+ A3 when ready) + headers/ssl. Ship once A1/A2 land. See `market-vibe-scanners.md` §5.
- 🟡 **OWASP-Top-10-for-Vibe mapping** — tag vibe findings via existing `Finding.owasp_category` (A01 broken access, A02 secrets, A03 injection, A05 misconfig, A07 auth). Zero schema change — reports speak the vibe-coder's language. See `market-vibe-scanners.md` §6.
- 🟡 **B3 — Verifiable trust badge** — embeddable badge after a clean scan (zero critical/high). Ties to `security_score` + existing target verification. Marketing funnel. See `market-vibe-scanners.md` §3.4.
- 🟡 **Audit Trail Page** — Frontend for cybersecurity_audit_logs with diff view (follow Finpy pattern). Enterprise/compliance, not funnel.

## Backlog

- 🔵 **External tool parsers (4E)** — import nmap XML / nuclei JSON → Finding/Asset dicts. *Demoted from Next Up: power-user/aggregation integration — Cystene's target users (vibe-coders, SMBs) don't run nmap/nuclei. Promote if we pivot toward an enterprise "single pane of glass."*
- 🔵 Multi-scanner comparison (delta report across N scans, not just last 2)
- 🔵 RBAC per organization (admin/viewer/scanner roles)
- 🔵 Bulk import targets (CSV upload)
- 🔵 **Platform-specific finding category** — tag findings as Lovable/Bolt/v0/Cursor/Replit patterns via `Finding.finding_type`. Lets reports speak the vibe-coder's language. See `market-vibe-scanners.md` §3.6.
- 🔵 **A4 — Public-app exposure + platform fingerprint** — fingerprint vibe-platform markers (`lovable.app` etc.) + flag sensitive endpoints reachable without auth. See `market-vibe-scanners.md` §4.4.
- 🔵 **A5 — Auth coverage enhancement** — extend `api_scan`/`active_web_scan`: OAuth misconfig + session/auth-bypass + login brute-force. See `market-vibe-scanners.md` §5.
- 🔵 **A6 — IDOR / Broken Access Control probe** — OWASP A01 (#1 risk); the static-vs-dynamic gap URL scanners miss. NEW active check, gated like `active_web_scan` (consent): owned/sequential-ID tampering on API endpoints. See `market-vibe-scanners.md` §6.
- 🔵 **A7 — SSRF detection** — OWASP A10; extend `active_web_scan` with safe payloads (`169.254.169.254`, `localhost`). See `market-vibe-scanners.md` §6.
- 🔵 **A8 — Info disclosure / debug mode** — OWASP A05; extend `web_scan`: stack traces, DB schema, verbose errors, debug endpoints. See `market-vibe-scanners.md` §6.
- 🔵 **A9 — Client-side dependency exposure** — OWASP A06; extend `web_scan`: exposed `package.json`/lock, outdated front-end JS libs (retire.js-style), missing SRI, untrusted CDNs. See `market-vibe-scanners.md` §6.
- 🔵 **B5 — Breach checker util (HaveIBeenPwned)** — optional, low priority. Email exposure check, funnel free-tool.

## Long Term

- 🟣 **Free instant URL scan, no signup** — top-of-funnel entry for the vibe-coding-app segment. FREE tier + external scanners already cover the engine; needs a frictionless single-URL path. See `market-vibe-scanners.md` §3.7.
- 🟣 **MCP + CLI package** — separate `mcp/` package exposing scan/triage as MCP tools, callable directly from CLI (`cystene-cli scan <url>`, stdio `cystene-mcp`). **Implementation reference: `/Users/rbtrsv/Developer/main/nexotype/mcp`** (FastMCP + `click` CLI + httpx client + `[project.scripts]` console-scripts). Deprioritized: UI-first covers most users; revisit as the company grows. See `market-vibe-scanners.md` §5.
- 🟣 *(more to come — populate as the vision grows)*

---

# ============================================================
# COMPLETED WORK — Shipped, in production
# ============================================================

## Phase 0: Cleanup ✅ COMPLETE

Removed ecommerce from boot path (main.py, env.py, config.py). Kept `server/apps/ecommerce/` as reference. Renamed `client/src/app/(ecommerce)` to `_ecommerce`. Ports: server 8003, client 3003.

## Phase 1: Backend Foundation ✅ COMPLETE

9 entities in 3 domain-grouped model files (infrastructure_models.py, execution_models.py, discovery_models.py) + audit_models.py. Schemas and subrouters in domain subfolders (nexotype pattern). All utils implemented. Router wired in main.py. Migrations applied. 41 cybersecurity endpoints.

## Phase 2: Frontend Foundation ✅ COMPLETE

7-layer pipeline per entity (schemas → services → stores → providers → hooks → pages + components). Pattern from assetmanager.

- **49 module files:** 9 schemas + 9 services + 9 stores + 10 providers + 9 hooks + 3 components (sidebar, breadcrumb, providers wrapper)
- **29 page files:** Dashboard + 10 list pages + 5 create pages + 9 detail pages + 4 organization pages + layout
- Sidebar: org switcher, 5 groups (Organizations, Dashboard, Infrastructure, Scanning, Results)
- Dashboard: 6 stat cards, security score circle, severity breakdown bars, recent scans

## Phase 3: Scanners + Dispatcher ✅ COMPLETE

12 production scanners implemented. Dispatcher in `scan_job_subrouter.py`: POST /start → background task → asyncio.gather → fingerprint dedup (SHA-256) → bulk insert Finding + Asset → severity counts + security_score. Supports credential decrypt (Fernet), APK upload + URL download, active scan consent gating.

## Phase 4: Advanced Features ✅ COMPLETE (4F notifications open → Next Up; 4E parsers demoted → Backlog)

| # | Feature | Status |
|---|---|---|
| 4A | Scheduling — background loop, 60s interval, FOR UPDATE SKIP LOCKED, lifespan context manager | ✅ COMPLETE |
| 4B.1 | Reports — HTML/JSON generation service, 4 types (full, executive_summary, compliance, delta) | ✅ COMPLETE |
| 4B.2 | PDF/CSV export — `export_utils.py` (ReportLab, green-600 branding), GET /export on findings + assets + reports, ExportButton component, export.utils.ts blob download | ✅ COMPLETE |
| 4C | Dashboard — backend summary endpoint + frontend stat cards/score/bars | ✅ COMPLETE |
| 4D | Rust Engine — PyO3, 5 functions, nixpacks deployment config | ✅ COMPLETE |
| 4D.2 | Python ↔ Rust engine integration — `try: import engine` fallback in port_scan.py + dns_scan.py. Tokio/Rayon when compiled, asyncio fallback | ✅ COMPLETE |
| 4G | Target verification — `verification_utils.py` (DNS TXT, file upload .well-known, meta tag), real POST /verify, token auto-generated at create, POST /generate-token, enforcement on POST /start (403 if not verified), IP targets auto-verify | ✅ COMPLETE |
| 4H | Website — landing page, pricing, blog, legal, AI discoverability, deployed to Vercel | ✅ COMPLETE |

## Done — discrete items ✅

- ✅ Repo bootstrapped from nudgio, Coolify PostgreSQL, DNS configured (server/client/www.cystene.com)
- ✅ Planning documents: domain-architecture.md, claude-code-handover.md, this file
- ✅ Rate limiting fix: removed from router level, applied inline on POST /start and POST /generate only
- ✅ Subscription page sort by price ascending (matching nexotype pattern)
- ✅ Stripe env vars fixed in Coolify (was pointing to Nudgio account)

---

# ============================================================
# REFERENCE — Architecture / Lessons / Verification (permanent)
# ============================================================

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

## Lessons Learned

- **No `/api/v1/` prefix**: Routes are directly at `/cybersecurity/...`
- **No PG enums**: Use `String(50)` columns, Python `(str, Enum)` in schemas only, `.value` when writing to DB
- **Finding and Asset have NO BaseMixin**: Append-only scanner output, no soft delete
- **ScanJob.schedule_id uses SET NULL on delete**: Historical results survive schedule deletion
- **Coolify env vars override .env.production**: Always verify Stripe account ID prefix matches project
- **Local test subscriptions share production DB**: Test checkout creates real Subscription records

## Verification

1. `cd client && npx tsc --noEmit`
2. `cd client && npm run build`
3. Browser smoke check
