# Cystene — Claude Code Handover Document

Comprehensive context document for any Claude Code session working inside `/Users/rbtrsv/Developer/main/cystene/`.

---

## 1. Project Overview

**Cystene** is a cybersecurity scanning platform — the 4th product in the Buraro Technologies portfolio.

**Name meaning:** cysteine (the amino acid that forms disulfide bonds — the security bonds of biology) + cys (cyber/system) + tene (Latin *tenere* = to hold/maintain). Security that holds systems together.

**Domain:** cystene.com

**Current state:** Bootstrapped by copying nudgio (ecommerce recommendation platform). The project has a clean database, working accounts module, and the full nudgio ecommerce domain still present — to be replaced with cybersecurity scanning domain models, schemas, subrouters, and frontend modules.

---

## 2. Portfolio & Sibling Projects

All 4 projects share the same architecture (15-layer pipeline). They differ only in domain logic, ports, and database.

| Project | Path | Purpose | Frontend Port | Backend Port | Domain | DB Name |
|---|---|---|---|---|---|---|
| nexotype | `/Users/rbtrsv/Developer/main/nexotype/` | Biotech IP management | 3000 | 8000 | nexotype.com | nexotype |
| finpy | `/Users/rbtrsv/Developer/main/finpy/` | Finance / venture capital | 3001 | 8001 | finpy.tech | finpy |
| nudgio | `/Users/rbtrsv/Developer/main/nudgio/` | Ecommerce recommendations | 3002 | 8002 | nudgio.tech | nudgio |
| cystene | `/Users/rbtrsv/Developer/main/cystene/` | Cybersecurity scanning | 3003 | 8003 | cystene.com | cystene |

**Important:** When reading examples or reference code, use nudgio (closest sibling — cystene was copied from it), nexotype (most mature codebase, 60 entities), or finpy (finance domain) as canonical references.

---

## 3. Shared Architecture (15-Layer Pipeline)

Full reference document: `support/guidelines/general-llm-workflow.md`

The pipeline from SQLAlchemy model to React page, in order:

| Layer | Location | Purpose |
|---|---|---|
| 0. Core Infrastructure | `server/core/` | `config.py` (Settings), `db.py` (Base, async_session, get_session) |
| 0.5 Accounts Module | `server/apps/accounts/` | Auth, organizations, subscriptions, OAuth — shared by ALL domain apps |
| 1. Backend Model | `server/apps/{app}/models/{domain}_models.py` | SQLAlchemy ORM classes, `snake_case` fields |
| 1.5 Backend Mixins | `server/apps/{app}/models/mixin_models.py` | `BaseMixin` (created_at, updated_at, deleted_at, deleted_by, created_by, updated_by) |
| 2. Backend Schema | `server/apps/{app}/schemas/{domain}/{model}_schemas.py` | Pydantic 2 classes: Create, Update, Detail, ListResponse, Response, MessageResponse |
| 3. Backend Subrouter | `server/apps/{app}/subrouters/{domain}/{model}_subrouter.py` | FastAPI APIRouter — standard CRUD (GET list, GET detail, POST, PUT, DELETE) |
| 3.5 Backend Utils | `server/apps/{app}/utils/` | `crud_utils.py`, `filtering_utils.py`, `audit_utils.py`, `dependency_utils.py` |
| 3.6 Soft Delete Pattern | (in BaseMixin + crud_utils) | `deleted_at` / `deleted_by` — never hard DELETE |
| 4. Backend Router | `server/apps/{app}/router.py` | Mounts all subrouters with `include_router(prefix="/kebab-case-plural")` |
| 4.5 main.py | `server/main.py` | FastAPI app entry point, mounts all app routers, CORS middleware |
| 5. Frontend Schema | `client/src/modules/{app}/schemas/{domain}/{model}.schemas.ts` | Zod validation — mirrors backend exactly (snake_case fields) |
| 6. Frontend Endpoints | `client/src/modules/{app}/utils/api.endpoints.ts` | URL constants matching backend router prefixes |
| 7. Frontend Service | `client/src/modules/{app}/service/{domain}/{model}.service.ts` | Async functions: get, create, update, delete — uses fetchClient |
| 8. Frontend Store | `client/src/modules/{app}/store/{domain}/{model}.store.ts` | Zustand store with devtools + persist + immer |
| 9. Frontend Provider | `client/src/modules/{app}/providers/{domain}/{model}-provider.tsx` | React Context wrapping Zustand store |
| 10. Frontend Hook | `client/src/modules/{app}/hooks/{domain}/use-{models}.ts` | Combined context + store interface for pages |
| 11. Frontend Page | `client/src/app/{route-group}/{models}/page.tsx` | Uses hook — never imports store/service directly |
| 12. Migrations | `server/migrations/versions/` | **HUMAN-ONLY** — LLM never runs `makemigrations` or `migrate` |

