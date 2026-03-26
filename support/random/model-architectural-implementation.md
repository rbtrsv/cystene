# Model Architectural Implementation Guide

## Quick Overview

```
models.py → subrouter.py → schema → endpoints → service → store → provider → register provider → hook → pages (list, new, detail) → sidebar
```

---

## Pre-Implementation Checklist

Before creating any files:

1. **Read the model in `models.py`** — understand fields, types, FKs, constraints
2. **Check if backend subrouter exists** — `server/apps/nexotype/subrouters/{model}_subrouter.py`
3. **Read the subrouter** — understand the API response shape (especially for polymorphic models where the subrouter flattens parent + child fields)
4. **Identify the model type:**
   - **Standalone NODE** (e.g., Organism, Indication) — simple CRUD
   - **Child NODE with FK** (e.g., Exon → Transcript, PeptideFragment → Protein) — needs FK selector in forms, filter by parent in list
   - **Polymorphic subclass** (e.g., SmallMolecule → TherapeuticAsset) — inherits parent fields, own table for extra fields
   - **RELATION / Junction table** (e.g., DrugInteraction, TherapeuticEfficacy) — links two NODEs, may have extra fields

---

## File Creation Order

Create files in this exact order. Each file depends on the one before it.

### Step 1: Schema
**Create:** `client/src/modules/nexotype/schemas/{model}.schemas.ts`
**Read first:** Any existing schema for reference pattern:
- Standalone model → read `organism.schemas.ts`
- Model with FK → read `exon.schemas.ts` or `peptide-fragment.schemas.ts`
- Polymorphic subclass → read `small-molecule.schemas.ts`

**Contains:**
- `{Model}Schema` — full Zod schema (all fields including id, created_at, updated_at)
- `Create{Model}Schema` — fields needed for POST (omit id, created_at, updated_at)
- `Update{Model}Schema` — partial of create schema
- Type exports: `{Model}`, `Create{Model}`, `Update{Model}`
- Response types: `{Model}Response`, `{Model}ListResponse`

### Step 2: API Endpoints
**Edit:** `client/src/modules/nexotype/utils/api.endpoints.ts`
**Read first:** The same file — follow the existing pattern exactly.

**Add:**
```typescript
export const {MODEL}_ENDPOINTS = {
  LIST: `${API_BASE_URL}/nexotype/{resource}/`,
  DETAIL: (id: number) => `${API_BASE_URL}/nexotype/{resource}/${id}/`,
  CREATE: `${API_BASE_URL}/nexotype/{resource}/`,
  UPDATE: (id: number) => `${API_BASE_URL}/nexotype/{resource}/${id}/`,
  DELETE: (id: number) => `${API_BASE_URL}/nexotype/{resource}/${id}/`,
};
```

### Step 3: Service
**Create:** `client/src/modules/nexotype/service/{model}.service.ts`
**Read first:** Any existing service for reference pattern:
- Simple model → read `organism.service.ts`
- Model with FK → read `peptide-fragment.service.ts`

**Contains:**
- `getAll()` — GET list
- `getById(id)` — GET detail
- `create(data)` — POST
- `update(id, data)` — PATCH
- `delete(id)` — DELETE
- All use `fetchClient` wrapper

### Step 4: Store
**Create:** `client/src/modules/nexotype/store/{model}.store.ts`
**Read first:** Any existing store for reference pattern:
- Read `variant.store.ts` or `organism.store.ts`

**Contains:**
- Zustand store with `immer` + `devtools` + `persist` middleware
- State: `items`, `selectedItem`, `isLoading`, `error`
- Actions: `fetchAll`, `fetchById`, `create`, `update`, `delete`, `setSelectedItem`, `clearError`
- Persist key: `nexotype-{model}-storage`

### Step 5: Provider
**Create:** `client/src/modules/nexotype/providers/{model}-provider.tsx`
**Read first:** Any existing provider for reference pattern:
- Read `variant-provider.tsx` or `organism-provider.tsx`

**Contains:**
- React Context wrapping the Zustand store (SSR safety)
- `{Model}Provider` component
- `use{Model}Context()` hook to access the context

### Step 6: Register Provider
**Edit:** `client/src/modules/nexotype/providers/nexotype-providers.tsx`
**Read first:** The same file — see existing nesting order.

**Do:**
- Import the new provider
- Add it to the nested provider tree (wrap around `{children}` or inside the last provider)

### Step 7: Hook
**Create:** `client/src/modules/nexotype/hooks/use-{models}.ts` (plural)
**Read first:** Any existing hook for reference pattern:
- Read `use-variants.ts` or `use-organisms.ts`

**Contains:**
- Combines context + store into a simplified interface
- Returns: `items`, `selectedItem`, `isLoading`, `error`, all actions
- Helper functions if needed (e.g., `getByName()`, `getByParentId()`)

