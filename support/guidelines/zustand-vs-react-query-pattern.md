# Zustand vs React Query Pattern Guide

## Overview

This guide helps you choose between two proven frontend state management patterns for your finpy application. Each pattern has distinct advantages and is suited for different types of modules and use cases.

## Pattern Comparison

| Aspect | Pure Zustand Pattern | React Query + Zustand Pattern |
|--------|---------------------|--------------------------------|
| **Server State** | Zustand Store | React Query |
| **UI State** | Zustand Store | Zustand Store |
| **Complexity** | Low | Moderate |
| **Learning Curve** | Simple | Requires React Query knowledge |
| **Caching Strategy** | Manual implementation | Automatic with background refresh |
| **Real-time Updates** | Manual polling/WebSocket | Background refetching + cache invalidation |
| **Optimistic Updates** | Manual implementation | Built-in support |
| **Error Handling** | Manual in store | Built-in retry logic |
| **Bundle Size** | Smaller (just Zustand) | Larger (Zustand + React Query) |
| **Best For** | Simple CRUD, proven patterns | Complex data, advanced caching needs |

---

## Pattern 1: Pure Zustand Pattern

### Architecture
```
[Server Actions OR Services] → Zustand Store → Provider → Hook → Components
```

### Key Characteristics
- **Single Store**: All state (server + UI) managed in one Zustand store
- **Direct Calls**: Store methods directly call server actions or HTTP services
- **Manual Control**: Full control over caching, error handling, loading states
- **Proven**: Battle-tested pattern used in V7Capital production

### Implementation Example
```typescript
// Store handles all state and async operations
export const useAuthStore = create<AuthState>()(
  devtools(persist(immer((set, get) => ({
    // State
    user: null,
    isLoading: false,
    error: null,
    
    // Actions call services/actions directly
    login: async (credentials) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await authService.login(credentials);
        if (response.success) {
          set(state => {
            state.user = response.data.user;
            state.isLoading = false;
          });
          return true;
        }
      } catch (error) {
        set({ isLoading: false, error: error.message });
        return false;
      }
    }
  }))))
);

// Hook provides unified interface
export function useAuth() {
  const { user, login, logout, isLoading, error } = useAuthStore();
  
  return {
    user,
    login,
    logout,
    isLoading,
    error,
    isAuthenticated: !!user
  };
}
```

### Pros
- ✅ **Simple Architecture**: Easy to understand and debug
- ✅ **Predictable**: Synchronous state updates, no surprises
- ✅ **Production Proven**: Used successfully in V7Capital
- ✅ **Full Control**: Complete control over data flow and caching
- ✅ **Smaller Bundle**: No additional dependencies beyond Zustand
- ✅ **Easy Testing**: All logic centralized in stores

### Cons
- ❌ **Manual Caching**: You implement caching logic yourself
- ❌ **No Background Refresh**: Manual refresh implementation needed
- ❌ **Basic Error Handling**: Manual retry logic implementation
- ❌ **No Optimistic Updates**: Manual implementation required

---

## Pattern 2: React Query + Zustand Pattern

### Architecture
```
Services → React Query (Server State) + Zustand (UI State) → Provider → Hook → Components
```

### Key Characteristics
- **Separation of Concerns**: React Query handles server state, Zustand handles UI state
- **Automatic Caching**: Smart caching with background refetching
- **Advanced Features**: Built-in optimistic updates, retry logic, cache invalidation
- **Complex Data**: Perfect for real-time data and complex relationships