---

## 4. Tech Stack

### Backend
- **Python 3.13+**
- **FastAPI** — async web framework
- **SQLAlchemy 2.0** — async ORM (`asyncpg` driver)
- **PostgreSQL** — primary database
- **Alembic** — migrations (via `manage.py` wrapper)
- **Pydantic 2** — request/response validation
- **Fernet** — symmetric encryption for stored credentials

### Frontend (Client)
- **Next.js 16** — React framework (Turbopack dev server)
- **React 19** — UI library
- **TypeScript** — type safety
- **Zustand** — state management (devtools + persist + immer middleware)
- **TanStack Form / TanStack Query** — form management and data fetching
- **Zod** — runtime schema validation
- **Radix UI** + **shadcn/ui** — component library
- **Tailwind CSS 4** — styling
- **Lucide React** — icons

### Website (Landing Page)
- **Next.js 16** — static site
- **Tailwind CSS 4** — styling
- **Vercel** — deployment

### Infrastructure
- **Hetzner VPS** — production server
- **Coolify** — Docker orchestration (server + client + PostgreSQL)
- **Vercel** — website deployment
- **Squarespace** — DNS management
- **Stripe** — billing/subscriptions

---

## 5. Infrastructure Configuration

### Hetzner Server
- **IP:** 91.98.44.218

### Coolify (Docker Orchestration)
- Manages server (FastAPI), client (Next.js), and PostgreSQL containers
- Server container runs on port 8003 internally
- Client container runs on port 3003 internally

### PostgreSQL
- **Port mapping:** 6036:5432 (internal), public port 6037
- **Database name:** cystene
- **Connection:** `postgresql+asyncpg://postgres:{password}@91.98.44.218:6037/cystene?ssl=require`

### DNS (Squarespace)
- `server.cystene.com` → 91.98.44.218 (Hetzner — FastAPI backend via Coolify)
- `client.cystene.com` → 91.98.44.218 (Hetzner — Next.js client via Coolify)
- `www.cystene.com` / `cystene.com` → Vercel (website/landing page)

### CORS Origins
```
http://localhost:3003
https://client.cystene.com
https://cystene.com
https://www.cystene.com
```

### Environment Files
- `server/.env` — database URL, CORS origins, JWT secrets, Stripe keys, OAuth credentials
- `client/.env.local` — `NEXT_PUBLIC_SERVER_URL` (should be `http://localhost:8003` for dev, `https://server.cystene.com` for production)

### Current Port Issues (Inherited from Nudgio Copy)
- `server/main.py` line 50: `uvicorn.run("main:app", port=8002, reload=True)` — **needs update to 8003**
- `client/package.json`: `"dev": "next dev --turbopack -p 3002"` — **needs update to 3003**
- `client/src/modules/accounts/utils/api.endpoints.ts`: `API_BASE_URL` fallback is `http://127.0.0.1:8002` — **needs update to 8002→8003**
- `.env` files have already been updated with correct cystene DB URL and CORS origins

---

## 6. Current State (What Exists)

Cystene was bootstrapped by copying the nudgio repository and updating database/DNS/environment configuration. Here is what exists and what needs to happen:

### Keep As-Is (Shared Infrastructure)
| Directory | Contents | Action |
|---|---|---|
| `server/core/` | `config.py` (Settings), `db.py` (Base, async_session) | Keep — already updated for cystene |
| `server/apps/accounts/` | Auth, organizations, subscriptions, OAuth | Keep — shared across all projects |
| `server/apps/main/` | Root router, health check, templates | Keep |
| `server/manage.py` | Alembic wrapper (makemigrations, migrate, runserver) | Keep |
| `server/migrations/` | Alembic config + 5 existing migration files | Keep — cystene DB schema |
| `client/src/modules/accounts/` | Auth, organizations, subscriptions frontend | Keep |
| `support/guidelines/` | 15 architecture/pattern guideline documents | Keep — apply to all projects |

