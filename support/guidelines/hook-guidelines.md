# React Custom Hook Guidelines

## Core Principles

1. **Simplicity**: Keep hooks focused and straightforward
2. **Consistency**: Use the same pattern across all entity hooks
3. **Composition**: Combine context and store access in a single hook
4. **Encapsulation**: Hide implementation details from components
5. **Utility**: Provide helpful methods for common operations

## Standard Hook Pattern

```typescript
'use client';

import { useEntityContext } from '../providers/entity-provider';
import { useEntityStore } from '../store/entity.store';
import { type EntityModel } from '../schemas/entity.schemas';

/**
 * Custom hook that combines entity context and store
 * to provide a simplified interface for entity functionality
 * 
 * @returns Entity utilities and state
 */
export function useEntity() {
  // Get data from entity context
  const {
    entities,
    selectedEntity,
    isLoading: contextLoading,
    error: contextError,
    fetchEntities,
    fetchEntity,
    setSelectedEntity,
    clearError: clearContextError
  } = useEntityContext();

  // Get additional actions from entity store
  const {
    addEntity,
    editEntity,
    removeEntity,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useEntityStore();

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
    entities,
    selectedEntity,
    isLoading,
    error,
    
    // Entity actions
    fetchEntities,
    fetchEntity,
    addEntity,
    editEntity,
    removeEntity,
    setSelectedEntity,
    
    // Utility actions
    clearError,
    
    // Helper methods
    hasEntities: () => entities.length > 0,
    getEntityById: (id: number) => entities.find(e => e.id === id),
    getEntityName: (id: number) => {
      const entity = entities.find(e => e.id === id);
      return entity ? entity.name : 'Unknown Entity';
    },
    // Additional helper methods...
  };
}

export default useEntity;
```

## Pre-Implementation Verification

**🚨 MANDATORY**: Before writing any hook, you MUST verify against existing files to ensure alignment and prevent implementation errors.

### Verification Steps (In Order)

1. **Read the Store File** (`../store/entity.store.ts`)
   - Verify exact function names for wrapper functions
   - Check parameter types and return types
   - Note any helper methods available
   - Confirm error handling patterns

2. **Read the Provider File** (`../providers/entity-provider.tsx`)
   - Verify context interface for destructuring
   - Check what state and actions are exposed
   - Confirm naming conventions used

3. **Read the Schema File** (`../schemas/entity.schemas.ts`)
   - Verify type imports are correct
   - Check enum values and data types
   - Confirm input/output schema names

4. **Verify Database Model** (`/database/drizzle/models/[model-file].ts`)
   - Confirm field names match database exactly
   - Check data types and nullable fields
   - Verify relationships and constraints

### Common Verification Points

- **Store Function Names**: Ensure wrapper functions call correct store methods
  ```typescript
  // Verify store has these exact names:
  createEntity, updateEntity, deleteEntity (NOT addEntity, editEntity, removeEntity)
  ```

- **Provider Interface**: Match context destructuring exactly
  ```typescript
  // Verify provider exposes these exact properties:
  const { entities, selectedEntity, isLoading, error, fetchEntities, ... } = useEntityContext();
  ```

- **Schema Types**: Import correct types and enums
  ```typescript
  // Verify schema exports these exact types:
  import { type CreateEntityInput, type UpdateEntityInput, type EntityStatus } from '../schemas/entity.schemas';
  ```

- **Database Field Alignment**: Use exact database field names
  ```typescript
  // Example: If database has 'customer_churn_rate' field, use exactly that in calculations
  latest.customerChurnRate  // ✅ Correct (schema converts snake_case to camelCase)
  ```

### Failure to Verify Causes

- Function name mismatches between hook and store
- Type import errors and linting failures  
- Incorrect field references causing runtime errors
- Inconsistent patterns across similar hooks

**Remember**: The 5 minutes spent verifying saves hours of debugging later.

## Key Elements of a Good Hook

### 1. Imports

- Import both context and store hooks
- Import necessary types from schemas

### 2. State and Actions Organization

- Get state and read-only actions from context
- Get mutation actions from store
- Combine loading and error states
- Create a unified error clearing function

### 3. Return Structure

- Return all relevant state
- Return all actions from context and store
- Return combined utility values like `isLoading` and `error`
- Return helper methods that simplify component logic

### 4. Helper Methods

Helper methods should:
- Focus on common access patterns
- Provide meaningful defaults when data is not available
- Have descriptive names that indicate what they do
- Be simple and perform a single operation