### Implementation Example
```typescript
// UI State Only (Zustand)
export const useOrganizationsUIStore = create<UIState>()(
  devtools(immer((set) => ({
    activeOrganizationId: null,
    isModalOpen: false,
    
    setActiveOrganization: (id) => {
      set(state => { state.activeOrganizationId = id; });
    },
    
    openModal: () => {
      set(state => { state.isModalOpen = true; });
    }
  })))
);

// Server State (React Query) + UI State (Zustand) Combined
export function useOrganizations() {
  // UI State from Zustand
  const { 
    activeOrganizationId,
    isModalOpen,
    setActiveOrganization,
    openModal 
  } = useOrganizationsUIStore();
  
  // Server Data from React Query
  const {
    data: organizationsResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  });
  
  const organizations = organizationsResponse?.success ? organizationsResponse.data : [];
  
  // Mutations with automatic cache updates
  const createMutation = useMutation({
    mutationFn: organizationsService.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      if (response.data) {
        setActiveOrganization(response.data.id); // Update UI state
      }
    }
  });
  
  return {
    // Server State (React Query)
    organizations,
    isLoading,
    error,
    createOrganization: createMutation.mutateAsync,
    
    // UI State (Zustand)
    activeOrganizationId,
    isModalOpen,
    setActiveOrganization,
    openModal
  };
}
```

### Pros
- ✅ **Smart Caching**: Automatic background refetching and cache management
- ✅ **Optimistic Updates**: Built-in support for better user experience
- ✅ **Advanced Error Handling**: Automatic retry logic and error boundaries
- ✅ **Real-time Feel**: Background updates keep data fresh
- ✅ **Performance**: Intelligent cache sharing across components
- ✅ **Developer Experience**: Excellent DevTools and debugging

### Cons
- ❌ **Higher Complexity**: More concepts to learn and manage
- ❌ **Larger Bundle**: Additional React Query dependency
- ❌ **Over-engineering Risk**: Can be overkill for simple CRUD
- ❌ **Learning Curve**: Team needs React Query expertise

---

## Decision Matrix

### Choose Pure Zustand Pattern When:

#### ✅ Module Characteristics
- Simple CRUD operations (create, read, update, delete)
- Infrequent data updates
- Predictable data flow requirements
- Basic authentication and session management

#### ✅ Team Characteristics  
- Small development team
- Prefers simplicity over advanced features
- Limited React Query experience
- Values predictable, synchronous patterns

#### ✅ Project Characteristics
- Proven patterns are prioritized
- Bundle size is a concern
- Simple debugging requirements
- Less complex data relationships

### Choose React Query + Zustand Pattern When:

#### ✅ Module Characteristics
- Complex data relationships and dependencies
- Frequent data updates and real-time requirements
- Large datasets with pagination or infinite scroll
- Collaborative features with multiple users

#### ✅ Team Characteristics
- Experienced with React Query
- Values advanced caching and performance features
- Comfortable with moderate complexity
- Needs optimistic updates and advanced UX

#### ✅ Project Characteristics
- Performance is critical
- Real-time data synchronization needed
- Advanced caching strategies required
- Complex business logic with data dependencies

---

## Recommended Pattern by Module Type

### Finpy Module Recommendations

| Module | Recommended Pattern | Reasoning |
|--------|-------------------|-----------|
| **Authentication** | Pure Zustand | Simple login/logout flows, session management |
| **User Profile** | Pure Zustand | Basic CRUD operations, infrequent updates |
| **Organizations** | React Query + Zustand | Complex relationships, real-time collaboration |
| **Subscriptions** | React Query + Zustand | Payment states, real-time billing updates |
| **Financial Data** | React Query + Zustand | Real-time pricing, complex data relationships |
| **Asset Manager** | React Query + Zustand | Large datasets, real-time market data |
| **User Invitations** | Pure Zustand | Simple invite flows, basic state management |
| **Organization Members** | React Query + Zustand | Collaborative features, role management |

---

## Implementation Guidelines

### For Pure Zustand Pattern

#### 1. Store Structure
```typescript
export interface ModuleState {
  // Core Data
  data: DataType[];
  selectedItem: DataType | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions
  fetchData: () => Promise<void>;
  createItem: (data: CreateInput) => Promise<boolean>;
  updateItem: (id: number, data: UpdateInput) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  
  // Helpers
  clearError: () => void;
  reset: () => void;
}
```