### Replace with Cybersecurity Domain
| Directory | Current Contents | Action |
|---|---|---|
| `server/apps/ecommerce/` | Nudgio ecommerce domain — models, adapters, engine, schemas, subrouters, utils | **Replace entirely** with cybersecurity scanning domain |
| `client/src/modules/ecommerce/` | Nudgio ecommerce frontend — schemas, service, store, providers, hooks | **Replace entirely** with cybersecurity frontend modules |
| `client/src/app/(ecommerce)/` | Nudgio ecommerce pages | **Replace entirely** with cybersecurity pages |
| `server/main.py` | Mounts `ecommerce_router` + sync scheduler | **Update** — mount cybersecurity router instead |
| `server/migrations/env.py` | Imports `from apps.ecommerce.models import *` | **Update** — import cybersecurity models instead |
| `website/` | Nudgio landing page content | **Full rebrand** for cystene cybersecurity positioning |
| `support/to-do/0_order.md` | Nudgio to-do list | **Replace** with cystene-specific planning |

### Reference Examples (From Sibling Projects — DO NOT DELETE)
These directories are **NOT mounted** in `server/main.py` but are kept as **canonical reference examples** for building the cybersecurity domain. Always read these before creating new files.
| Directory | Origin | Purpose |
|---|---|---|
| `server/apps/nexotype/` | Nexotype (biotech) | **Primary backend reference** — most mature codebase (60 entities), full models/schemas/subrouters/utils |
| `server/apps/assetmanager/` | Finpy (finance) | Backend reference — entity-based access patterns, holding/captable/deal domains |
| `server/apps/algobot/` | Finpy (finance) | Backend reference — algorithmic trading patterns |
| `server/apps/cryptobot/` | Finpy (finance) | Backend reference — crypto trading patterns |
| `client/src/modules/nexotype/` | Nexotype (biotech) | **Primary frontend reference** — schemas, services, stores, providers, hooks for 60 entities |
| `client/src/modules/assetmanager/` | Finpy (finance) | Frontend reference — entity-based patterns |
| `client/src/modules/dashboard/` | Finpy (finance) | Frontend reference — dashboard patterns |

### .examples/ Directory
Reference implementations from other projects (read-only, never modify):
- `catalyst-ui-kit/` — UI component reference
- `finpy-python-scripts/` — Python scripting patterns
- `finpy-website-main/` — Finance landing page reference
- `nudgio/` — Original nudgio source
- `saas-starter-main/` — SaaS boilerplate reference
- `server-django-ninja/` — Django Ninja reference (historical)
- `v7capital-main/` — Additional reference

---

## 7. Key Architectural Patterns

### File Naming Convention
- **Backend:** `snake_case` everywhere — `scan_target_models.py`, `scan_target_schemas.py`, `scan_target_subrouter.py`
- **Frontend:** `kebab-case` for files — `scan-target.schemas.ts`, `scan-target.service.ts`, `scan-target.store.ts`, `scan-target-provider.tsx`, `use-scan-targets.ts`
- **Field names:** `snake_case` across ALL layers — identical from SQLAlchemy model → Pydantic schema → Zod schema → API payloads

### Response Wrapper Pattern
All API responses follow this structure:
```typescript
{ success: boolean; data?: T; count?: number; error?: string; }
```
- Single item: `{ success, data: T, error }`
- List: `{ success, data: T[], count, error }`
- Delete: `{ success, message, error }`

### Soft Delete
- Every domain model inherits `BaseMixin` which provides `deleted_at` (NULL = active, timestamp = deleted) and `deleted_by`
- `soft_delete_with_audit()` in `crud_utils.py` — sets `deleted_at` + `deleted_by` + logs audit
- **NEVER hard DELETE** in subrouters
- All list queries filter `WHERE deleted_at IS NULL` via `apply_soft_delete_filter()` or `apply_default_filters()`

### Audit Logging
- Explicit `log_audit()` calls in subrouters — NOT ORM listeners, NOT database triggers
- `audit_utils.py` provides `log_audit()`, `model_to_dict()`, and query helpers
- `create_with_audit()`, `update_with_audit()`, `soft_delete_with_audit()` in `crud_utils.py` wrap CRUD + audit in one call

