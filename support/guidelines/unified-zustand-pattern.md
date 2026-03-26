# Unified Zustand Pattern for Finpy

## Pattern Overview

The Unified Zustand Pattern is a proven state management architecture that centralizes all application state in Zustand stores. This pattern supports both server actions and HTTP services as input sources while maintaining a consistent flow through the application.

## Architecture Flow

```
[Server Actions OR HTTP Services] → Zustand Store → Provider → Hook → Components
```

### Input Sources
- **Server Actions**: For authentication flows, server-side operations
- **HTTP Services**: For data fetching, CRUD operations, API calls

### Core Principle
Regardless of the input source, all state management flows through the same unified architecture with Zustand stores as the central hub.

## Key Characteristics

1. **Single Source of Truth**: Zustand store handles ALL state (server + UI)
2. **Direct Input Calls**: Store methods call server actions OR services directly
3. **Simple Provider**: Just passes through store state
4. **Proven Pattern**: Battle-tested in V7Capital production
5. **Consistent Architecture**: Same pattern across all modules

## Pattern Components

### 1. Input Layer (Server Actions OR Services)

#### Server Actions Example (`auth.actions.ts`)
```typescript
'use server';

export async function login(credentials: LoginInput): Promise<ApiResponse<UserWithOrganizations>> {
  // Server-side authentication logic
}

export async function logout(): Promise<ApiResponse<void>> {
  // Server-side logout logic
}

export async function getCurrentUser(): Promise<ApiResponse<UserWithOrganizations>> {
  // Server-side user fetching logic
}
```

#### HTTP Services Example (`organizations.service.ts`)
```typescript
'use client';

export const organizationsService = {
  async getAll(): Promise<ApiResponse<Organization[]>> {
    return await fetchClient('/api/accounts/organizations/');
  },
  
  async getById(id: number): Promise<ApiResponse<Organization>> {
    return await fetchClient(`/api/accounts/organizations/${id}/`);
  },
  
  async create(data: CreateOrganizationInput): Promise<ApiResponse<Organization>> {
    return await fetchClient('/api/accounts/organizations/', {
      method: 'POST',
      body: data
    });
  }
};
```

### 2. Store Layer (Zustand)

#### With Server Actions (`auth.store.ts`)
```typescript
'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  login as loginAction,
  logout as logoutAction,
  getCurrentUser as getCurrentUserAction
} from '../actions/auth.actions';

export interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions (all async operations in store)
  login: (credentials: LoginInput) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        user: null,
        isLoading: false,
        error: null,
        isInitialized: false,
        
        // Actions call server actions directly
        login: async (credentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await loginAction(credentials);
            
            if (response.success && response.data) {
              set(state => {
                state.user = response.data.user;
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to login'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        logout: async () => {
          set({ isLoading: true });
          
          try {
            await logoutAction();
            set({ 
              user: null, 
              isLoading: false, 
              isInitialized: false 
            });
          } catch (error) {
            set({ isLoading: false });
          }
        },
        
        initialize: async () => {
          set({ isLoading: true });
          
          try {
            const response = await getCurrentUserAction();
            
            if (response.success && response.data) {
              set(state => {
                state.user = response.data.user;
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({ isInitialized: true, isLoading: false });
            }
          } catch (error) {
            set({ isInitialized: true, isLoading: false });
          }
        },
        
        clearError: () => {
          set({ error: null });
        }
      })),
      {
        name: 'finpy-auth-storage',
        partialize: (state) => ({
          user: state.user,
          isInitialized: state.isInitialized,
        }),
      }
    )
  )
);
```

#### With HTTP Services (`organizations.store.ts`)
```typescript
'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { organizationsService } from '../service/organizations.service';

export interface OrganizationsState {
  // State
  organizations: Organization[];
  activeOrganizationId: number | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions (all async operations in store)
  fetchOrganizations: () => Promise<void>;
  createOrganization: (data: CreateOrganizationInput) => Promise<boolean>;
  updateOrganization: (id: number, data: UpdateOrganizationInput) => Promise<boolean>;
  deleteOrganization: (id: number) => Promise<boolean>;
  setActiveOrganization: (id: number | null) => void;
  clearError: () => void;
}

export const useOrganizationsStore = create<OrganizationsState>()(
  devtools(
    immer((set, get) => ({
      // State
      organizations: [],
      activeOrganizationId: null,
      isLoading: false,
      error: null,
      
      // Actions call services directly
      fetchOrganizations: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await organizationsService.getAll();
          
          if (response.success && response.data) {
            set(state => {
              state.organizations = response.data || [];
              state.isLoading = false;
              
              // Set active organization if not already set
              if (response.data && response.data.length > 0 && state.activeOrganizationId === null) {
                state.activeOrganizationId = response.data[0].id;
              }
            });
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to fetch organizations'
            });
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
        }
      },
      
      createOrganization: async (data) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await organizationsService.create(data);
          
          if (response.success && response.data) {
            // After creating, refresh organizations list
            await get().fetchOrganizations();
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Failed to create organization'
            });
            return false;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },
      
      updateOrganization: async (id, data) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await organizationsService.update(id, data);
          
          if (response.success) {
            // After updating, refresh organizations list
            await get().fetchOrganizations();
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || `Failed to update organization with ID ${id}`
            });
            return false;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },
      
      deleteOrganization: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await organizationsService.delete(id);
          
          if (response.success) {
            // Clear active organization if it's the one being deleted
            set(state => {
              if (state.activeOrganizationId === id) {
                state.activeOrganizationId = null;
              }
            });
            
            // After deleting, refresh organizations list
            await get().fetchOrganizations();
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || `Failed to delete organization with ID ${id}`
            });
            return false;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },
      
      setActiveOrganization: (id) => {
        set(state => {
          state.activeOrganizationId = id;
        });
      },
      
      clearError: () => {
        set({ error: null });
      }
    }))
  )
);
```

