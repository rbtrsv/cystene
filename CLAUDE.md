# Cystene

**Enterprise Security Posture Management (ESPM)** platform — not just a scanner. Users describe their infrastructure, scan it from the **outside** (network/web) AND the **inside** (SSH, cloud API keys, domain credentials), and get findings with business context, compliance mapping (CWE/OWASP/MITRE), and copy-pasteable remediation. Reports are audit-ready for SOC2 / ISO27001 / NIS2.

4th product in the Buraro Technologies portfolio. Name = cysteine (the amino acid forming disulfide bonds — biology's security bonds) + cys (cyber/system) + tene (Latin *tenere*, to hold). Domain: cystene.com.

## Map (monorepo)
- `server/` — FastAPI + async SQLAlchemy. **Work only in `apps/cybersecurity/`** — ignore the other apps (`accounts` is shared infra; `algobot`/`assetmanager`/`cryptobot`/`ecommerce`/`nexotype` are separate-domain references, NOT mounted).
- `client/` — Next.js 16 / React 19 product UI. App lives in `src/modules/cybersecurity/` + `src/app/(cybersecurity)/`.
- `website/` — separate Next.js marketing/landing site (deployed to Vercel).
- `support/` — docs, guidelines, prompts, to-do.

Inside `apps/cybersecurity/`: `models/` (split by domain) · `schemas/` · `subrouters/` (per-entity CRUD) · `services/` · `scanners/` (12 async scanners) · `engine/` (Rust/PyO3) · `utils/`.

## Architecture
Bootstrapped by copying **nudgio** (ecommerce). All Buraro projects share the same **15-layer pipeline** per entity: Model → Schema → Subrouter → Router → main.py → Zod → Endpoints → Service(fetch) → Store(Zustand) → Provider → Hook → Page. Read 2–3 existing examples and match the pattern before adding code.
- Full pipeline + patterns: `support/cystene/claude-code-handover.md` (§3, §7).
- **Domain single-source-of-truth** (entities, fields, enums, FKs, scanners, design decisions): `support/cystene/domain-architecture.md` — read before touching any entity.

### The 9 entities (3 domains)
FK build order: Infrastructure → Credential → ScanTarget → ScanTemplate → ScanSchedule → ScanJob → Finding → Asset → Report.
- **Infrastructure domain** (`models/infrastructure_models.py`): `Infrastructure` (what user owns + business context), `Credential` (Fernet-encrypted SSH/API/domain creds), `ScanTarget` (domain/IP/URL, ownership-verified before scanning).
- **Execution domain** (`models/execution_models.py`): `ScanTemplate` (which scanners + params), `ScanSchedule` (recurring), `ScanJob` (one execution; lifecycle + denormalized severity counts + `security_score` 0-100).
- **Discovery domain** (`models/discovery_models.py`): `Finding` (append-only, `fingerprint` dedup, compliance metadata, `remediation_script`), `Asset` (append-only, upsert), `Report` (CRUD, PDF/HTML/JSON).
- `models/mixin_models.py` = `BaseMixin` (timestamps, soft-delete, user audit). `models/audit_models.py` = `CybersecurityAuditLog` (immutable). **Finding/Asset/AuditLog do NOT inherit BaseMixin** (append-only/immutable).

### The 12 scanners (`scanners/`, plain async `run(target, params) -> dict`)
No ABC/orchestrator/factory — a `SCANNERS` dict in `scanners/__init__.py` + dispatcher in `scan_job_subrouter.py:run_scan_job()`.
- **external/ (8, no creds):** port_scan, dns_scan, ssl_scan, web_scan, vuln_scan, api_scan, active_web_scan (needs `active_scan_consent`), password_audit_scan.
- **internal/ (3, need Credential):** host_audit_scan (SSH), cloud_audit_scan (AWS), ad_audit_scan (LDAP, detection-only).
- **upload/ (1):** mobile_scan (APK — upload/URL, scan, delete immediately).
- Dispatch: POST `/scan-jobs/start` → create ScanJob(pending) → `asyncio.create_task(run_scan_job)` → return immediately. Background: decrypt creds (Fernet), `asyncio.gather(return_exceptions=True)`, SHA-256 fingerprint dedup (`is_new`/`first_found_job_id`), bulk insert, `security_score = 100 − penalties` (crit −15/high −10/med −5/low −2).

### Rust engine (`engine/`, PyO3/maturin) — IMPLEMENTED
5 functions (port_scan, subdomain_enum, http_probe, hash_crack, banner_match) using tokio/rayon. Python scanners `try: import engine` and use it when compiled, **asyncio fallback** when not. Build: `maturin develop --release` (local) / `pip install ./apps/cybersecurity/engine` (prod). `nixpacks.toml` adds `rustc, cargo, gcc`.

## Naming & conventions
- **Backend:** `snake_case` everywhere. Domain-grouped folders with suffix: `subrouters/{infrastructure,execution,discovery}_subrouters/`, `schemas/{...}_schemas/`.
- **Frontend:** `kebab-case` files, also domain-grouped: `modules/cybersecurity/{schemas,service,store,providers,hooks}/{discovery,execution,infrastructure}/`.
- **Field names identical across ALL layers** (SQLAlchemy → Pydantic → Zod → payloads). No camelCase conversion anywhere.
- **No PG enums** — `String(50)` columns; Python `(str, Enum)` in Pydantic only; `.value` when writing.
- Response wrapper: `{ success, data?, count?, error? }`. Soft delete via `deleted_at`/`deleted_by` (never hard DELETE). Audit via explicit `log_audit()` calls (not ORM listeners). Section separators: `# ===` / `// ===`.
- Pages use **hooks** — never import store/service directly. `@` alias for cross-module, relative paths intra-module.

## Commands
```bash
cd server && python manage.py runserver        # FastAPI/uvicorn :8003 (restart after editing service-layer code)
python manage.py makemigrations "msg" && python manage.py migrate   # Alembic via manage.py — HUMAN ONLY, never raw alembic
cd client && npm run dev                        # Next dev :3003;  type-check: npx tsc --noEmit
maturin develop --release                       # build Rust engine locally (from apps/cybersecurity/engine/)
```

## Hard rules
- **IMPORTANT: `DATABASE_URL` is PRODUCTION** (Hetzner 91.98.44.218:6037, db `cystene`, Coolify). One DB, no local DB. Destructive ops (reset/delete) → **ask the user first**. Read-only queries are fine.
- **IMPORTANT: never `git commit` / `git push` unless the user says so**, per-instance, every time. The user commits.
- **Migrations are HUMAN-ONLY.** LLM creates/modifies model files; the user runs `makemigrations`/`migrate`. Never create migration files.
- **NO subagents** for research or implementation — search and read files yourself, do all work directly.
- **Propose → Approve → Implement → Review.** Never modify files without explicit permission ("Ask → Allow → Modify"). One component fully before the next. Simple > complex. No MVP/"future phase"/tier language — build production-ready.
- Comments are sacred: never delete existing in-code comments; always add `# Why:` reasoning on non-obvious decisions; match the surrounding comment density (full JSDoc/docstrings on stores/services/schemas — never compact them).
- English in code (comments/logs/docstrings); Romanian in chat. Edit via Edit/Write tools, never Bash sed/python on source. Never move/rename user files without permission.

## Reality vs the architecture doc (don't get misled)
- **SurrealDB graph layer is documented but NOT implemented** — there is no `apps/cybersecurity/surrealdb/`. PostgreSQL is the only DB. Treat graph sections of `domain-architecture.md` as future design.
- Rust lives in `engine/` (not `rust/`). Client modules are domain-grouped subfolders, not the flat layout the doc's §5.2 shows. The handover doc's "port needs update" notes are stale — ports are already 8003/3003 and ecommerce is already off the boot path.

## Adjacent funnel: vibe-coded-app scanning
A "scan-your-vibe-coded-app" market exists (vibeappscanner.com, Wiz research, SafeWeave, Aikido). It's a **funnel**, not the product — Cystene stays a general ESPM platform. The plan: add a few app-layer external checks (`baas_scan` for Supabase/Firebase RLS exposure, secret-grep in JS bundles/source maps, client-side-auth detection, public-app fingerprint) + a "Vibe-Coded App" `ScanTemplate` preset bundling them. Full analysis + the Wiz 4-misconfig blueprint + gap table: `support/cystene/market-vibe-scanners.md`. Roadmap items live in `support/to-do/0_order.md` (Nice To Have / Backlog). MCP/CLI packaging (pattern: `nexotype/mcp`) is Long Term — UI-first. `readings/` (Black Hat Python/Rust source) feeds future scanners.

**Requirement — re-read before you reason (context gets compacted).** Long sessions get summarized and you WILL lose the exact model fields, file-type patterns, and conventions. Before reasoning about or editing any entity / scanner / pipeline code, RE-READ the relevant files first — do not work from half-remembered context. Minimum: ALL `server/apps/cybersecurity/models/*.py` for the entity (paramount), plus `support/prompts/coding-prompt.md` and the architecture guides `support/guidelines/arhitecture/general-llm-workflow.md` + `support/guidelines/arhitecture/type-of-files.md`. And when you write code, follow the recurring principles: **small, single-purpose, composable functions** — split long bodies into named helpers, don't over-fragment (`support/guidelines/small-composable-functions-guidelines.md`); **extendable + flexible**, generic over pointwise patches; **simple beats complex** — provide exactly what's needed, no extra complexity. If you are not certain of a field, a pattern, or a convention, open the file — never guess.

**Session governance:** `support/prompts/coding-prompt.md` governs the whole discussion (Propose→Approve→Implement→Review, no speculative changes, pattern parity, comments preserved, simple > complex).

**Implementation approach (per feature):** **research first** — read `support/cystene/readings/` (Black Hat Python/Rust), `.examples/infosec-research/`, AND the live internet to verify the methodology is still current (it decays — e.g. Supabase blocked anon-key OpenAPI enumeration 2026-03-11; never assume) → think it through → short implementation plan → Propose→Approve → implement **one feature at a time**. Per feature decide **Rust (`engine/`, PyO3) vs plain Python** (Python if simple; Rust only when CPU/IO-heavy justifies it) and **external package vs from-scratch** (prefer writing it ourselves; add a dependency only when genuinely justified). **Implement full-stack, start to end — server AND client — and surface the feature in EVERY user-facing place (pickers, hardcoded help-texts/option lists, label maps, filters, displays), not just the enum; grep where a sibling is listed and add the new one to every hit.** Then verify: `compileall` + smoke + `tsc --noEmit` + a live/mock run. Full note in `support/to-do/0_order.md` (top of ROADMAP).

## Status (`support/to-do/0_order.md` is the live tracker)
Phases 0–3 ✅ (cleanup, backend foundation = 41 endpoints, frontend = 49 module + 29 page files, 12 scanners + dispatcher). Phase 4 mostly ✅ (scheduling, reports HTML/JSON, dashboard, Rust engine + Python integration, PDF/CSV export, target verification, website). **Remaining:** 4E external tool parsers (nmap XML / nuclei JSON), 4F notifications (email/webhook on critical findings).

## Subscription tiers (`utils/subscription_utils.py`)
FREE ($0, 1 target, external scanners) → PRO ($49/mo, +internal scanners, scheduling) → ENTERPRISE ($199/mo, +ad_audit, all features) → CUSTOM. 1 scanner execution = 1 credit. All routes gated by `require_active_subscription`; rate limiting inline on POST `/scan-jobs/start` + `/reports/generate` only (never router-level — GET must stay free). Stripe acct `acct_1TFIscCgafRZki0X`.

## Sibling references (read before building; DO NOT modify or mount)
- `server/apps/nexotype/` + `client/src/modules/nexotype/` — most mature (60 entities); **primary pattern reference**.
- `server/apps/ecommerce/` — nudgio origin (encryption_utils, rate_limiting, router gating patterns Cystene copied).
- `server/apps/assetmanager/` (finpy) — per-endpoint rate limiting, audit_utils, entity-access patterns.
