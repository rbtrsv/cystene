# React Context Provider Guidelines

## Core Principles

1. **Consistency**: Use the same pattern for all providers
2. **Simplicity**: Avoid unnecessary abstractions and complexity
3. **Type Safety**: Provide proper TypeScript typing
4. **Performance**: Prevent unnecessary re-renders with memoization
5. **Maintainability**: Keep providers focused on a single responsibility

## Standard Provider Pattern

```tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useEntityStore } from '../store/entity.store';
import type { Entity } from '../schemas/entity.schemas';

// Define the context type
export interface EntityContextType {
  // State
  entities: Entity[];
  selectedEntity: Entity | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchEntities: () => Promise<void>;
  fetchEntity: (id: number) => Promise<void>;
  setSelectedEntity: (entity: Entity | null) => void;
  clearError: () => void;
}

// Create the context
const EntityContext = createContext<EntityContextType | null>(null);

// Provider component
export function EntityProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    entities,
    selectedEntity,
    isLoading,
    error,
    fetchEntities,
    fetchEntity,
    setSelectedEntity,
    clearError
  } = useEntityStore();
  
  // Fetch entities on mount if initialFetch is true
  useEffect(() => {
    if (initialFetch) {
      fetchEntities();
    }
  }, [initialFetch, fetchEntities]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    entities,
    selectedEntity,
    isLoading,
    error,
    fetchEntities,
    fetchEntity,
    setSelectedEntity,
    clearError
  }), [
    entities,
    selectedEntity,
    isLoading,
    error,
    fetchEntities,
    fetchEntity,
    setSelectedEntity,
    clearError
  ]);
  
  return (
    <EntityContext.Provider value={contextValue}>
      {children}
    </EntityContext.Provider>
  );
}

// Hook to use the context
export function useEntityContext(): EntityContextType {
  const context = useContext(EntityContext);
  
  if (!context) {
    throw new Error('useEntityContext must be used within an EntityProvider');
  }
  
  return context;
}
```

## Key Recommendations

### 1. Keep Providers Focused

Each provider should handle only one logical entity or concern. Don't try to make providers do too much.

### 2. Standardize Provider Names

- **Context**: `EntityContext`
- **Provider Component**: `EntityProvider`
- **Context Hook**: `useEntityContext`

### 3. Memoize Context Values

Always use `useMemo` for your context values to prevent unnecessary re-renders:

```tsx
const contextValue = useMemo(() => ({
  // values and functions
}), [
  // dependencies
]);
```

### 4. Conditional Initialization

Use the `initialFetch` prop to control whether data is loaded when the provider mounts:

```tsx
useEffect(() => {
  if (initialFetch) {
    fetchEntities();
  }
}, [initialFetch, fetchEntities]);
```

### 5. Clean Provider Composition

When composing multiple providers, keep it simple and maintain a logical order:

```tsx
export function AppProvider({ children, initialFetch = true }) {
  return (
    <EntityProvider initialFetch={initialFetch}>
      <RelatedEntityProvider initialFetch={initialFetch}>
        <AnotherEntityProvider initialFetch={initialFetch}>
          {children}
        </AnotherEntityProvider>
      </RelatedEntityProvider>
    </EntityProvider>
  );
}
```

## Example Implementation

Here's an example of a typical provider implementation:

```tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCompaniesStore } from '../store/companies.store';
import type { Company, CompanyWithUsers, CompanyUserWithProfile } from '../schemas/companies.schemas';

/**
 * Context type for the companies provider
 */
export interface CompaniesContextType {
  // State
  companies: Company[];
  selectedCompany: CompanyWithUsers | null;
  companyUsers: CompanyUserWithProfile[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCompanies: () => Promise<void>;
  fetchCompany: (id: number) => Promise<void>;
  setSelectedCompany: (company: Company | null) => void;
  clearError: () => void;
}

// Create the context with null default value
const CompaniesContext = createContext<CompaniesContextType | null>(null);

/**
 * Provider component for companies-related state and actions
 */
export function CompaniesProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    companies,
    selectedCompany,
    companyUsers,
    isLoading,
    error,
    fetchCompanies,
    fetchCompany,
    setSelectedCompany,
    clearError
  } = useCompaniesStore();
  
  // Fetch companies on mount if initialFetch is true
  useEffect(() => {
    if (initialFetch) {
      fetchCompanies();
    }
  }, [initialFetch, fetchCompanies]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    companies,
    selectedCompany,
    companyUsers,
    isLoading,
    error,
    fetchCompanies,
    fetchCompany,
    setSelectedCompany,
    clearError
  }), [
    companies,
    selectedCompany,
    companyUsers,
    isLoading,
    error,
    fetchCompanies,
    fetchCompany,
    setSelectedCompany,
    clearError
  ]);
  
  return (
    <CompaniesContext.Provider value={contextValue}>
      {children}
    </CompaniesContext.Provider>
  );
}

/**
 * Hook to use the companies context
 * @throws Error if used outside of a CompaniesProvider
 */
export function useCompaniesContext(): CompaniesContextType {
  const context = useContext(CompaniesContext);
  
  if (!context) {
    throw new Error('useCompaniesContext must be used within a CompaniesProvider');
  }
  
  return context;
}
```

## Centralized Provider Example

Use a straightforward composition pattern without adding extra abstractions:

```tsx
'use client';

import { ReactNode } from 'react';
import { CompaniesProvider } from './companies-provider';
import { StakeholdersProvider } from './stakeholders-provider';
import { FundsProvider } from './funds-provider';
import { RoundsProvider } from './rounds-provider';
import { SecuritiesProvider } from './securities-provider';
import { TransactionsProvider } from './transactions-provider';

/**
 * Centralized provider that combines all asset-related providers
 */
export default function AssetsProvider({ 
  children, 
  initialFetch = true 
}: { 
  children: ReactNode,
  initialFetch?: boolean 
}) {
  return (
    <CompaniesProvider initialFetch={initialFetch}>
      <StakeholdersProvider initialFetch={initialFetch}>
        <FundsProvider initialFetch={initialFetch}>
          <RoundsProvider initialFetch={initialFetch}>
            <SecuritiesProvider initialFetch={initialFetch}>
              <TransactionsProvider initialFetch={initialFetch}>
                {children}
              </TransactionsProvider>
            </SecuritiesProvider>
          </RoundsProvider>
        </FundsProvider>
      </StakeholdersProvider>
    </CompaniesProvider>
  );
}
```

## Conclusion

By following these guidelines, you'll create providers that are:

- **Consistent** across your codebase
- **Type-safe** with TypeScript
- **Performant** with proper memoization
- **Simple** and focused on core responsibilities
- **Maintainable** as your application grows

Remember: Start with the simplest implementation that solves your current needs. Add complexity only when there's a demonstrated need for it.
