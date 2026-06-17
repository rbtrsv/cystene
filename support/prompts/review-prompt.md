# Nexotype — Full Architecture Review Prompt

You are reviewing Nexotype, a biomedical knowledge platform with 61 domain entities spanning genomics, pharmacology, clinical data, commercial intelligence, and personalized medicine.

## Project Structure

```
nexotype/
├── server/          — FastAPI backend (Python 3.13, async)
├── client/          — Next.js frontend (TypeScript, React, Tailwind, shadcn/ui)
├── mcp/             — MCP server (FastMCP, separate pip package, published on PyPI)
├── support/         — Documentation, docker configs, to-do lists
└── website/         — Marketing site (separate)
```

## Server Architecture

```
server/
├── main.py                              — FastAPI app entrypoint
├── manage.py                            — Django-style CLI (makemigrations, migrate, runserver)
├── alembic.ini + migrations/            — Alembic migration management
├── core/
│   ├── db.py                            — PostgreSQL AsyncSession (SQLAlchemy + asyncpg)
│   └── config.py                        — Settings from .env
├── apps/
│   ├── accounts/                        — Auth, OAuth, Organizations, Subscriptions, Device Flow
│   │   ├── models.py                    — User, Organization, OrganizationMember, Subscription, DeviceCode
│   │   ├── subrouters/                  — auth_subrouter, oauth_subrouter, subscriptions_subrouter
│   │   └── utils/                       — auth_utils, oauth_utils, audit_utils
│   └── nexotype/                        — Main domain app
│       ├── models/                      — SQLAlchemy models (see Models section)
│       ├── schemas/                     — Pydantic schemas (9 domain dirs)
│       ├── subrouters/                  — FastAPI routers (10 domain dirs, 62 files)
│       ├── utils/                       — crud_utils, filtering_utils, dependency_utils, audit_utils
│       ├── services/                    — vcf_processor (VCF file parsing)
│       ├── router.py                    — Main router mounting all 62 subrouters + SurrealDB routers
│       └── surrealdb/                   — Graph database layer
│           ├── db.py                    — SurrealDB connection (WebSocket, health check + reconnect)
│           ├── services/                — graph_service, sync_service, ai_service
│           ├── subrouters/              — graph_subrouter, sync_subrouter, search_subrouter, ai_subrouter
│           └── schemas/                 — graph_schemas, graph_mappings, ai_schemas
```

## File Types — What Each File Does

### Backend (Python / FastAPI)

| File Type | Location Pattern | Purpose | Example |
|-----------|-----------------|---------|---------|
| **Model** | `models/*_models.py` | SQLAlchemy table definition — columns, FKs, relationships, `__table_args__` (indexes, constraints). Inherits `BaseMixin` + `OwnableMixin`. | `Gene` in `omics_models.py` |
| **Schema** | `schemas/{domain}/*_schemas.py` | Pydantic validation — `Create`, `Update`, `Detail`, `Response`, `ListResponse`, `MessageResponse`. Defines what the API accepts and returns. | `GeneCreate`, `GeneDetail` in `gene_schemas.py` |
| **Subrouter** | `subrouters/{domain}/*_subrouter.py` | FastAPI endpoints — GET list, GET detail, POST create, PUT update, DELETE soft-delete. Uses `Depends(get_current_user)`, `Depends(get_session)`. Calls `crud_utils` for DB operations. | `gene_subrouter.py` → `GET /nexotype/genes/` |
| **Router** | `router.py` | Central file mounting all 62 subrouters + SurrealDB routers with `include_router()`. | `router.include_router(genes_router, prefix="/genes")` |
| **Utils** | `utils/*.py` | Shared logic — `crud_utils.py` (create/update/delete with audit), `filtering_utils.py` (default filters, scope, search), `dependency_utils.py` (get org ID), `audit_utils.py` (log queries). | `create_with_audit()`, `apply_search_filter()` |
| **Service** | `services/*.py` | Business logic beyond CRUD — `vcf_processor.py` (VCF file parsing + variant matching). | `process_vcf()` |
| **Migration** | `migrations/versions/*.py` | Alembic auto-generated schema changes. Created via `python manage.py makemigrations "message"`. Applied via `python manage.py migrate`. | `add_pg_trgm_gin_indexes.py` |