Good helper method examples:
```typescript
// Entity existence check
hasEntities: () => entities.length > 0,

// Entity lookup by ID
getEntityById: (id: number) => entities.find(e => e.id === id),

// Entity name with default
getEntityName: (id: number) => {
  const entity = entities.find(e => e.id === id);
  return entity ? entity.name : 'Unknown Entity';
},

// Filtering entities by status
getActiveEntities: () => entities.filter(e => e.status === 'ACTIVE'),

// Simple formatting helpers
formatDate: (date: Date | string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
},

// Simple calculations
getTotalValue: () => entities.reduce((sum, entity) => sum + entity.value, 0)
```

## Implementation Guidelines

### 1. Keep It Flat

- Use a flat structure for the return object
- Don't nest helper methods in categories
- Avoid unnecessary grouping or organization

### 2. Be Consistent

- Use the same naming conventions across all hooks
- Follow the same pattern for similar operations
- Keep the structure consistent for all entity hooks

### 3. Focus on Component Needs

- Include helpers that address common component needs
- Don't add helpers that are only used in one place
- Think about what would simplify component code

### 4. Avoid Redundancy

- Don't reimplement logic that's already in the context or store
- Use the existing functions from context and store when possible
- Keep helper methods simple and focused

### 5. Prefer Readability

- Use descriptive names for helper methods
- Keep helper method implementations simple
- Use comments to explain complex logic

## Example Implementation

Here's a complete example for a company entity:

```typescript
'use client';

import { useCompaniesContext } from '../providers/companies-provider';
import { useCompaniesStore } from '../store/companies.store';
import { 
  type Company, 
  type CompanyWithUsers, 
  type CompanyUserWithProfile,
  type CompanyRole
} from '../schemas/companies.schemas';

/**
 * Custom hook that combines company context and store
 * to provide a simplified interface for company functionality
 * 
 * @returns Company utilities and state
 */
export function useCompanies() {
  // Get data from company context
  const {
    companies,
    selectedCompany,
    companyUsers,
    isLoading: contextLoading,
    error: contextError,
    fetchCompanies,
    fetchCompany,
    setSelectedCompany,
    clearError: clearContextError
  } = useCompaniesContext();

  // Get additional actions from company store
  const {
    addCompany,
    editCompany,
    removeCompany,
    fetchCompanyUsers,
    addUserToCompany,
    updateUserRole,
    removeUserFromCompany,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useCompaniesStore();

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
    companies,
    selectedCompany,
    companyUsers,
    isLoading,
    error,
    
    // Company actions
    fetchCompanies,
    fetchCompany,
    addCompany,
    editCompany,
    removeCompany,
    setSelectedCompany,
    
    // Company user actions
    fetchCompanyUsers,
    addUserToCompany,
    updateUserRole,
    removeUserFromCompany,
    
    // Utility actions
    clearError,
    
    // Helper methods
    hasCompanies: () => companies.length > 0,
    getCompanyById: (id: number) => companies.find(c => c.id === id),
    getCompanyName: (id: number) => {
      const company = companies.find(c => c.id === id);
      return company ? company.name : 'Unknown Company';
    },
    getUserRole: (companyId: number, userProfileId: number): CompanyRole | null => {
      // If we have the selected company and it matches the requested ID
      if (selectedCompany && selectedCompany.id === companyId) {
        const user = selectedCompany.users?.find(u => u.userProfileId === userProfileId);
        return user ? user.role : null;
      }
      
      // Otherwise, check the companyUsers array
      const user = companyUsers.find(
        u => u.companyId === companyId && u.userProfileId === userProfileId
      );
      return user ? user.role : null;
    },
    isUserInCompany: (companyId: number, userProfileId: number): boolean => {
      // If we have the selected company and it matches the requested ID
      if (selectedCompany && selectedCompany.id === companyId) {
        return selectedCompany.users?.some(u => u.userProfileId === userProfileId) || false;
      }
      
      // Otherwise, check the companyUsers array
      return companyUsers.some(
        u => u.companyId === companyId && u.userProfileId === userProfileId
      );
    }
  };
}

export default useCompanies;
```

## Best Practices

1. **Export Default and Named**: Export both default and named exports for flexibility
2. **Document Your Hook**: Include JSDoc comments to describe the hook's purpose
3. **Type Everything**: Use TypeScript to ensure type safety
4. **Keep Helpers Simple**: Each helper should do one thing well
5. **Focus on Component Needs**: Design hooks around what components actually need

Remember: Simple is better than complex. The goal of these hooks is to simplify component code by providing a clean, consistent interface to your application's state and actions.