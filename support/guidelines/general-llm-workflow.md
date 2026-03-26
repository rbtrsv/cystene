# Architecture Flow: Backend Model → Frontend Page

Reference document for the full pipeline from SQLAlchemy model to React page.
Naming conventions, comment style, file structure, and alignment rules — so any LLM (or human) working on these projects follows the exact same patterns.

Applies to: **nudgio** (ecommerce), **finpy** (assetmanager), **nexotype** (nexotype) — all share the same architecture.

Where patterns differ between projects, differences are marked with **(finpy-specific)**, **(nexotype-specific)**, etc.

---

## The Pipeline (15 layers, in order)

### 0. Core Infrastructure — `server/core/`

**Shared across all projects.** Foundation files that every app depends on.

- `core/config.py` — Pydantic `Settings` class, reads `.env`, exposes all config (DB URL, JWT settings, CORS, API keys)
- `core/db.py` — SQLAlchemy async engine, `Base` (declarative base all models inherit from), `async_session` factory, `get_session` dependency

These files are identical in structure across finpy, nexotype, nudgio. Only the values differ (project name, ports, description).

---

### 0.5 Accounts Module — shared dependency

**`server/apps/accounts/`** — auth, organizations, subscriptions, OAuth. Shared by ALL domain apps.

**Backend:**
- `models.py` — `User`, `Token`, `Organization`, `OrganizationMember`, `OrganizationInvitation`, `Subscription`, `AccountsAuditLog`
- `utils/` — `auth_utils`, `token_utils`, `stripe_utils`, `dependency_utils`, `email_utils`, `oauth_utils`, `password_utils`, `audit_utils`
- `subrouters/` — `auth`, `organizations`, `organization_members`, `organization_invitations`, `subscriptions`, `oauth`

**Frontend:** `client/src/modules/accounts/` — same pipeline (schemas, service, store, providers, hooks, utils)
- Key utils: `fetchClient` (API calls with auth), `fetchServer` (SSR), `token.client.utils` (JWT storage), `api.endpoints.ts`

**Provider composition:**
- `AccountsProviders` wraps: `AuthProvider` → `OrganizationProvider` → `OrganizationMembersProvider` → `OrganizationInvitationsProvider` → `SubscriptionProvider` → `OAuthProvider`
- Domain app layouts nest inside accounts: `<AccountsProviders><AssetManagerProviders>{children}</AssetManagerProviders></AccountsProviders>`