### Backend — SurrealDB Layer

| File Type | Location Pattern | Purpose | Example |
|-----------|-----------------|---------|---------|
| **DB Connection** | `surrealdb/db.py` | WebSocket connection to SurrealDB with health check + auto-reconnect. `get_surreal()` is the FastAPI dependency. | `Depends(get_surreal)` |
| **Graph Service** | `surrealdb/services/graph_service.py` | SurrealQL traversal queries — wildcard edges `->(?).{id, in, out}`, BFS per level. Returns nodes + edges dicts. | `get_entity_network()`, `get_shortest_path()` |
| **Sync Service** | `surrealdb/services/sync_service.py` | PostgreSQL → SurrealDB sync. Reads all 61 tables, inserts nodes + creates edges. | `full_sync()`, `incremental_sync()` |
| **Graph Mappings** | `surrealdb/schemas/graph_mappings.py` | Centralized `NODE_MAP` (61 tables), `EDGE_MAP` (79 edges), `LABEL_FIELD_MAP` (display field per entity). Source of truth for graph schema. | `NODE_MAP = {"gene": Gene, ...}` |

### Frontend (TypeScript / Next.js)

| File Type | Location Pattern | Purpose | Example |
|-----------|-----------------|---------|---------|
| **Schema** | `modules/nexotype/schemas/{domain}/*.ts` | Zod validation — mirrors backend Pydantic schemas. Used for form validation. | `geneSchema.ts` → `geneCreateSchema` |
| **Service** | `modules/nexotype/service/{domain}/*.ts` | API call functions — uses `fetchClient()` with auth headers. One function per endpoint. | `gene.service.ts` → `listGenes()`, `createGene()` |
| **Hook** | `modules/nexotype/hooks/{domain}/*.ts` | React Query hooks — wraps service calls with caching, loading states, mutations, invalidation. | `gene.hook.ts` → `useGenes()`, `useCreateGene()` |
| **Store** | `modules/nexotype/store/{domain}/*.ts` | Zustand state — selected items, filters, pagination, UI state. | `gene.store.ts` → `useGeneStore()` |
| **Provider** | `modules/nexotype/providers/{domain}/*.tsx` | React context — composes hook + store, provides data to page tree. | `gene-provider.tsx` → `GeneProvider` |
| **Page** | `app/(nexotype)/{domain}/{entity}/page.tsx` | Next.js page — renders the UI using provider data. List page, detail page, create/edit pages. | `app/(nexotype)/(omics)/genes/page.tsx` |
| **Endpoints** | `modules/nexotype/utils/api.endpoints.ts` | All API URLs centralized. `API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL`. | `GENE_ENDPOINTS.LIST`, `GENE_ENDPOINTS.DETAIL(id)` |
| **Fetch Client** | `modules/accounts/utils/fetch.client.ts` | Generic `fetchClient<T>()` — adds auth headers, parses errors, handles JSON. | `fetchClient<GeneListResponse>(url)` |

### MCP (Python / FastMCP)

| File Type | Location Pattern | Purpose | Example |
|-----------|-----------------|---------|---------|
| **Server** | `mcp/src/nexotype_mcp/server.py` | FastMCP instance + entrypoints. `main()` for stdio (Claude Desktop), `main_http()` for HTTP (ChatGPT). | `mcp = FastMCP("Nexotype")` |
| **Tool** | `mcp/src/nexotype_mcp/tools/*.py` | MCP tools — decorated with `@mcp.tool`. Each tool calls the API via `client.py`. `EntityType` Literal enforces valid types. | `search_entities()`, `explore_network()` |
| **Config** | `mcp/src/nexotype_mcp/config.py` | API base URL. Defaults to production (`https://server.nexotype.com`). Override with `NEXOTYPE_API_URL` env var. | `API_BASE_URL` |
| **Client** | `mcp/src/nexotype_mcp/client.py` | HTTP client wrapper — handles auth token, makes requests to FastAPI backend. | `nexotype.get()`, `nexotype.post()` |

