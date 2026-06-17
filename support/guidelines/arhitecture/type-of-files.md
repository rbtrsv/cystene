# Type of Files — FinPy Architecture

## Server (`server/apps/assetmanager/`)

### `models/`
SQLAlchemy models. Each file defines one or more database tables.
- Fields, types, constraints, relationships, indexes
- Inherits from `Base` + `BaseMixin` (soft delete, audit fields)
- Example: `deal_models.py` → `Deal`, `DealCommitment`, `EntityDealProfile`

### `schemas/`
Pydantic schemas. Validation for API input/output.
- **Full schema** — read representation (all fields, `from_attributes=True`)
- **Create schema** — POST input (required fields, constraints)
- **Update schema** — PUT input (all fields optional for partial updates)
- **Response wrappers** — `{success, data, error}` pattern
- **Enriched schemas** — JOINed data for list/get endpoints (e.g., `DealCommitmentDetail` adds resolved names)
- **Enums** — string enums matching model column values
- Example: `deal_commitment_schemas.py` → `DealCommitment`, `DealCommitmentDetail`, `DealCommitmentCreate`, `DealCommitmentUpdate`, `DealCommitmentResponse`

### `subrouters/`
FastAPI endpoint routers. CRUD operations, access control, simple business logic.
- List (GET `/`) — filtering, pagination, JOINs for enriched responses
- Get (GET `/{id}`) — single record with access check
- Create (POST `/`) — validation, duplicate checks, audit logging
- Update (PUT `/{id}`) — partial update, FK validation, audit logging
- Delete (DELETE `/{id}`) — soft delete, audit logging
- Custom endpoints — status transitions, invite codes, discovery
- Example: `deal_commitment_subrouter.py` → 5 CRUD endpoints + `receiving_entity_id` filter

### `services/`
Complex business logic spanning multiple models/tables. Called by subrouters.
- `deal_execution_service.py` — Deal → FundingRound + Security + Stakeholders + SecurityTransactions
- `holding_generation_service.py` — StakeholderPosition → Holding
- `distribution_service.py` — generates distribution SecurityTransactions
- `captable_service.py` — computed cap table aggregation (read-only)
- Rule: if logic is simple CRUD + JOINs → subrouter. If logic creates/modifies records across 3+ tables → service.

### `utils/`
Shared utilities used across subrouters and services.
- `crud_utils.py` — `get_record_or_404`, `check_duplicate`, `create_with_audit`, `update_with_audit`, `soft_delete_with_audit`
- `audit_utils.py` — `log_audit`, `model_to_dict`
- `filtering_utils.py` — `get_user_entity_ids`, `apply_soft_delete_filter`
- `dependency_utils.py` — `get_entity_access`, `require_write_access`
- `cache_utils.py` — `InMemoryCacheBackend`, `DragonflyCacheBackend`

---

## Frontend (`client/src/modules/assetmanager/`)

### `schemas/`
Zod validation schemas. Mirror backend Pydantic schemas exactly (snake_case).
- **Full schema** — `z.object({...})` matching backend read schema
- **Create schema** — required fields with `.min()`, `.max()` constraints
- **Update schema** — all fields `.optional()`
- **Enums** — `z.enum([...])` matching backend string enums
- **Label helpers** — `getCommitmentTypeLabel()`, `getDealTypeLabel()`, etc.
- **Type exports** — `z.infer<typeof Schema>`
- **Response types** — TypeScript interfaces for `{success, data, error}`
- Example: `deal-commitment.schemas.ts` → `DealCommitmentSchema`, `CreateDealCommitmentSchema`, `CommitmentTypeEnum`

### `services/`
API calls. Each function calls one backend endpoint via `fetchClient`.
- `getItems(params?)` — GET list with query params
- `getItem(id)` — GET single
- `createItem(data)` — validates with Zod, POST
- `updateItem(id, data)` — validates with Zod, PUT
- `deleteItem(id)` — DELETE
- Custom functions for non-CRUD endpoints
- Example: `deal-commitment.service.ts` → `getDealCommitments`, `createDealCommitment`, etc.

### `store/`
Zustand stores. State management with `immer` + `devtools` + `persist` middleware.
- State: `items[]`, `activeItemId`, `isLoading`, `error`, `isInitialized`
- Actions: `initialize`, `fetchItems`, `fetchItem`, `createItem`, `updateItem`, `deleteItem`, `setActiveItem`, `clearError`, `reset`
- Persistence: only `activeItemId` persisted (via `partialize`)
- Example: `deal-commitment.store.ts` → `useDealCommitmentStore`

### `hooks/`
React hooks. Combine context (from provider) + store into a single interface.
- `useItemContext()` — reads from React Context, throws if outside provider
- `useItems()` — combines context state + store actions + helper methods
- Helper methods: `getItemById`, `getItemsByEntity`, `getItemsByType`
- Example: `use-deal-commitments.ts` → `useDealCommitments()`

### `providers/`
React context providers. Initialize store on mount, provide state to children.
- Creates React Context with state shape
- Calls `store.initialize()` on mount
- Wraps children with `Context.Provider`
- Example: `deal-commitment-provider.tsx` → `DealCommitmentProvider`

### `pages/` (`client/src/app/(assetmanager)/`)
Next.js page components. Each model has 3 page types:
- **List** (`page.tsx`) — table with search, sort, filters, empty state
- **New** (`new/page.tsx`) — create form with TanStack Form + Zod validation
- **Details** (`[id]/details/page.tsx`) — tabs (Details read-only + Edit form + Danger Zone delete)
- Pattern: read 2-3 existing detail pages before creating/modifying any page

### `utils/`
Shared frontend utilities.
- `api.endpoints.ts` — all API endpoint URLs organized by model
- `fetch.client.assetmanager.ts` — authenticated fetch wrapper with token handling

### `components/`
Shared UI components.
- `sidebar/assetmanager-sidebar.tsx` — navigation sidebar with all module links