### Authentication
- **JWT** — access token (24h) + refresh token (7 days)
- **OAuth 2.0** — Google sign-in
- `accounts/utils/auth_utils.py`, `token_utils.py`, `dependency_utils.py`

### Provider Composition (Frontend)
- Nesting order: `AccountsProviders` → `DomainProviders` → Layout shell (sidebar + content) → `{children}` (pages)
- Each route group has its own `layout.tsx` composing providers + sidebar + breadcrumbs
- Pages use hooks — never import store or service directly

### Frontend Import Rules
- `@` alias for cross-module imports: `import { fetchClient } from '@/modules/accounts/...'`
- Relative paths for intra-module imports: `import { ScanTargetSchema } from '../schemas/...'`
- `@` maps to `client/src/` via tsconfig paths
- Never deep relative paths that escape the module (`../../../modules/accounts/...`)

### Section Separators
All files use section separators:
- Python: `# ==========================================`
- TypeScript: `// ==========================================`

### Comment Style
- **Backend models:** Docstring on class + field-level comments for non-obvious decisions (FK ondelete reasoning)
- **Backend schemas:** Docstring on class, `Field(description="...")` on every field
- **Backend subrouters:** Docstring on each endpoint with numbered step list
- **Backend utils:** Docstring on each function with Args/Returns/Raises
- **Frontend schemas:** JSDoc header with backend source paths, JSDoc on each Zod schema/enum
- **Frontend endpoints:** JSDoc with backend router source path
- **Frontend service:** JSDoc on each function with `@param` and `@returns`
- **Frontend store:** JSDoc on interface and each action
- **Frontend provider:** JSDoc on context type and component

### No PG Enums in Database
- Use `String(50)` columns in SQLAlchemy
- Python `(str, Enum)` in Pydantic schemas only
- `.value` when writing enum values to DB

---

## 8. What Needs to Be Built (Cybersecurity Domain)

**Placeholder section** — the domain models, schemas, subrouters, and frontend modules for cybersecurity scanning will be designed when work begins.

The architecture will follow the exact same 15-layer pipeline as nexotype/finpy/nudgio:
1. Define SQLAlchemy models in `server/apps/cybersecurity/models/`
2. Create Pydantic schemas in `server/apps/cybersecurity/schemas/`
3. Build FastAPI subrouters in `server/apps/cybersecurity/subrouters/`
4. Wire up `server/apps/cybersecurity/router.py`
5. Mount in `server/main.py`
6. Create Zod schemas in `client/src/modules/cybersecurity/schemas/`
7. Add endpoints in `client/src/modules/cybersecurity/utils/api.endpoints.ts`
8. Build services in `client/src/modules/cybersecurity/service/`
9. Create Zustand stores in `client/src/modules/cybersecurity/store/`
10. Build providers in `client/src/modules/cybersecurity/providers/`
11. Create hooks in `client/src/modules/cybersecurity/hooks/`
12. Build pages in `client/src/app/(cybersecurity)/`

The domain app name will be decided when design begins (likely `cybersecurity` or `scanner`).

---

## 9. Coding Workflow Rules

### Strict Cycle
**Propose → Approve → Implement → Review** for every change. Never modify files without explicit permission.

### NO Subagents
Do all work directly. Subagents waste tokens and are error-prone. Only use if genuinely unavoidable.

### One Component at a Time
Complete each component fully before moving to the next.

### Never Run Migrations
Only the human runs `python manage.py makemigrations` and `python manage.py migrate`. The LLM creates/modifies model files — the human generates and applies migrations.

### Never Push Code
Only the human pushes to the remote repository.

### Read Before Modify
Always read 2-3 canonical reference files (from nexotype, finpy, nudgio, or accounts) before creating or modifying any file. Never guess patterns.

### Comments Are Sacred
- Never delete existing in-code comments
- Always add reasoning comments on non-obvious decisions
- Include "Why:" comments when adding fields or models
- Follow the exact comment style documented in section 7

### Verify After Changes
- `tsc --noEmit` after frontend changes
- `npm run build` before declaring done