## Models Layer — `server/apps/nexotype/models/`

10 domain files + mixins + audit + `__init__.py` (re-exports all) + `models.py` (legacy monolith, kept as reference — do NOT delete):

| File | Domain | Models |
|------|--------|--------|
| `mixin_models.py` | Mixins | `BaseMixin` (timestamps, soft delete, user audit), `OwnableMixin` (is_curated, organization_id) |
| `audit_models.py` | Audit | `NexotypeAuditLog` (immutable change log, old_data/new_data JSON) |
| `standardization_models.py` | 1. Standardization | `OntologyTerm`, `UnitOfMeasure`, `ExternalReference` |
| `omics_models.py` | 2. Omics Registry | `Organism`, `Gene`, `Transcript`, `Exon`, `Protein`, `ProteinDomain`, `Variant`, `PeptideFragment` |
| `clinical_models.py` | 3. Clinical | `Indication`, `Phenotype`, `Biomarker`, `Pathway`, `DosageProtocol` |
| `asset_models.py` | 4. Asset Management | `TherapeuticAsset` (polymorphic base), `SmallMolecule`, `Biologic`, `TherapeuticPeptide`, `Oligonucleotide` |
| `engineering_models.py` | 5. R&D Engineering | `Candidate`, `DesignMutation`, `Construct` |
| `lims_models.py` | 6. LIMS | `Subject`, `Biospecimen`, `AssayProtocol`, `AssayRun`, `AssayReadout` |
| `user_models.py` | 7-8. User/SaaS | `UserProfile`, `DataSource`, `GenomicFile`, `UserVariant`, `UserBiomarkerReading`, `UserTreatmentLog`, `PathwayScore`, `Recommendation` |
| `knowledge_graph_models.py` | 9. Knowledge Graph | `DrugTargetMechanism`, `BioActivity`, `TherapeuticEfficacy`, `DrugInteraction`, `BiomarkerAssociation`, `GenomicAssociation`, `VariantPhenotype`, `PathwayMembership`, `BiologicalRelationship`, `Source`, `EvidenceAssertion`, `ContextAttribute` |
| `commercial_models.py` | 10. Commercial | `MarketOrganization`, `Patent`, `PatentClaim`, `PatentAssignee`, `AssetOwnership`, `Transaction`, `LicensingAgreement`, `DevelopmentPipeline`, `RegulatoryApproval`, `TechnologyPlatform`, `AssetTechnologyPlatform`, `OrganizationTechnologyPlatform` |

Every domain model inherits `BaseMixin` + `OwnableMixin`. Audit model has neither (immutable).

## Client Architecture

```
client/src/
├── app/(nexotype)/          — Next.js pages (191 page.tsx files across domain dirs)
├── modules/
│   ├── accounts/            — Auth, token management, fetch.client.ts
│   ├── nexotype/            — Main module
│   │   ├── schemas/         — Zod validation schemas (10 domain dirs)
│   │   ├── service/         — API call functions (10 domain dirs + graph/)
│   │   ├── hooks/           — React Query hooks (10 domain dirs)
│   │   ├── store/           — Zustand stores (10 domain dirs)
│   │   ├── providers/       — Context providers (9 domain dirs + nexotype-providers.tsx)
│   │   ├── components/      — Shared components (graph/)
│   │   └── utils/           — api.endpoints.ts (API_BASE_URL + all endpoint URLs)
│   └── shadcnui/            — UI component library
```

Each entity has a consistent full-stack pattern:
- Backend: model → schema → subrouter → router.py mount
- Frontend: schema → service → hook → store → provider → page

