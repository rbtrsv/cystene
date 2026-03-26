# Modern React State Management: Two Proven Patterns

## Introduction

This guide documents two proven state management patterns for React applications, based on real implementations:

1. **Server Actions Pattern**: Zustand + Context for Next.js apps with direct database access
2. **Hybrid Pattern**: React Query + Zustand for apps with API backends (with server actions for auth)

## Table of Contents

1. [Pattern 1: Server Actions + Zustand](#pattern-1-server-actions--zustand)
   - [Schema Definition](#schema-definition)
   - [Server Actions](#server-actions)
   - [Zustand Store](#zustand-store)
   - [Context Provider](#context-provider)
   - [Custom Hook](#custom-hook)
2. [Pattern 2: React Query + Zustand Hybrid](#pattern-2-react-query--zustand-hybrid)
   - [API Services](#api-services)
   - [React Query Implementation](#react-query-implementation)
   - [Zustand UI Store](#zustand-ui-store)
   - [Hybrid Hook](#hybrid-hook)
3. [Component Implementation](#component-implementation)
4. [When to Use Each Pattern](#when-to-use-each-pattern)
5. [Best Practices](#best-practices)

## Pattern 1: Server Actions + Zustand

**Architecture**: `Database → Schema → Permissions → Server Actions → Zustand Store → Context Provider → Custom Hook → Components`

**Use Case**: Next.js apps with Drizzle ORM and direct database access

### Schema Definition

```typescript
// schemas/item.schemas.ts
import { z } from 'zod';

export const itemStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export type ItemStatus = z.infer<typeof itemStatusEnum>;

export const ItemSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable(),
  status: itemStatusEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  status: itemStatusEnum.optional().default('ACTIVE'),
});

export const UpdateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
  status: itemStatusEnum.optional(),
});

export type Item = z.infer<typeof ItemSchema>;
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

export type ItemResponse = {
  success: boolean;
  data?: Item;
  error?: string;
};

export type ItemsResponse = {
  success: boolean;
  data?: Item[];
  error?: string;
};
```

### Server Actions

```typescript
// actions/items.actions.ts
'use server';

import { db } from '@/database/drizzle';
import { items } from '@/database/drizzle/schema';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { CreateItemSchema, UpdateItemSchema, type ItemResponse, type ItemsResponse } from '../schemas/item.schemas';

export async function getUserItems(): Promise<ItemsResponse> {
  return withAuth(async (profile) => {
    try {
      const result = await db.select().from(items)
        .where(eq(items.userId, profile.id));
        
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: 'Failed to fetch items' };
    }
  });
}

export async function createItem(data: unknown): Promise<ItemResponse> {
  const parsed = CreateItemSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  return withAuth(async (profile) => {
    try {
      const [newItem] = await db.insert(items).values({
        ...parsed.data,
        userId: profile.id
      }).returning();
      
      return { success: true, data: newItem };
    } catch (error) {
      return { success: false, error: 'Failed to create item' };
    }
  });
}

export async function updateItem(id: number, data: unknown): Promise<ItemResponse> {
  const parsed = UpdateItemSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  return withAuth(async (profile) => {
    try {
      const [updatedItem] = await db.update(items)
        .set(parsed.data)
        .where(and(eq(items.id, id), eq(items.userId, profile.id)))
        .returning();

      return { success: true, data: updatedItem };
    } catch (error) {
      return { success: false, error: 'Failed to update item' };
    }
  });
}

export async function deleteItem(id: number): Promise<{ success: boolean; error?: string }> {
  return withAuth(async (profile) => {
    try {
      await db.delete(items)
        .where(and(eq(items.id, id), eq(items.userId, profile.id)));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete item' };
    }
  });
}
```

### Zustand Store

```typescript
// store/items.store.ts
'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getUserItems, createItem, updateItem, deleteItem } from '../actions/items.actions';
import type { Item, ItemStatus } from '../schemas/item.schemas';

interface ItemsState {
  // State
  items: Item[];
  selectedItem: Item | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchItems: () => Promise<void>;
  fetchItem: (id: number) => Promise<void>;
  addItem: (name: string, description?: string | null, status?: ItemStatus) => Promise<boolean>;
  editItem: (id: number, name?: string, description?: string | null, status?: ItemStatus) => Promise<boolean>;
  removeItem: (id: number) => Promise<boolean>;
  setSelectedItem: (item: Item | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useItemsStore = create<ItemsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        items: [],
        selectedItem: null,
        isLoading: false,
        error: null,
        
        fetchItems: async () => {
          set({ isLoading: true, error: null });
          try {
            const response = await getUserItems();
            if (response.success) {
              set((state) => {
                state.items = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ isLoading: false, error: response.error || 'Failed to fetch items' });
            }
          } catch (error) {
            set({ isLoading: false, error: 'An unexpected error occurred' });
          }
        },
        
        addItem: async (name, description, status) => {
          set({ isLoading: true, error: null });
          try {
            const response = await createItem({ name, description, status });
            if (response.success && response.data) {
              set((state) => {
                state.items.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ isLoading: false, error: response.error || 'Failed to create item' });
              return false;
            }
          } catch (error) {
            set({ isLoading: false, error: 'An unexpected error occurred' });
            return false;
          }
        },
        
        // ... other actions follow same pattern
        
        setSelectedItem: (item) => set({ selectedItem: item }),
        clearError: () => set({ error: null }),
        reset: () => set({ items: [], selectedItem: null, isLoading: false, error: null })
      })),
      {
        name: 'items-storage',
        partialize: (state) => ({ items: state.items }),
      }
    )
  )
);
```

### Context Provider

```typescript
// providers/items-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useItemsStore } from '../store/items.store';
import type { Item } from '../schemas/item.schemas';

export interface ItemsContextType {
  items: Item[];
  selectedItem: Item | null;
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  fetchItem: (id: number) => Promise<void>;
  setSelectedItem: (item: Item | null) => void;
  clearError: () => void;
}

const ItemsContext = createContext<ItemsContextType | null>(null);

export function ItemsProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  const {
    items, selectedItem, isLoading, error,
    fetchItems, fetchItem, setSelectedItem, clearError
  } = useItemsStore();
  
  useEffect(() => {
    let isMounted = true;
    if (initialFetch) {
      fetchItems().catch(error => {
        if (isMounted) console.error('Error fetching items:', error);
      });
    }
    return () => { isMounted = false; };
  }, [initialFetch, fetchItems]);
  
  const contextValue = useMemo<ItemsContextType>(() => ({
    items, selectedItem, isLoading, error,
    fetchItems, fetchItem, setSelectedItem, clearError
  }), [items, selectedItem, isLoading, error, fetchItems, fetchItem, setSelectedItem, clearError]);
  
  return (
    <ItemsContext.Provider value={contextValue}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItemsContext(): ItemsContextType {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItemsContext must be used within an ItemsProvider');
  }
  return context;
}
```

### Custom Hook

```typescript
// hooks/use-items.ts
'use client';

import { useItemsContext } from '../providers/items-provider';
import { useItemsStore } from '../store/items.store';
import type { Item, ItemStatus } from '../schemas/item.schemas';

export function useItems() {
  // Get data from context
  const {
    items, selectedItem, isLoading: contextLoading, error: contextError,
    fetchItems, fetchItem, setSelectedItem, clearError: clearContextError
  } = useItemsContext();

  // Get actions from store
  const {
    addItem, editItem, removeItem, error: storeError, isLoading: storeLoading,
    clearError: clearStoreError
  } = useItemsStore();

  // Combine states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  return {
    // State
    items, selectedItem, isLoading, error,
    
    // Actions
    fetchItems, fetchItem, addItem, editItem, removeItem, setSelectedItem, clearError,
    
    // Helpers
    hasItems: () => items.length > 0,
    getItemById: (id: number) => items.find(i => i.id === id),
    getItemsByStatus: (status: ItemStatus) => items.filter(i => i.status === status)
  };
}
```

## Pattern 2: React Query + Zustand Hybrid

**Architecture**: `API Backend → Services → React Query + Zustand → Custom Hook → Components`

**Use Case**: Apps with Django/API backends (server actions only for auth)

### API Services

```typescript
// services/items.service.ts
'use client';

import { fetchClient } from '@/utils/fetch-client';
import { API_ENDPOINTS } from '@/utils/api-endpoints';
import type { ItemResponse, ItemsResponse, CreateItemInput, UpdateItemInput } from '../schemas/item.schemas';

export const getItems = async (): Promise<ItemsResponse> => {
  try {
    return await fetchClient<ItemsResponse>(API_ENDPOINTS.ITEMS.LIST);
  } catch (error) {
    return { success: false, error: 'Failed to fetch items', data: [] };
  }
};

export const createItem = async (data: CreateItemInput): Promise<ItemResponse> => {
  try {
    return await fetchClient<ItemResponse>(API_ENDPOINTS.ITEMS.CREATE, {
      method: 'POST',
      body: data
    });
  } catch (error) {
    return { success: false, error: 'Failed to create item' };
  }
};

export const updateItem = async (id: number, data: UpdateItemInput): Promise<ItemResponse> => {
  try {
    return await fetchClient<ItemResponse>(API_ENDPOINTS.ITEMS.UPDATE(id), {
      method: 'PUT',
      body: data
    });
  } catch (error) {
    return { success: false, error: 'Failed to update item' };
  }
};

export const deleteItem = async (id: number): Promise<{ success: boolean; error?: string }> => {
  try {
    return await fetchClient(API_ENDPOINTS.ITEMS.DELETE(id), { method: 'DELETE' });
  } catch (error) {
    return { success: false, error: 'Failed to delete item' };
  }
};
```

### React Query Implementation

```typescript
// hooks/use-items-query.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItems, createItem, updateItem, deleteItem } from '../services/items.service';
import { createQueryKey } from '@/utils/react-query-client';
import type { CreateItemInput, UpdateItemInput } from '../schemas/item.schemas';

export function useItemsQuery() {
  const queryClient = useQueryClient();
  
  // Fetch items query
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: createQueryKey('items'),
    queryFn: async () => {
      const response = await getItems();
      if (!response.success) throw new Error(response.error);
      return response.data || [];
    }
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateItemInput) => createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('items') });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateItemInput }) => updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('items') });
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('items') });
    },
  });
  
  return {
    items,
    isLoading,
    error: error instanceof Error ? error.message : null,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

### Zustand UI Store

```typescript
// store/items-ui.store.ts
'use client';

import { create } from 'zustand';
import type { Item } from '../schemas/item.schemas';

interface ItemsUIState {
  selectedItemId: number | null;
  searchTerm: string;
  activeFilters: { status?: string };
  
  setSelectedItemId: (id: number | null) => void;
  setSearchTerm: (term: string) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  reset: () => void;
}

export const useItemsUIStore = create<ItemsUIState>((set) => ({
  selectedItemId: null,
  searchTerm: '',
  activeFilters: {},
  
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilter: (key, value) => set((state) => ({
    activeFilters: { ...state.activeFilters, [key]: value }
  })),
  clearFilters: () => set({ activeFilters: {} }),
  reset: () => set({ selectedItemId: null, searchTerm: '', activeFilters: {} })
}));
```

### Hybrid Hook

```typescript
// hooks/use-items.ts
'use client';

import { useItemsQuery } from './use-items-query';
import { useItemsUIStore } from '../store/items-ui.store';
import type { CreateItemInput, UpdateItemInput, ItemStatus } from '../schemas/item.schemas';

export function useItems() {
  // React Query for server state
  const {
    items, isLoading, error, createItem, updateItem, deleteItem,
    isCreating, isUpdating, isDeleting
  } = useItemsQuery();
  
  // Zustand for UI state
  const {
    selectedItemId, searchTerm, activeFilters,
    setSelectedItemId, setSearchTerm, setFilter, clearFilters
  } = useItemsUIStore();
  
  // Find selected item
  const selectedItem = items.find(item => item.id === selectedItemId) || null;
  
  // Apply filters
  const filteredItems = items.filter(item => {
    if (activeFilters.status && item.status !== activeFilters.status) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
  
  // Wrapper functions for consistent API
  const addItem = async (name: string, description?: string | null, status?: ItemStatus) => {
    return await createItem({ name, description, status });
  };
  
  const editItem = async (id: number, name?: string, description?: string | null, status?: ItemStatus) => {
    return await updateItem({ id, data: { name, description, status } });
  };
  
  const removeItem = async (id: number) => {
    await deleteItem(id);
    if (selectedItemId === id) setSelectedItemId(null);
    return true;
  };
  
  const fetchItem = (id: number) => setSelectedItemId(id);
  
  return {
    // State
    items: filteredItems,
    selectedItem,
    isLoading: isLoading || isCreating || isUpdating || isDeleting,
    error,
    
    // Search/Filter
    searchTerm, setSearchTerm, activeFilters, setFilter, clearFilters,
    
    // Actions
    fetchItem, addItem, editItem, removeItem,
    
    // Helpers
    getItemById: (id: number) => items.find(i => i.id === id),
    getItemsByStatus: (status: ItemStatus) => items.filter(i => i.status === status)
  };
}
```

## Component Implementation

### List Component (Shortened)

```tsx
// components/item-list.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useItems } from '../hooks/use-items';
import { Card, Button, Input, Table, /* ... */ } from '@/components/ui';
import { Plus, Search, Edit, Trash, Eye } from 'lucide-react';

export function ItemList() {
  const router = useRouter();
  const { items, isLoading, error, searchTerm, setSearchTerm, removeItem } = useItems();
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  
  // ... handlers
  
  if (isLoading) return <div>Loading items...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <Card>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Items</h1>
          <Button onClick={() => router.push('/items/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
        
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        
        <Table>
          {/* ... table headers */}
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => router.push(`/items/${item.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => router.push(`/items/${item.id}/edit`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setItemToDelete(item.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Delete confirmation dialog... */}
      </div>
    </Card>
  );
}
```

### Detail Component (Shortened)

```tsx
// components/item-detail.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useItems } from '../hooks/use-items';
import { Card, Button } from '@/components/ui';
import { ArrowLeft, Edit, Trash } from 'lucide-react';

interface ItemDetailProps {
  id: number;
}

export function ItemDetail({ id }: ItemDetailProps) {
  const router = useRouter();
  const { selectedItem, isLoading, error, fetchItem, removeItem } = useItems();
  
  useEffect(() => {
    fetchItem(id);
  }, [id, fetchItem]);
  
  // ... handlers
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!selectedItem) return <div>Item not found</div>;
  
  return (
    <Card>
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.push('/items')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Items
        </Button>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{selectedItem.name}</h1>
          <Badge>{selectedItem.status}</Badge>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p>{selectedItem.description || 'No description provided.'}</p>
        </div>
        
        {/* ... more details */}
        
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/items/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

### Form Component (Shortened)

```tsx
// components/item-form.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useItems } from '../hooks/use-items';
import { Card, Button, Input, Label } from '@/components/ui';
import { ArrowLeft, Save } from 'lucide-react';

interface ItemFormProps {
  id?: number;
}

export function ItemForm({ id }: ItemFormProps) {
  const router = useRouter();
  const { selectedItem, isLoading, error, fetchItem, addItem, editItem } = useItems();
  const isEditMode = !!id;
  
  const form = useForm({
    defaultValues: { name: '', description: '', status: 'ACTIVE' },
    onSubmit: async ({ value }) => {
      if (isEditMode && id) {
        await editItem(id, value.name, value.description, value.status);
        router.push(`/items/${id}`);
      } else {
        await addItem(value.name, value.description, value.status);
        router.push('/items');
      }
    },
  });
  
  // ... useEffects and handlers
  
  if (isLoading && isEditMode) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <Card>
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.push('/items')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? 'Edit Item' : 'Create New Item'}
        </h1>
        
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div className="space-y-4">
            <form.Field name="name">
              {(field) => (
                <div>
                  <Label>Name</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter item name"
                  />
                  {/* ... field errors */}
                </div>
              )}
            </form.Field>
            
            {/* ... more fields */}
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/items')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? 'Save Changes' : 'Create Item'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}
```

## When to Use Each Pattern

### Server Actions Pattern
**Best for:**
- Next.js apps with direct database access
- Small to medium applications
- Teams comfortable with full-stack development
- When you want end-to-end type safety

**Trade-offs:**
- Simpler architecture but less flexibility
- Single deployment unit
- Better performance but harder to scale teams

### Hybrid Pattern
**Best for:**
- Apps with separate API backends
- Large applications with complex caching needs
- Teams with frontend/backend specialists
- When you need independent service scaling

**Trade-offs:**
- More complex but more flexible
- Better caching but more network overhead
- Separate deployments but coordination complexity

## Best Practices

1. **Choose the right pattern** based on your team and architecture
2. **Keep state concerns separated** - server state vs UI state
3. **Use TypeScript everywhere** for type safety
4. **Implement consistent error handling** across your app
5. **Combine loading states** in custom hooks for better UX
6. **Use proper dependency arrays** in useEffect
7. **Persist only necessary data** in Zustand stores

Both patterns provide robust, scalable solutions. Choose based on your specific needs and constraints.