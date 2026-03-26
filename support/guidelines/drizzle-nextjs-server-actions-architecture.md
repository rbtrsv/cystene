# Application Architecture: From Database to UI

## Overview

This application follows a systematic layered architecture with clean separation of concerns. The pattern (Database / FastAPI → Schema → Permissions → Server Actions / Client Service → Zustand Store → Context Provider → Custom Hook → Components for each entity) provides consistency and maintainability across the codebase.

## Architecture Layers

### 1. Database Schema (Drizzle)
- Defines database tables and relationships in TypeScript
- Located in `database/drizzle/schema/` (e.g., `captable.ts`)
- Uses consolidated tables with discriminator fields for polymorphic entities (e.g., `securityType`)

### 2. Zod Schemas
- Defines TypeScript types and validation schemas
- Located in `src/modules/assetmanager/schemas/` (e.g., `security.schemas.ts`)
- Includes:
  - Entity schemas (full representation)
  - Input validation for create/update operations
  - Response types for API calls

### 3. Server Actions
- Implements CRUD operations as server actions
- Located in `src/modules/assetmanager/actions/` (e.g., `securities.actions.ts`)
- Features:
  - Authentication and authorization via `withAuth` wrapper
  - Type conversion between database and application models
  - Standardized response objects

### 4. Client-Side Store (Zustand)
- Manages client-side state
- Located in `src/modules/assetmanager/store/` (e.g., `securities.store.ts`)
- Provides:
  - Methods to interact with server actions
  - Loading and error states
  - Local persistence where needed

### 5. Context Provider
- Creates React context for entity access
- Located in `src/modules/assetmanager/providers/` (e.g., `securities-provider.tsx`)
- Handles:
  - Initial data fetching
  - Wrapping store in React context
  - Exposing store methods to components

### 6. Custom Hook
- Combines context and store functionality
- Located in `src/modules/assetmanager/hooks/` (e.g., `use-securities.ts`)
- Provides:
  - Unified interface for components
  - Helper methods for common operations
  - Simplified state management

### 7. UI Components
After implementing the above layers, they feed into three main UI component types:

#### List Components (e.g., `SecurityList.tsx`)
```tsx
// Example usage
const { securities, isLoading, error, fetchSecurities, removeSecurity } = useSecurities();

useEffect(() => {
  fetchSecurities();
}, [fetchSecurities]);

// Render table with securities data
```

#### Detail Components (e.g., `SecurityDetail.tsx`)
```tsx
// Example usage
const { selectedSecurity, isLoading, error, fetchSecurity } = useSecurities();

useEffect(() => {
  if (id) {
    fetchSecurity(Number(id));
  }
}, [id, fetchSecurity]);

// Render detailed view of the security
```

#### Form Components (e.g., `SecurityForm.tsx`)
```tsx
// Example usage
const { addSecurity, editSecurity, selectedSecurity, isLoading } = useSecurities();

const onSubmit = async (data) => {
  if (mode === 'edit' && selectedSecurity?.id) {
    await editSecurity(selectedSecurity.id, data);
  } else {
    await addSecurity(data);
  }
};

// Render form with appropriate fields based on security type
```

### 8. Next.js 15 Page Components

**Important for Next.js 15**: All dynamic route pages must use async params pattern:

#### Page Component Pattern (`app/dashboard/entities/[id]/page.tsx`)
```tsx
import { Metadata } from 'next';
import EntityDetail from '@/modules/assetmanager/components/entities/entity-detail';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';

export const metadata: Metadata = {
  title: 'Entity Details',
  description: 'View and manage entity details',
};

type EntityDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EntityDetailPage({ params }: EntityDetailPageProps) {
  const { id } = await params;
  const entityId = parseInt(id, 10);
  
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="p-0">
          <EntityDetail id={entityId} />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Key Requirements:**
- Always type `params` as `Promise<{ id: string }>` (never use union types)
- Always `await params` before destructuring
- Include `searchParams` type for consistency
- Convert string IDs to numbers when needed

## Benefits of This Architecture

1. **Consistency** - Each entity follows the same pattern
2. **Separation of Concerns** - Clear boundaries between layers
3. **Type Safety** - Full TypeScript support throughout the stack
4. **Testability** - Each layer can be tested in isolation
5. **Scalability** - Easy to add new entities or modify existing ones
6. **Developer Experience** - Predictable patterns reduce cognitive load
7. **Maintainability** - Clear organization makes code easier to maintain

This architecture creates a robust foundation for building complex business applications with multiple related entities and operations.