### Field Alignment
Field names must be identical across all layers: SQLAlchemy model → Pydantic schema → Zod schema → API payloads. All `snake_case`, no camelCase conversion anywhere.

### Ask → Allow → Modify
Never modify more files than explicitly permitted. If unsure, ask.

### Clarifying Questions
If unsure what to do next or there are multiple approaches, ask before proceeding.

---

## 10. Reference Files

### Architecture & Patterns (in `support/guidelines/`)
| File | Purpose |
|---|---|
| `general-llm-workflow.md` | **Primary reference** — full 15-layer pipeline with examples |
| `model-architectural-implementation.md` | Full-stack implementation guide |
| `coding-workflow-guidelines.md` | Coding workflow rules |
| `frontend-architecture-patterns.md` | Frontend architecture decisions |
| `schema-guidelines.md` | Schema design patterns |
| `form-guidelines.md` | Form implementation patterns |
| `hook-guidelines.md` | Hook design patterns |
| `provider-guidelines.md` | Provider composition patterns |
| `unified-zustand-pattern.md` | Zustand store patterns |
| `zustand-vs-react-query-pattern.md` | When to use Zustand vs TanStack Query |
| `component-design-patterns.md` | Component design patterns |
| `small-composable-functions-guidelines.md` | Function composition patterns |
| `actions-guidelines.md` | Server actions patterns |
| `drizzle-nextjs-server-actions-architecture.md` | Drizzle ORM reference (not used, historical) |
| `socks-proxy-ssh-tunnel.md` | SSH tunnel setup for remote DB access |

### Project-Specific
| File | Purpose |
|---|---|
| `support/to-do/0_order.md` | Current to-do list (still has nudgio content — needs replacement) |
| `support/cystene/claude-code-handover.md` | This document |

### Key Source Files
| File | Purpose |
|---|---|
| `server/core/config.py` | Settings class — ports, URLs, DB, JWT, Stripe, OAuth |
| `server/core/db.py` | SQLAlchemy Base, async_session, get_session |
| `server/main.py` | FastAPI app entry point — currently mounts accounts + ecommerce |
| `server/manage.py` | Alembic wrapper — makemigrations, migrate, runserver |
| `server/migrations/env.py` | Alembic model imports — currently imports accounts + ecommerce |
| `server/apps/accounts/` | Shared auth module — models, schemas, subrouters, utils |
| `server/apps/ecommerce/` | Nudgio domain (to be replaced) — reference for patterns |
| `client/src/modules/accounts/` | Shared auth frontend |
| `client/src/modules/ecommerce/` | Nudgio frontend (to be replaced) |

---

## 11. Existing Migration History

5 migrations exist for the cystene database (from nudgio bootstrap):

1. `2026_03_03_1636` — Initial schema (accounts + ecommerce tables)
2. `2026_03_04_0306` — Connection method and API fields
3. `2026_03_04_1444` — Add BaseMixin fields
4. `2026_03_06_0431` — Add ShopifyBilling model
5. `2026_03_08_0225` — WidgetAPIKey model

When the cybersecurity domain is built, the ecommerce tables will need to be dropped and new cybersecurity tables created via new migrations. The human handles all migration operations.

---

## 12. server/main.py — Current State

Currently mounts 3 routers:
```python
app.include_router(main_router)          # / and /ping
app.include_router(accounts_router)      # /accounts/...
app.include_router(ecommerce_router)     # /ecommerce/... (nudgio — to be replaced)
```

Also has:
- Ecommerce sync scheduler (lifespan startup/shutdown) — to be removed when ecommerce is replaced
- Static file mounts for main + ecommerce — ecommerce mount to be replaced
- CORS middleware reading from `settings.BACKEND_CORS_ORIGINS`
- `uvicorn.run("main:app", port=8002, reload=True)` — **port needs update to 8003**

---

## 13. config.py — Current Settings

```python
PROJECT_NAME: str = "Cystene API"
VERSION: str = "0.1.0"
DESCRIPTION: str = "Cybersecurity Scanning Platform"
SERVER_URL: str = "http://localhost:8003"
FRONTEND_URL: str = "http://localhost:3003"
```

Already updated for cystene. JWT, Stripe, Google OAuth, Shopify OAuth, and email settings are present (inherited from nudgio). Shopify-specific settings will be removed when ecommerce is replaced.