## MCP Server — `mcp/src/nexotype_mcp/`

Separate pip package (`nexotype-mcp` on PyPI). Consumed by Claude Desktop, Claude Code, Codex, ChatGPT.

```
mcp/src/nexotype_mcp/
├── server.py      — FastMCP instance, main() for stdio, main_http() for HTTP transport
├── config.py      — API_BASE_URL (defaults to production: https://server.nexotype.com)
├── client.py      — HTTP client wrapper for API calls
└── tools/
    ├── search.py  — EntityType Literal (all 61 types), search_entities(), search_graph()
    ├── graph.py   — explore_network(), shortest_path(), find_similar(), company_portfolio(), drug_discovery(), competitive_landscape()
    ├── context.py — set_subject()
    └── user.py    — create_biomarker_reading(), create_treatment_log(), upload_genomic_file()
```

CRITICAL: `EntityType` Literal in `tools/search.py` must stay in sync with backend entities. If a new entity is added to backend, it MUST be added to this Literal too.

## SurrealDB Layer — `server/apps/nexotype/surrealdb/`

Graph database for knowledge graph traversals. PostgreSQL is source of truth; SurrealDB is a read-only sync target.

- `db.py` — Connection with health check (`RETURN 1`) and automatic reconnect on dead WebSocket
- `services/sync_service.py` — Syncs PostgreSQL → SurrealDB (NODE_MAP: 61 tables, EDGE_MAP: 79 edges)
- `services/graph_service.py` — Native wildcard traversal (`->(?).{id, in, out}`), BFS per level
- `schemas/graph_mappings.py` — Centralized NODE_MAP, EDGE_MAP, LABEL_FIELD_MAP

## How to Review Each File Type

### Model (`models/*_models.py`)
- Inherits `BaseMixin` + `OwnableMixin` (except `NexotypeAuditLog` which has neither)
- `__tablename__` is set, unique across all models
- `__table_args__` is ONE tuple, placed AFTER all fields (at the end of the class)
- No duplicate `__table_args__` in same class (second silently overwrites first — Python class attribute)
- ForeignKey references point to existing `__tablename__` values
- `relationship()` back_populates match on both sides
- GIN trigram indexes: `Index("ix_{table}_{col}_trgm", "{col}", postgresql_using="gin", postgresql_ops={"{col}": "gin_trgm_ops"})`
- UniqueConstraint names follow `uq_{entity}` or `uq_{entity}_{fields}` pattern
- CheckConstraint names follow `ck_{entity}_{rule}` pattern
- Polymorphic models (SmallMolecule, Biologic, etc.) have `__mapper_args__ = {"polymorphic_identity": "..."}`

### Backend Schema (`schemas/{domain}/*_schemas.py`)
- Has `Create`, `Update`, `Detail`, `Response`, `ListResponse`, `MessageResponse` classes
- `Create` — fields the client sends to create a record (no id, no timestamps, no audit fields)
- `Update` — all fields optional (`exclude_unset=True` in subrouter)
- `Detail` — all fields including id, timestamps, audit fields. Used in responses
- `Response` — `success: bool` + `data: Detail`
- `ListResponse` — `success: bool` + `data: list[Detail]` + `count: int`
- Field types match the corresponding model exactly (String → str, Integer → int, Float → float, etc.)
- Optional fields match model nullability (`Mapped[str | None]` → `field: str | None = None`)