#### 2. Error Handling Pattern
```typescript
// Consistent error handling in all store actions
actionName: async (params) => {
  set({ isLoading: true, error: null });
  
  try {
    const response = await service.actionName(params);
    
    if (response.success) {
      set(state => {
        // Update state
        state.isLoading = false;
      });
      return true;
    } else {
      set({ 
        isLoading: false, 
        error: response.error || 'Operation failed' 
      });
      return false;
    }
  } catch (error) {
    set({ 
      isLoading: false, 
      error: error instanceof Error ? error.message : 'Unexpected error' 
    });
    return false;
  }
}
```

### For React Query + Zustand Pattern

#### 1. State Separation
```typescript
// UI Store (Zustand) - Only UI state
export interface ModuleUIState {
  activeItemId: number | null;
  selectedItems: number[];
  isCreateModalOpen: boolean;
  filters: FilterState;
  
  // Only UI actions
  setActiveItem: (id: number | null) => void;
  toggleSelection: (id: number) => void;
  openCreateModal: () => void;
  updateFilters: (filters: FilterState) => void;
}

// Server State handled by React Query in hooks
export function useModuleData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['module-data'],
    queryFn: service.getData
  });
  
  return { data, isLoading, error };
}
```

#### 2. Cache Management
```typescript
// Mutations with proper cache invalidation
const createMutation = useMutation({
  mutationFn: service.create,
  onSuccess: (response) => {
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['module-data'] });
    queryClient.invalidateQueries({ queryKey: ['module-list'] });
    
    // Update UI state if needed
    if (response.data) {
      setActiveItem(response.data.id);
    }
  },
  onError: (error) => {
    // Error handling is automatic, but can be customized
    console.error('Create failed:', error);
  }
});
```

---

## Migration Strategies

### From Pure Zustand to React Query + Zustand

1. **Assess Module Complexity**: Ensure the module benefits from React Query features
2. **Extract UI State**: Move UI-only state to separate Zustand store
3. **Replace Store Data Methods**: Convert store data fetching to React Query hooks
4. **Update Hook Interface**: Combine React Query + Zustand in main hook
5. **Add Cache Strategies**: Implement proper cache invalidation and refresh

### From React Query + Zustand to Pure Zustand

1. **Combine Stores**: Merge server state and UI state into single Zustand store
2. **Replace React Query**: Convert useQuery/useMutation to store methods
3. **Implement Manual Caching**: Add your own caching logic if needed
4. **Update Providers**: Remove QueryClientProvider, simplify providers
5. **Consolidate Hooks**: Simplify hook interface to use store directly

---

## Best Practices

### General Guidelines

1. **Consistency**: Use the same pattern consistently within each module
2. **Documentation**: Clearly document which pattern each module uses
3. **Team Training**: Ensure team understands both patterns
4. **Performance Monitoring**: Monitor bundle size and performance impacts

### Pure Zustand Best Practices

- Always handle loading and error states consistently
- Implement proper cleanup in useEffect for subscriptions
- Use immer middleware for complex state updates
- Persist only essential data (user preferences, session info)

### React Query + Zustand Best Practices

- Keep server state in React Query, UI state in Zustand
- Use proper queryKey strategies for cache invalidation
- Implement optimistic updates for better UX
- Configure staleTime and cacheTime appropriately

---

## Conclusion

Both patterns are valid and serve different needs in a modern React application:

- **Pure Zustand Pattern**: Choose for simplicity, proven patterns, and straightforward data flows
- **React Query + Zustand Pattern**: Choose for complex data requirements, real-time features, and advanced caching needs

The key is to:
1. **Assess each module's requirements individually**
2. **Choose the appropriate pattern based on complexity and features needed**
3. **Maintain consistency within each module**
4. **Document your decisions for future development**

Remember: You can use both patterns in the same application. Different modules can use different patterns based on their specific requirements.