### Step 8: Pages
**Create 3 pages:**

**8a. List Page:** `client/src/app/(nexotype)/{models}/page.tsx`
**Read first:** Existing list page for similar model type:
- Standalone → read `organisms/page.tsx`
- With FK parent → read `peptide-fragments/page.tsx`
- Polymorphic → read `small-molecules/page.tsx`

**Contains:**
- Card with Table inside
- Search/filter functionality
- Column sorting
- Link to `/new` and `/[id]/details`

**8b. Create Page:** `client/src/app/(nexotype)/{models}/new/page.tsx`
**Read first:** Existing create page:
- Simple → read `organisms/new/page.tsx`
- With FK selector → read `peptide-fragments/new/page.tsx`
- With special inputs (Textarea, etc.) → read `small-molecules/new/page.tsx`

**Contains:**
- TanStack Form with Zod validation
- Input fields matching `Create{Model}Schema`
- FK fields use `Select` component with data from parent hook
- Submit calls `create()` then navigates to list

**8c. Detail Page:** `client/src/app/(nexotype)/{models}/[id]/details/page.tsx`
**Read first:** Existing detail page:
- Read `variants/[id]/details/page.tsx` or `small-molecules/[id]/details/page.tsx`

**Contains:**
- Tabs: Overview + Settings
- Overview: read-only display of all fields in a Card
- Settings: delete with confirmation (type name/identifier to confirm)

### Step 9: Sidebar
**Edit:** `client/src/modules/nexotype/components/nexotype-sidebar.tsx`
**Read first:** The same file — see existing structure.

**Do:**
- Import the icon from `lucide-react`
- Add `SidebarMenuItem` in the correct section
- Follow existing pattern: `isActive()`, `tooltip`, `Link href`

---

## Reference Files by Model Type

### Standalone NODE (Organism, Indication, OntologyTerm)
```
Schema:    organism.schemas.ts
Service:   organism.service.ts
Store:     organism.store.ts
Provider:  organism-provider.tsx
Hook:      use-organisms.ts
List:      organisms/page.tsx
New:       organisms/new/page.tsx
Detail:    organisms/[id]/details/page.tsx
```

### Child NODE with FK (Exon → Transcript, PeptideFragment → Protein)
```
Schema:    peptide-fragment.schemas.ts
Service:   peptide-fragment.service.ts
Store:     peptide-fragment.store.ts
Provider:  peptide-fragment-provider.tsx
Hook:      use-peptide-fragments.ts
List:      peptide-fragments/page.tsx
New:       peptide-fragments/new/page.tsx
Detail:    peptide-fragments/[id]/details/page.tsx
```

### Polymorphic Subclass (SmallMolecule → TherapeuticAsset)
```
Schema:    small-molecule.schemas.ts
Service:   small-molecule.service.ts
Store:     small-molecule.store.ts
Provider:  small-molecule-provider.tsx
Hook:      use-small-molecules.ts
List:      small-molecules/page.tsx
New:       small-molecules/new/page.tsx
Detail:    small-molecules/[id]/details/page.tsx
```

---

## Common Patterns

### fetchClient
All services use `fetchClient` from `@/modules/accounts/utils/fetch-client`.
It wraps fetch with auth token injection and 401 token clearing.

### Zod Schema Pattern
```typescript
// Full schema (GET response)
export const ModelSchema = z.object({
  id: z.number(),
  // ... model fields
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// Create schema (POST body)
export const CreateModelSchema = z.object({
  // ... only user-provided fields
});

// Update schema (PATCH body)
export const UpdateModelSchema = CreateModelSchema.partial();

// Types
export type Model = z.infer<typeof ModelSchema>;
export type CreateModel = z.infer<typeof CreateModelSchema>;
export type UpdateModel = z.infer<typeof UpdateModelSchema>;

// Response types
export type ModelResponse = { success: boolean; data: Model };
export type ModelListResponse = { success: boolean; data: Model[] };
```

### Store Pattern (Zustand + Immer + Persist)
```typescript
persist(
  immer((set, get) => ({ ... })),
  { name: 'nexotype-{model}-storage' }
)
```

### Provider Pattern (React Context + Zustand)
```typescript
const Context = createContext<StoreType | null>(null);
export function ModelProvider({ children }) {
  const storeRef = useRef<StoreType>();
  if (!storeRef.current) storeRef.current = createModelStore();
  return <Context.Provider value={storeRef.current}>{children}</Context.Provider>;
}
```

---

## Backend Reference

- **Models:** `server/apps/nexotype/models.py`
- **Subrouters:** `server/apps/nexotype/subrouters/{model}_subrouter.py`
- **API base:** `/api/v1/nexotype/{resource}/`

Always read the subrouter before creating the schema — the API response shape may differ from the model (especially for polymorphic models where parent + child fields are flattened).