**Important:** accounts does NOT use BaseMixin — defines its own fields directly (User has relationships/cascade that BaseMixin doesn't provide).

---

### 1. Backend Model — `server/apps/{app}/models/{domain}_models.py`
- SQLAlchemy ORM classes
- `snake_case` field names, always
- Grouped by domain: `holding_models.py`, `entity_models.py`, `commercial_models.py`, `clinical_models.py`
- In-code comments explain WHY (not what) — especially FK `ondelete` choices
- Section separators: `# Core Details`, `# Investment Details`, `# Tracking`
- Example (finpy): `holding_models.py` → classes `Holding`, `HoldingCashFlow`, `HoldingPerformance`, `Valuation`
- Example (nexotype): `omics_models.py` → classes `Organism`, `Gene`, `Transcript`, `Exon`, `Protein`, etc.
- All models split into domain files: `omics_models.py`, `clinical_models.py`, `commercial_models.py`, etc.
- `models/__init__.py` re-exports everything: `from .omics_models import *` — so subrouters import with `from ...models import Gene`
- Old `models.py` may exist as reference — NOT used in imports

**FK ondelete rules** (established pattern):
- **CASCADE** — default for parent→child ownership (entity_id on holdings, funding_rounds, etc.). If parent dies, children die.
- **RESTRICT** — when child has cross-org dependencies or critical data that must survive. Blocks parent deletion. Example: `Syndicate.entity_id` (has members from other orgs), `FundingRound.entity_id`, `Security.funding_round_id`, `SecurityTransaction.security_id`
- **SET NULL** — when FK is optional/informational and child record must survive. Example: `Holding.target_entity_id` (investor's holding survives target company leaving), `DealPipeline.target_entity_id`, `HoldingCashFlow.target_entity_id`

Every non-default FK ondelete MUST have a reasoning comment in the model explaining WHY:
```python
# SET NULL: investor's holding record should survive target entity deletion.
# Falls back to company_name field for display.
target_entity_id: Mapped[int | None] = mapped_column(
    Integer, ForeignKey("entities.id", ondelete="SET NULL"), nullable=True
)
```

### 1.5 Backend Mixins — `server/apps/{app}/models/mixin_models.py`

Reusable field sets inherited by domain models.

**Domain app models (assetmanager, nexotype, ecommerce) have `BaseMixin`:**
- `created_at`, `updated_at` — timestamps
- `deleted_at`, `deleted_by` — soft delete (NULL = active, SET = deleted)
- `created_by`, `updated_by` — user audit (loose coupling, no FK to accounts.User)

Note: accounts module does NOT use BaseMixin. Accounts models (User, Token, Organization, etc.) define their own fields directly + have relationships/FKs that BaseMixin doesn't provide.

**Nexotype additionally has `OwnableMixin`** (nexotype-specific):
- `is_curated` — boolean, TRUE = visible to all subscribers
- `organization_id` — integer, loose coupling to accounts.Organization

Finpy does NOT have OwnableMixin. Finpy uses entity-based access (entity_id FK on each model) instead of org ownership.

Query pattern (nexotype): `WHERE is_curated = TRUE OR organization_id = :user_org_id`
Query pattern (finpy): entity access checked per-subrouter via `get_user_entity_ids()`

### 2. Backend Schema — `server/apps/{app}/schemas/{domain_folder}/{model}_schemas.py`
- Pydantic BaseModel classes
- **Field names match model exactly** (same `snake_case`)
- 6 schema classes per model:
  - `{Model}Create` — required + optional fields for POST (e.g. `GeneCreate`)
  - `{Model}Update` — all fields optional for PUT (e.g. `GeneUpdate`)
  - `{Model}Detail` — full representation for GET responses (e.g. `GeneDetail`), has `model_config = ConfigDict(from_attributes=True)`
  - `{Model}ListResponse` — list wrapper `{ success, data: list[{Model}Detail], count, error }` (e.g. `GeneListResponse`) — `count` used for pagination
  - `{Model}Response` — single item wrapper `{ success, data: {Model}Detail, error }` (e.g. `GeneResponse`)
  - `MessageResponse` — `{ success, message, error }` for DELETE operations
- Enums defined at top of file: `class InvestmentStatus(str, Enum)`
- Section separators: `# ==========================================`
- Header docstring: `"""Holding Schemas\n\nPydantic schemas for the Holding model..."""`

**Folder naming note:** Both projects use the same file naming convention (`{model}_schemas.py`). Folder names differ slightly:
- finpy: `schemas/holding_schemas/holding_schemas.py`
- nexotype: `schemas/omics/gene_schemas.py`

### 3. Backend Subrouter — `server/apps/{app}/subrouters/{domain_folder}/{model}_subrouter.py`
- FastAPI `APIRouter(tags=["{Models}"])`
- Standard CRUD: `GET /` (list), `GET /{id}` (detail), `POST /` (create), `PUT /{id}` (update), `DELETE /{id}` (soft delete)
- Uses shared utils: `get_record_or_404` / `get_owned_record_or_404`, `check_duplicate`, `create_with_audit`, `update_with_audit`, `soft_delete_with_audit`
- Each endpoint has docstring explaining what it does step-by-step
- Section separators same as schemas

**Folder naming note:** Same file convention (`{model}_subrouter.py`). Folder names differ:
- finpy: `subrouters/holding_subrouters/holding_subrouter.py`
- nexotype: `subrouters/asset/therapeutic_asset_subrouter.py`

**Nexotype has a `shared/` subdirectory** (nexotype-specific) in subrouters, schemas, providers, hooks for cross-cutting concerns:
- `subrouters/shared/permissions_subrouter.py` — returns subscription-based access permissions
- `schemas/shared/permissions.schemas.ts` — Zod schemas for permissions response
- `providers/shared/permissions-provider.tsx` — PermissionsProvider (wraps all domain providers)
- `hooks/shared/use-permissions.ts` — `canRead()`, `canWrite()` helpers

Finpy/nudgio do not have this `shared/` pattern (no subscription tiers).

### 3.5 Backend Utils — `server/apps/{app}/utils/`

Shared helper functions used by all subrouters. Each project has the same files but with project-specific logic.

**`crud_utils.py`** — CRUD operation helpers (all projects):
- `get_record_or_404` (finpy) / `get_owned_record_or_404` (nexotype) — fetch with soft-delete + optional ownership filter
- `check_duplicate` — composite key uniqueness check
- `create_with_audit` — create + INSERT audit log
- `update_with_audit` — update with old/new snapshots + UPDATE audit log
- `soft_delete_with_audit` — soft delete + DELETE audit log
- `create_or_restore_with_audit` — nexotype-only, for canonical identifiers (restore soft-deleted duplicates)

**`filtering_utils.py`** — Query filters:
- `apply_soft_delete_filter` — all projects, `WHERE deleted_at IS NULL`
- `apply_ownership_filter` — nexotype-only, `WHERE is_curated = TRUE OR organization_id = :org_id`
- `apply_default_filters` — nexotype combines both; finpy has per-model entity access filtering instead

**`audit_utils.py`** — Audit logging (all projects):
- `log_audit()` — explicit audit log call (not triggers, not listeners)
- `model_to_dict()` — SQLAlchemy instance → JSON-serializable dict (handles Decimal, datetime, date)
- Query helpers: `get_record_audit_logs()`, `get_user_audit_logs()`, etc.

**`dependency_utils.py`** — Auth helpers:
- `get_user_organization_id()` — all projects, queries OrganizationMember
- `require_domain_access()` — nexotype-only, subscription tier gating (router-level dependency)
- finpy uses `get_user_entity_ids()` / `get_entity_access()` instead

**`subscription_utils.py`** — nexotype-only:
- `DOMAIN_TIER_MAP`, `ENTITY_TIER_MAP` — tier requirements per domain/entity
- `get_required_tier()`, `tier_is_sufficient()`, `get_org_subscription()`

### 3.6 Soft Delete Pattern

The doc references `deleted_at` in BaseMixin — here is the full pattern:

- Every domain model has `deleted_at` (NULL = active, timestamp = deleted) and `deleted_by` (user ID who deleted it)
- `soft_delete_with_audit()` sets `deleted_at` + `deleted_by` + logs audit. NEVER hard DELETE in subrouters.
- All list queries filter `WHERE deleted_at IS NULL` via `apply_soft_delete_filter()` or `apply_default_filters()`
- FK ondelete constraints (CASCADE, RESTRICT, SET NULL) are safety nets for direct DB operations (hard DELETE), not triggered by the application layer which always soft-deletes
- `create_or_restore_with_audit()` (nexotype-only) — checks if a soft-deleted record with same unique key exists, restores it instead of creating a duplicate

### 4. Backend Router — `server/apps/{app}/router.py`
- Mounts all subrouters with `router.include_router(x_router, prefix="/x-pluralized")`
- Prefix naming: `snake_case` model → `kebab-case` URL (e.g. `holding_cash_flow` → `/holding-cash-flows`)
- Top-level prefix: `/assetmanager`, `/ecommerce`, `/nexotype`, `/accounts`

### 4.5 main.py — App Composition

`server/main.py` — FastAPI app entry point. Mounts ALL app routers:
```python
app.include_router(accounts_router)
app.include_router(assetmanager_router)
# etc.
```
- CORS middleware configured from `settings.BACKEND_CORS_ORIGINS`
- Static files mounted for `apps/main/static`
- Each project has different apps:
  - finpy: `main`, `accounts`, `ecommerce`, `cryptobot`, `algobot`, `assetmanager`
  - nexotype: `main`, `accounts`, `nexotype`
  - nudgio: `main`, `accounts`, `ecommerce`

---

### 5. Frontend Schema — `client/src/modules/{app}/schemas/{domain}/{model}.schemas.ts`
- Zod validation schemas
- **Field names match backend exactly** (same `snake_case` — NO camelCase conversion)
- Header comment block referencing backend sources:
  ```
  /**
   * Holding Schemas
   *
   * Zod validation schemas for Holding model.
   * Field names and validation rules match backend exactly (snake_case).
   *
   * Backend sources:
   * - Model: /server/apps/assetmanager/models/holding_models.py
   * - Schema: /server/apps/assetmanager/schemas/holding_schemas/holding_schemas.py
   * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/holding_subrouter.py
   */
  ```
- 3 Zod schemas mirroring backend:
  - `{Model}Schema` → mirrors `class {Model}Detail(BaseModel)` (full, for GET)
  - `Create{Model}Schema` → mirrors `class {Model}Create(BaseModel)` (POST)
  - `Update{Model}Schema` → mirrors `class {Model}Update(BaseModel)` (PUT)
- Type exports at bottom:
  ```ts
  export type Holding = z.infer<typeof HoldingSchema>;
  export type CreateHolding = z.infer<typeof CreateHoldingSchema>;
  export type UpdateHolding = z.infer<typeof UpdateHoldingSchema>;
  ```
- Response types matching backend wrappers:
  ```ts
  // Single item response
  export type HoldingResponse = { success: boolean; data?: Holding; error?: string; };
  // List response — includes count for pagination
  export type HoldingsResponse = { success: boolean; data?: Holding[]; count?: number; error?: string; };
  ```
- Enums mirroring backend: `export const InvestmentStatusEnum = z.enum(['active', 'exited', 'written_off']);`
- Section separators: `// ==========================================`

### 6. Frontend Endpoints — `client/src/modules/{app}/utils/api.endpoints.ts`
- One `const` per backend subrouter
- Standard CRUD shape:
  ```ts
  export const HOLDING_ENDPOINTS = {
    LIST:   `${API_BASE_URL}/assetmanager/holdings/`,
    DETAIL: (id: number) => `${API_BASE_URL}/assetmanager/holdings/${id}`,
    CREATE: `${API_BASE_URL}/assetmanager/holdings/`,
    UPDATE: (id: number) => `${API_BASE_URL}/assetmanager/holdings/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/assetmanager/holdings/${id}`,
  };
  ```
- Comment above each: `/** Backend: /server/apps/.../holding_subrouter.py */`
- URL paths match backend `router.include_router(prefix="/holdings")` exactly

### 7. Frontend Service — `client/src/modules/{app}/service/{domain}/{model}.service.ts`
- Pure async functions: `getHoldings`, `getHolding`, `createHolding`, `updateHolding`, `deleteHolding`
- Imports types from schema, endpoints from utils, `fetchClient` from accounts
- Validates input with Zod before POST/PUT: `CreateHoldingSchema.parse(data)`
- Returns typed responses: `Promise<HoldingsResponse>`
- Handles 401 → `clearAuthCookies()`

### 8. Frontend Store — `client/src/modules/{app}/store/{domain}/{model}.store.ts`
- Zustand store with `devtools` + `persist` + `immer` middleware
- Interface: `{Model}State` with state fields + action methods
- State: `holdings: Holding[]`, `activeHoldingId: number | null`, `isLoading`, `error`, `isInitialized`
- Actions call service functions, update state, handle errors
- `persist` partializes only `activeHoldingId` (not full data)
- Storage key: `finpy-{model}-storage`
- Helper exports: `get{Model}ById()`, `getActive{Model}()`

### 9. Frontend Provider — `client/src/modules/{app}/providers/{domain}/{model}-provider.tsx`
- React Context wrapping the Zustand store
- `{Model}ContextType` interface (state subset + actions)
- `{Model}Provider` component: rehydrates store, initializes on mount if `initialFetch=true`
- `useMemo` on context value to prevent re-renders
- All providers composed in `{app}-providers.tsx`
- **finpy/nudgio:** `initialFetch={false}` on all providers (lazy initialization)
- **nexotype-specific:** `initialFetch={boolean}` based on subscription permissions — uses `canRead('domain')` and `canRead('domain', 'entity')` from `usePermissions()` hook. Providers for locked domains don't fetch, preventing unnecessary 403 errors.

Example (nexotype-only):
```tsx
const omics = ready && canRead('omics');
const gene = ready && canRead('omics', 'gene');  // entity override
<OrganismProvider initialFetch={omics}>
  <GeneProvider initialFetch={gene}>
```

### 10. Frontend Hook — `client/src/modules/{app}/hooks/{domain}/use-{models}.ts`
- Combines context + store into single interface
- `use{Model}Context()` — throws if outside provider
- `use{Models}()` — merged loading/error states, helper methods (`getByEntity`, `getByTargetEntity`)
- Returns: state + CRUD actions + helper filters

### 11. Frontend Pages — `client/src/app/{route-group}/{models}/page.tsx`
- Route groups: `(accounts)`, `(assetmanager)`, `(nexotype)`, `(ecommerce)`
- Page structure: `{models}/page.tsx` (list), `{models}/new/page.tsx` (create), `{models}/[id]/details/page.tsx` (detail)
- Uses the hook (`useHoldings()`) — never imports store/service directly
- shadcn/ui components: `Card`, `Button`, `Badge`, `Alert`, `Input`, `Label`
- Icons from `lucide-react`

### 11.5 Layout Composition Pattern (Frontend)

Route groups use `layout.tsx` to compose providers + sidebar + breadcrumbs:
- Pattern: `(assetmanager)/layout.tsx` wraps `<AccountsProviders><AssetManagerProviders>...<Sidebar/>...<Breadcrumb/>{children}</AssetManagerProviders></AccountsProviders>`
- Each route group has its own sidebar component and breadcrumb component
- shadcn/ui `SidebarProvider`, `SidebarInset`, `SidebarTrigger` used consistently
- Nesting order: Accounts providers → Domain providers → Layout shell (sidebar + content area) → `{children}` (pages)

### 12. Migrations & manage.py — `server/manage.py`

**IMPORTANT: The LLM NEVER runs migrations. Only the human runs them.**

Django-style wrapper around Alembic. Same file across all projects (only default port differs).

Commands (reference only — human executes these):
- `python manage.py makemigrations "message"` — create migration (alembic revision --autogenerate)
- `python manage.py migrate` — apply migrations (alembic upgrade head)
- `python manage.py status` — current migration state
- `python manage.py rollback [N]` — rollback N migrations (default 1)
- `python manage.py rollback-to <revision>` — rollback to specific revision
- `python manage.py history` — show migration history
- `python manage.py resetdb` — drop all tables (downgrade to base)
- `python manage.py runserver [--port N]` — start FastAPI dev server

Migration files: `server/migrations/versions/`
Config: `server/alembic.ini`, `server/migrations/env.py`

`migrations/env.py` imports all models so Alembic detects schema changes:
- finpy: `from apps.assetmanager.models import *`
- nexotype: `from apps.nexotype.models import *`
- nudgio: `from apps.ecommerce.models import *`

---

## Naming Alignment Rules

| Layer | File Name Pattern | Field Names |
|---|---|---|
| Backend Model | `{domain}_models.py` | `snake_case` |
| Backend Mixin | `mixin_models.py` | `snake_case` |
| Backend Schema | `{model}_schemas.py` | `snake_case` (match model) |
| Backend Subrouter | `{model}_subrouter.py` | `snake_case` params |
| Backend Utils | `{concern}_utils.py` | `snake_case` |
| Backend Router prefix | `/kebab-case-plural` | — |
| Frontend Schema | `{model}.schemas.ts` | `snake_case` (match backend) |
| Frontend Endpoints | `api.endpoints.ts` | `SCREAMING_SNAKE` const |
| Frontend Service | `{model}.service.ts` | `snake_case` payloads |
| Frontend Store | `{model}.store.ts` | `camelCase` methods, `snake_case` data |
| Frontend Provider | `{model}-provider.tsx` | `PascalCase` components |
| Frontend Hook | `use-{models}.ts` | `camelCase` methods |
| Frontend Page | `page.tsx` | uses hook |

---

## Comment Style Rules

- **Backend models**: docstring on class explaining purpose + field-level comments for non-obvious decisions (FK ondelete, fallback fields)
- **Backend schemas**: docstring on class, `Field(description="...")` on every field
- **Backend subrouters**: docstring on each endpoint with numbered step list
- **Backend utils**: docstring on each function with Args/Returns/Raises
- **Frontend schemas**: JSDoc header with backend source paths, JSDoc on each Zod schema/enum with backend equivalent
- **Frontend endpoints**: JSDoc with backend router source path
- **Frontend service**: JSDoc on each function with `@param` and `@returns`
- **Frontend store**: JSDoc on interface and each action
- **Frontend provider**: JSDoc on context type and component
- **All files**: section separators `// ==========================================` or Python equivalent

---

## Stripe Integration Conventions

- `accounts/utils/stripe_utils.py` — shared across all projects. Handles checkout, customer portal, webhook sync.
- `plan_name` stored UPPERCASE in DB (`.upper()` in stripe_utils.py). Paired with `dependency_utils.py` for tier comparison. Frontend handles display formatting (`.charAt(0) + .slice(1).toLowerCase()`).
- All permission-level strings use UPPERCASE convention: `SUBSCRIPTION_TIERS`, `ORGANIZATION_ROLES`, subscription statuses (`ACTIVE`, `TRIALING`, `CANCELED`).
- Case-insensitive comparison on frontend: `.toUpperCase()` on both sides when comparing plan names.
- **finpy:** quantity-based pricing (single product, quantity = number of entities). `subscription_utils.py` in assetmanager.
- **nexotype:** plan-based pricing (Pro / Enterprise). `subscription_utils.py` in nexotype with `DOMAIN_TIER_MAP`, `ENTITY_TIER_MAP`.

---

## File Tree Example (Holding from assetmanager)

```
SERVER:
server/
├── core/
│   ├── config.py                        → Settings class, reads .env
│   └── db.py                            → Base, async_session, get_session
├── manage.py                            → makemigrations, migrate, runserver (human only)
├── migrations/
│   ├── env.py                           → imports all models for Alembic detection
│   └── versions/                        → migration files
└── apps/assetmanager/
    ├── models/
    │   ├── __init__.py                  → re-exports from all domain files
    │   ├── mixin_models.py              → BaseMixin (timestamps, soft delete, audit)
    │   └── holding_models.py            → Holding, HoldingCashFlow, HoldingPerformance, Valuation
    ├── schemas/holding_schemas/
    │   ├── holding_schemas.py           → HoldingCreate, HoldingUpdate, HoldingDetail, HoldingListResponse, HoldingResponse, MessageResponse
    │   ├── holding_cash_flow_schemas.py
    │   ├── holding_performance_schemas.py
    │   ├── valuation_schemas.py
    │   └── deal_pipeline_schemas.py
    ├── subrouters/holding_subrouters/
    │   ├── holding_subrouter.py         → GET /, GET /{id}, POST /, PUT /{id}, DELETE /{id}
    │   ├── holding_cash_flow_subrouter.py
    │   ├── holding_performance_subrouter.py
    │   ├── valuation_subrouter.py
    │   └── deal_pipeline_subrouter.py
    ├── utils/
    │   ├── crud_utils.py                → get_record_or_404, create_with_audit, update_with_audit, soft_delete_with_audit
    │   ├── filtering_utils.py           → apply_soft_delete_filter, entity access filters
    │   ├── audit_utils.py               → log_audit, model_to_dict
    │   └── dependency_utils.py          → get_user_organization_id, get_user_entity_ids
    └── router.py                        → include_router(holding_router, prefix="/holdings")

CLIENT:
client/src/modules/assetmanager/
├── schemas/holding/
│   ├── holding.schemas.ts              → HoldingSchema, CreateHoldingSchema, UpdateHoldingSchema
│   ├── holding-cash-flow.schemas.ts
│   ├── holding-performance.schemas.ts
│   ├── valuation.schemas.ts
│   └── deal-pipeline.schemas.ts
├── utils/api.endpoints.ts              → HOLDING_ENDPOINTS { LIST, DETAIL, CREATE, UPDATE, DELETE }
├── service/holding/
│   ├── holding.service.ts              → getHoldings, getHolding, createHolding, updateHolding, deleteHolding
│   ├── holding-cash-flow.service.ts
│   └── ...
├── store/holding/
│   ├── holding.store.ts                → useHoldingStore (Zustand)
│   └── ...
├── providers/holding/
│   ├── holding-provider.tsx            → HoldingProvider (Context + Store bridge)
│   └── ...
├── hooks/holding/
│   ├── use-holdings.ts                 → useHoldings() (combined hook)
│   └── ...
└── providers/assetmanager-providers.tsx → composes all providers

client/src/app/{route-group}/{models}/
├── page.tsx                            → list view
├── new/page.tsx                        → create form
└── [id]/details/page.tsx               → detail view
```

---

## Domain Groups within assetmanager (finpy-specific)

The file tree above shows holding as example. Here is the full domain group structure:

- **`entity/`** — entity, entity-organization-member, entity-organization-invitation, stakeholder, syndicate, syndicate-member, syndicate-transaction (7 models)
- **`captable/`** — funding-round, security, security-transaction, fee (4 models + security-form frontend-only config)
- **`deal/`** — deal, deal-commitment, entity-deal-profile (3 models)
- **`financial/`** — income-statement, cash-flow-statement, balance-sheet, financial-metrics, kpi, kpi-value (6 models)
- **`holding/`** — holding, valuation, deal-pipeline, holding-cash-flow, holding-performance (5 models)

Total: 25 CRUD models + 2 backend-only (cap-table-snapshot, cap-table-entry)

This grouping applies to both backend (`schemas/`, `subrouters/`) and frontend (`schemas/`, `service/`, `store/`, `providers/`, `hooks/`).

---

## Key Rules

1. **Field names are identical** from SQLAlchemy model → Pydantic schema → Zod schema (all `snake_case`)
2. **Backend `_` → Frontend file name `-`** (e.g. `holding_schemas.py` → `holding.schemas.ts`)
3. **Backend router prefix = frontend endpoint URL** (e.g. `prefix="/holdings"` → `HOLDING_ENDPOINTS.LIST = .../holdings/`)
4. **Every frontend file has JSDoc** referencing its backend source paths
5. **Section separators** in ALL files: `// ==========================================` (TS) or `# ==========================================` (Python)
6. **Pages never import store/service directly** — always go through the hook
7. **Providers composed in `{app}-providers.tsx`** — finpy/nudgio use `initialFetch={false}`, nexotype uses permission-gated booleans
8. **Response wrapper pattern** consistent everywhere: `{ success: boolean; data?: T; count?: number; error?: string; }`
9. **LLM never runs migrations** — only the human runs `python manage.py makemigrations` / `migrate`
10. **Frontend import rules** — `@` alias for cross-module and page imports (`import { fetchClient } from '@/modules/accounts/...'`), relative paths for intra-module imports (`import { HoldingSchema } from '../schemas/...'`). The `@` maps to `client/src/` via tsconfig paths. Never deep relative paths that escape the module (`../../../modules/accounts/...`).

---

## Working with the Human

Rules for any LLM working on these projects:

1. **Strict cycle**: Propose → Approve → Implement → Review. Never modify files without explicit permission.
2. **One component at a time**: Complete each fully before moving to next.
3. **NO subagents**: Do all work directly. Subagents waste tokens and are error-prone.
4. **LLM never runs migrations**: Only `python manage.py makemigrations` / `migrate` by the human.
5. **LLM never pushes code**: Only the human pushes.
6. **Always verify**: `tsc --noEmit` after frontend changes, `npm run build` before declaring done.
7. **Read before modify**: Always read canonical examples before modifying output.
8. **Mirrored projects**: finpy and nexotype share the same architecture. Changes in one often need to be applied to the other.
9. **Comments are sacred**: Never delete existing in-code comments. Always add reasoning comments on non-obvious decisions.