### 3. Provider Layer

The provider layer remains consistent regardless of input source - it simply passes through store state.

```typescript
'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';

export interface AuthContextType {
  // State passthrough from store
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions passthrough from store
  initialize: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialFetch = true }: AuthProviderProps) {
  // Get state and actions from the store
  const {
    user,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  } = useAuthStore();
  
  // Initial fetch on mount
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing auth:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);
  
  // Memoize context value
  const contextValue = useMemo(() => ({
    user,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  }), [user, isLoading, error, isInitialized, initialize, clearError]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}
```

### 4. Hook Layer

The hook layer combines context and store regardless of input source.

```typescript
'use client';

/**
 * Main hook that combines auth context and store
 * to provide a unified interface for auth functionality
 */
export function useAuth() {
  // Get data from auth context
  const {
    user,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    clearError: clearContextError
  } = useAuthContext();

  // Get additional actions from auth store
  const {
    login,
    logout,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useAuthStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  return {
    // State
    user,
    isLoading,
    error,
    isInitialized,
    
    // Actions (from store - whether server actions or services)
    login,
    logout,
    initialize,
    clearError,
    
    // Helper methods
    isAuthenticated: !!user,
    getUserName: () => user?.name || 'Unknown User',
    getUserEmail: () => user?.email || '',
    getUserId: () => user?.id || null,
    getUserRole: () => user?.role || null
  };
}
```

## Pattern Benefits

### 1. **Unified Architecture**
- Same pattern regardless of input source (server actions vs services)
- Consistent state management across all modules
- Predictable data flow throughout application

### 2. **Centralized State**
- All state lives in Zustand stores
- Single source of truth for each module
- Easy debugging and state inspection

### 3. **Flexible Input Sources**
- Works with Next.js server actions for auth flows
- Works with HTTP services for data operations
- Can mix both approaches in same application

### 4. **Simple Provider Layer**
- Providers just pass through store state
- No complex logic in providers
- Easy to test and maintain

### 5. **Proven in Production**
- Battle-tested pattern from V7Capital
- No React Query complexity
- Predictable performance characteristics

## Implementation Strategy

### For New Modules

1. **Choose Input Source**:
   - Server Actions: For auth, server-side operations
   - HTTP Services: For data fetching, CRUD operations

2. **Create Store**: 
   - Define state interface
   - Implement async actions that call your chosen input source
   - Handle loading/error states consistently

3. **Create Provider**: 
   - Pass through store state
   - Handle initialization if needed

4. **Create Hook**: 
   - Combine context + store
   - Add helper methods
   - Provide unified interface

### For Existing Modules

1. **Identify Current Pattern**: 
   - React Query + Zustand?
   - Pure server actions?
   - Mixed patterns?

2. **Choose Target Input Source**:
   - Server actions for auth-like modules
   - Services for data-heavy modules

3. **Migrate Store**:
   - Move async operations into store
   - Remove React Query if present
   - Consolidate state management

4. **Update Provider**:
   - Simplify to store passthrough
   - Remove React Query provider if present

5. **Refactor Hook**:
   - Remove React Query hooks
   - Use store methods directly

## Module Recommendations

### Use Server Actions For:
- ✅ Authentication modules
- ✅ User session management  
- ✅ Server-side form submissions
- ✅ Operations requiring server-side validation

### Use HTTP Services For:
- ✅ Data fetching and display
- ✅ CRUD operations
- ✅ Real-time data updates
- ✅ Complex data relationships

## File Structure

```
modules/{domain}/
├── actions/          # Server actions (if using server actions)
│   └── auth.actions.ts
├── service/          # HTTP services (if using services)
│   └── organizations.service.ts
├── store/            # Zustand stores (always present)
│   ├── auth.store.ts
│   └── organizations.store.ts
├── providers/        # Context providers (always present)
│   ├── auth-provider.tsx
│   └── organizations-provider.tsx
├── hooks/            # Custom hooks (always present)
│   ├── use-auth.ts
│   └── use-organizations.ts
└── components/       # UI components
    ├── login-form.tsx
    └── organization-list.tsx
```

## Key Takeaways

1. **One Pattern, Two Input Sources**: The same architectural flow works with both server actions and HTTP services
2. **Store-Centric**: Zustand stores are always the central hub, regardless of input source
3. **Consistent Interface**: Hooks provide the same interface to components, hiding the input source complexity
4. **Proven Approach**: Battle-tested pattern that scales well in production applications
5. **Easy Migration**: Can migrate existing patterns incrementally, module by module

This unified pattern ensures consistency across your application while providing flexibility in how you fetch and manage data.