### Subrouter (`subrouters/{domain}/*_subrouter.py`)
- Has `import logging` + `logger = logging.getLogger(__name__)` at top level (not inside function body)
- Imports `apply_search_filter` from `filtering_utils`
- 5 endpoints: `GET /` (list), `GET /{id}` (detail), `POST /` (create), `PUT /{id}` (update), `DELETE /{id}` (soft delete)
- List endpoint has `search: str | None = None` parameter
- List endpoint calls `apply_default_filters()` + `apply_scope_filter()` + `apply_search_filter()` on BOTH count query AND data query
- Create/Update/Delete use `crud_utils`: `create_with_audit()`, `update_with_audit()`, `soft_delete_with_audit()`
- Create/Update have `await db.rollback()` in except block
- All `except Exception as e` blocks: `logger.exception(f"Failed to {action} {entity}: {e}")` + `raise HTTPException(status_code=500, detail="Internal server error")`
- Never `detail=f"...{str(e)}"` or `detail=f"...{e}"` — information disclosure
- `except HTTPException: raise` before `except Exception` — re-raises 400/404/409 without catching them as 500

### Router (`router.py`)
- Every subrouter mounted with `include_router(router, prefix="/entity-name")`
- Prefix uses kebab-case: `/therapeutic-assets`, `/patent-claims`, `/organization-technology-platforms`
- SurrealDB routers mounted at the end (graph, sync, search, ai)

### Utils (`utils/*.py`)
- `crud_utils.py` — `create_with_audit()`, `update_with_audit()`, `soft_delete_with_audit()`, `get_owned_record_or_404()`, `check_duplicate()`
- `filtering_utils.py` — `apply_default_filters()` (soft delete + ownership), `apply_scope_filter()` (all/curated/own), `apply_search_filter()` (ILIKE on SEARCH_FIELD_MAP column), `SEARCH_FIELD_MAP` (61 models → search column)
- `dependency_utils.py` — `get_user_organization_id()` (from user → org member → org id)
- `audit_utils.py` — `log_audit()` query helpers

### SurrealDB DB (`surrealdb/db.py`)
- `get_surreal()` — health check with `RETURN 1`, auto-reconnect on dead WebSocket
- One global `_surreal_client` singleton (lazy initialized)
- `close_surreal()` for shutdown
- `surreal_session()` context manager for non-FastAPI usage (ingestion scripts)

### SurrealDB Graph Service (`surrealdb/services/graph_service.py`)
- Uses native wildcard `->(?).{id, in, out}` — NOT manual EDGE_MAP iteration
- `_VALID_TABLES = set(NODE_MAP.keys())` — defense-in-depth against injection
- Exceptions caught silently (logger.error + return empty) — subrouter handles 503
- `_parse_record_id()` handles both `table:id` and `table:⟨id⟩` formats
- `_record_to_node()` uses `LABEL_FIELD_MAP` for display labels

### SurrealDB Graph Subrouter (`surrealdb/subrouters/graph_subrouter.py`)
- `_validate_entity_type()` checks against `NODE_MAP.keys()` whitelist before ANY query
- 6 endpoints: network, path, similar, company, drug-discovery, competitive
- Error handling: `logger.exception(f"...")` + `raise HTTPException(503, detail="Graph service unavailable")`
- Never exposes internal errors to client

### SurrealDB Graph Mappings (`surrealdb/schemas/graph_mappings.py`)
- `NODE_MAP` — 61 entries: `{"gene": Gene, "protein": Protein, ...}`
- `EDGE_MAP` — 79 entries: `[{"edge": "belongs_to", "source": "gene", "target": "organism"}, ...]`
- `LABEL_FIELD_MAP` — 61 entries: `{"gene": "hgnc_symbol", "protein": "uniprot_accession", ...}`
- Must stay in sync with models — new model = new entry in all 3 maps

### Frontend Schema (`modules/nexotype/schemas/{domain}/*.ts`)
- Zod schemas matching backend Pydantic schemas field by field
- `createSchema` for form validation on create
- `updateSchema` for form validation on update
- Field types match: `z.string()`, `z.number()`, `z.string().nullable()`, `z.enum([...])`

### Frontend Service (`modules/nexotype/service/{domain}/*.ts`)
- One function per endpoint: `list{Entity}()`, `get{Entity}()`, `create{Entity}()`, `update{Entity}()`, `delete{Entity}()`
- Uses `fetchClient<ResponseType>(ENDPOINTS.LIST)` from `fetch.client.ts`
- Endpoints from `api.endpoints.ts` — URL must match backend `router.py` prefix exactly

### Frontend Hook (`modules/nexotype/hooks/{domain}/*.ts`)
- React Query hooks wrapping service calls
- `use{Entities}()` — `useQuery` for list (with pagination, search, scope params)
- `use{Entity}(id)` — `useQuery` for detail
- `useCreate{Entity}()` — `useMutation` with `queryClient.invalidateQueries` on success
- `useUpdate{Entity}()` — `useMutation` with invalidation
- `useDelete{Entity}()` — `useMutation` with invalidation

### Frontend Store (`modules/nexotype/store/{domain}/*.ts`)
- Zustand store for UI state
- Selected item, filters, pagination (limit, offset), search term, scope
- Actions: `setSelected()`, `setFilters()`, `resetFilters()`

### Frontend Provider (`modules/nexotype/providers/{domain}/*.tsx`)
- React context composing hook + store
- Provides data + actions to page tree via `{Entity}Provider`
- Wraps children with context

### Frontend Page (`app/(nexotype)/{domain}/{entity}/page.tsx`)
- Uses provider to access data
- List page: table with pagination, search, scope filter, create button
- Detail page: read-only view with edit/delete buttons
- Create/Edit page: form using Zod schema validation

### MCP Tool (`mcp/src/nexotype_mcp/tools/*.py`)
- `@mcp.tool` decorator
- `EntityType` Literal parameter — must list all 61 entity types (sync with backend)
- Write tools have `annotations={"readOnlyHint": False, "destructiveHint": True/False}`
- Returns JSON string (MCP protocol requirement)
- Calls API via `client.py`, never accesses DB directly

## Cross-Layer Review Checklist

### Security
- No `detail=f"...{str(e)}"` or `detail=f"...{e}"` on 500 errors anywhere
- SurrealDB entity_type validated against whitelist before f-string queries
- Device flow: user_code 13 chars, rate limited
- CORS: only localhost:3000 + client.nexotype.com
- Auth: JWT access (30 min) + refresh (7 days)

### Data Ownership (Multi-tenant)
- Every domain model has `OwnableMixin` (is_curated + organization_id)
- Every list query uses `apply_default_filters()` (soft delete + ownership)
- Every single-record access uses `get_owned_record_or_404()`

### Audit Trail
- Every create/update/delete goes through `*_with_audit()` functions
- `NexotypeAuditLog` captures old_data/new_data JSON snapshots

### Database Indexes
- 18 pg_trgm GIN indexes on search columns
- No duplicate `__table_args__` in any class
- `SEARCH_FIELD_MAP` in filtering_utils.py has entry for every model that needs search

### Sync Points (things that must stay aligned)
- Backend model ↔ Backend schema (fields match)
- Backend schema ↔ Frontend schema (Zod mirrors Pydantic)
- Backend router.py prefix ↔ Frontend api.endpoints.ts URL
- Backend models ↔ SurrealDB graph_mappings.py (NODE_MAP, EDGE_MAP, LABEL_FIELD_MAP)
- Backend entities ↔ MCP EntityType Literal
- Backend filtering_utils.py SEARCH_FIELD_MAP ↔ models with search-enabled list endpoints

## Known Architectural Decisions (Not Bugs)

- `models/models.py` is a legacy monolith — kept as reference, `__init__.py` re-exports from domain files
- `neo4j/` directory exists but is unused (legacy, not imported anywhere)
- MCP server is a separate package, not mounted on FastAPI — intentional (avoids hairpin routing, keeps pip install standalone)
- `accounts/` app is shared across 4 projects (nexotype, finpy, nudgio, cystene) — changes propagated manually
- SurrealDB connection uses hardcoded defaults in `db.py` — same DB for local and production (`devops.finpy.tech:8001`)
- `algobot/`, `cryptobot/`, `ecommerce/` in server/apps/ are other apps on the same server, not part of nexotype
