# Server Actions Guidelines

## Core Principles

1. **Security First**: Always validate permissions and filter data by user access
2. **Type Safety**: Use Zod schemas for input validation and proper TypeScript types
3. **Consistency**: Follow the same pattern across all entity actions
4. **Error Handling**: Provide comprehensive error messages and graceful failure
5. **Database Safety**: Always check entity existence before operations

## Standard Action Pattern

### File Structure
```typescript
'use server';

import { db } from '@database/drizzle';
import { entityTable } from '@database/drizzle/models/[model-file]';
import { eq, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds, getStakeholderIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateEntitySchema, 
  UpdateEntitySchema,
  type EntityResponse,
  type EntityListResponse,
  type Entity
} from '@/modules/assetmanager/schemas/entity.schemas';

/**
 * Convert database record to typed entity
 */
function convertToTypedEntity(dbRecord: any): Entity {
  return {
    id: dbRecord.id,
    // Convert database types to schema types
    amount: dbRecord.amount ? Number(dbRecord.amount) : null,
    date: dbRecord.date?.toISOString().split('T')[0] || null,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all entities that the current user has access to
 */
export async function getEntities(companyId?: number): Promise<EntityListResponse> {
  return withAuth(async (profile) => {
    try {
      // Check permissions
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.CORRECT_MODEL);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view entities'
        };
      }
      
      // Get filtering IDs based on entity type
      const filterIds = await getCompanyIds(profile); // or getStakeholderIds(profile)
      
      // Build query with proper filtering
      let result: any[];
      
      if (companyId) {
        // Specific filter requested - check access
        if (filterIds.length > 0 && !filterIds.includes(companyId)) {
          return {
            success: false,
            error: 'Forbidden: You do not have access to this resource'
          };
        }
        result = await db.select()
          .from(entityTable)
          .where(eq(entityTable.companyId, companyId));
      } else if (filterIds.length > 0) {
        // For filtered users - apply filtering
        result = await db.select()
          .from(entityTable)
          .where(inArray(entityTable.companyId, filterIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(entityTable);
      }
      
      const typedEntities = result.map(convertToTypedEntity);
      
      return {
        success: true,
        data: typedEntities
      };
    } catch (error) {
      console.error('Error fetching entities:', error);
      return {
        success: false,
        error: 'Failed to fetch entities'
      };
    }
  });
}

/**
 * Get a single entity by ID
 */
export async function getEntity(id: number): Promise<EntityResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.CORRECT_MODEL);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this entity'
        };
      }
      
      const entity = await db.query.entityTable.findFirst({
        where: eq(entityTable.id, id)
      });
      
      if (!entity) {
        return {
          success: false,
          error: 'Entity not found'
        };
      }
      
      // Check access for filtered users
      const filterIds = await getCompanyIds(profile);
      if (filterIds.length > 0 && !filterIds.includes(entity.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this resource'
        };
      }
      
      return {
        success: true,
        data: convertToTypedEntity(entity)
      };
    } catch (error) {
      console.error('Error fetching entity:', error);
      return {
        success: false,
        error: 'Failed to fetch entity'
      };
    }
  });
}

/**
 * Create a new entity
 */
export async function createEntity(data: unknown): Promise<EntityResponse> {
  const parsed = CreateEntitySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.CORRECT_MODEL);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create entity'
        };
      }
      
      // Check access for filtered users
      const filterIds = await getCompanyIds(profile);
      if (filterIds.length > 0 && !filterIds.includes(parsed.data.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this resource'
        };
      }
      
      const [newEntity] = await db.insert(entityTable)
        .values({
          ...parsed.data,
          // Convert date strings to Date objects if needed
          date: parsed.data.date ? new Date(parsed.data.date) : null
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedEntity(newEntity)
      };
    } catch (error) {
      console.error('Error creating entity:', error);
      return {
        success: false,
        error: 'Failed to create entity'
      };
    }
  });
}

/**
 * Update an existing entity
 */
export async function updateEntity(id: number, data: unknown): Promise<EntityResponse> {
  const parsed = UpdateEntitySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.CORRECT_MODEL);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update entity'
        };
      }
      
      // Check if entity exists and user has access
      const existingEntity = await db.query.entityTable.findFirst({
        where: eq(entityTable.id, id)
      });
      
      if (!existingEntity) {
        return {
          success: false,
          error: 'Entity not found'
        };
      }
      
      const filterIds = await getCompanyIds(profile);
      if (filterIds.length > 0 && !filterIds.includes(existingEntity.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this resource'
        };
      }
      
      // If changing companyId, verify access to new company
      if (parsed.data.companyId && filterIds.length > 0 && !filterIds.includes(parsed.data.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to the target resource'
        };
      }

      const [updatedEntity] = await db.update(entityTable)
        .set({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : undefined
        } as any)
        .where(eq(entityTable.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedEntity(updatedEntity)
      };
    } catch (error) {
      console.error('Error updating entity:', error);
      return {
        success: false,
        error: 'Failed to update entity'
      };
    }
  });
}

/**
 * Delete an entity
 */
export async function deleteEntity(id: number): Promise<EntityResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.CORRECT_MODEL);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete entity'
        };
      }
      
      // Check if entity exists and user has access
      const existingEntity = await db.query.entityTable.findFirst({
        where: eq(entityTable.id, id)
      });
      
      if (!existingEntity) {
        return {
          success: false,
          error: 'Entity not found'
        };
      }
      
      const filterIds = await getCompanyIds(profile);
      if (filterIds.length > 0 && !filterIds.includes(existingEntity.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this resource'
        };
      }

      await db.delete(entityTable)
        .where(eq(entityTable.id, id));

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting entity:', error);
      return {
        success: false,
        error: 'Failed to delete entity'
      };
    }
  });
}
```

## Permission Guidelines

### Entity Model Mapping

**🚨 CRITICAL: Database model file determines access permissions**

#### 📁 `companies.ts` → Company Users + Global Users
- **Entities**: companies, incomeStatements, cashFlowStatements, balanceSheets, financialRatios, revenueMetrics, customerMetrics, operationalMetrics, teamMetrics, kpis, kpiValues
- **Filtering**: Use `getCompanyIds(profile)`
- **Permission Entity**: `EntityModel.COMPANIES_FINANCIALS`

#### 📁 `portfolio.ts` → ONLY Global Users + Stakeholder Users  
- **Entities**: dealPipeline, investmentPortfolio, portfolioCashFlow, portfolioPerformance
- **Filtering**: Use `getStakeholderIds(profile)`
- **Permission Entity**: Uses stakeholder-specific models (e.g., `EntityModel.DEAL_PIPELINE`)

#### 📁 `captable.ts` → ONLY Global Users + Stakeholder Users
- **Entities**: stakeholders, funds, rounds, securities, transactions, feeCosts, capTableEntries
- **Filtering**: Use `getStakeholderIds(profile)`
- **Permission Entity**: Uses fund/stakeholder-specific models (e.g., `EntityModel.FEE_COSTS`)

### Permission Patterns

```typescript
// For companies.ts entities (Company + Global access)
const companyIds = await getCompanyIds(profile);
const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);

// For portfolio.ts entities (Stakeholder + Global access)
const stakeholderIds = await getStakeholderIds(profile);
const allowed = await hasPermission(profile, Action.VIEW, EntityModel.DEAL_PIPELINE);

// For captable.ts entities (Stakeholder + Global access)
const stakeholderIds = await getStakeholderIds(profile);
const allowed = await hasPermission(profile, Action.VIEW, EntityModel.FEE_COSTS);
```

## Data Type Conversion Guidelines

### Common Conversions

```typescript
function convertToTypedEntity(dbRecord: any): Entity {
  return {
    id: dbRecord.id,
    
    // Numbers: Convert from string/decimal to number
    amount: dbRecord.amount ? Number(dbRecord.amount) : null,
    percentage: dbRecord.percentage ? Number(dbRecord.percentage) : null,
    
    // Dates: Convert to ISO string for frontend
    date: dbRecord.date?.toISOString().split('T')[0] || null,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt),
    
    // Enums: Cast to proper type
    status: dbRecord.status as EntityStatus,
    scenario: dbRecord.scenario as FinancialScenario,
    
    // Strings: Direct assignment
    name: dbRecord.name,
    notes: dbRecord.notes,
    
    // Booleans: Direct assignment
    isActive: dbRecord.isActive,
    fullYear: dbRecord.fullYear
  };
}
```

### Input Conversion (Create/Update)

```typescript
// In create/update functions
const [newEntity] = await db.insert(entityTable)
  .values({
    ...parsed.data,
    // Convert date strings back to Date objects for database
    date: parsed.data.date ? new Date(parsed.data.date) : null,
    // Numbers are already converted by Zod schema
  } as any)
  .returning();
```

## Naming Conventions

### Function Names
- **Plural for list operations**: `getEntities`, `createEntities`
- **Singular for single operations**: `getEntity`, `createEntity`  
- **Action verbs**: `get`, `create`, `update`, `delete`

### Variable Names
- **Database results**: `result`, `existingEntity`, `newEntity`
- **Converted data**: `typedEntities`, `convertedEntity`
- **Filter arrays**: `companyIds`, `stakeholderIds`

## Error Handling Best Practices

### Standard Error Messages
```typescript
// Permission errors
'Insufficient permissions to [action] [entity]'
'Forbidden: You do not have access to this [resource]'

// Not found errors
'[Entity] not found'
'[Entity] entry not found'

// Validation errors
// Use the first Zod error message: parsed.error.errors[0].message

// Generic errors
'Failed to [action] [entity]'
'An unexpected error occurred'
```

### Error Logging
```typescript
try {
  // Action logic
} catch (error) {
  console.error('Error [action]ing [entity]:', error);
  return {
    success: false,
    error: 'Failed to [action] [entity]'
  };
}
```

## Required Validation Checks

### 1. Permission Check
```typescript
const allowed = await hasPermission(profile, Action.VIEW, EntityModel.CORRECT_MODEL);
if (!allowed) {
  return { success: false, error: 'Insufficient permissions...' };
}
```

### 2. Input Validation
```typescript
const parsed = CreateEntitySchema.safeParse(data);
if (!parsed.success) {
  return { success: false, error: parsed.error.errors[0].message };
}
```

### 3. Entity Existence (for update/delete)
```typescript
const existingEntity = await db.query.entityTable.findFirst({
  where: eq(entityTable.id, id)
});

if (!existingEntity) {
  return { success: false, error: 'Entity not found' };
}
```

### 4. Access Filtering
```typescript
const filterIds = await getCompanyIds(profile); // or getStakeholderIds
if (filterIds.length > 0 && !filterIds.includes(entity.companyId)) {
  return { success: false, error: 'Forbidden: You do not have access...' };
}
```

## File Organization

### Imports Order
1. Node.js/Framework imports (`'use server'`)
2. Database imports (db, tables, queries)
3. Authentication/Permission imports
4. Schema imports
5. Type imports

### Function Order
1. Helper functions (`convertToTypedEntity`)
2. Get functions (`getEntities`, `getEntity`)
3. Create function (`createEntity`)
4. Update function (`updateEntity`)
5. Delete function (`deleteEntity`)
6. Specialized functions (if any)

## Database Query Patterns

### Basic Query
```typescript
const result = await db.select().from(entityTable);
```

### Filtered Query
```typescript
const result = await db.select()
  .from(entityTable)
  .where(eq(entityTable.companyId, companyId));
```

### Multiple Filters
```typescript
const result = await db.select()
  .from(entityTable)
  .where(inArray(entityTable.companyId, companyIds));
```

### Insert with Return
```typescript
const [newEntity] = await db.insert(entityTable)
  .values(data)
  .returning();
```

### Update with Return
```typescript
const [updatedEntity] = await db.update(entityTable)
  .set(data)
  .where(eq(entityTable.id, id))
  .returning();
```

### Delete
```typescript
await db.delete(entityTable)
  .where(eq(entityTable.id, id));
```

## Testing Considerations

### Manual Testing Checklist
1. ✅ **Permissions**: Test with different user roles
2. ✅ **Validation**: Test with invalid input data
3. ✅ **Access Control**: Test access to unauthorized resources
4. ✅ **Error Handling**: Test with non-existent IDs
5. ✅ **Data Types**: Verify number/date conversions
6. ✅ **Edge Cases**: Test with null/undefined values

---

**Remember**: Actions are the security boundary of your application. Always validate permissions, filter data appropriately, and handle errors gracefully. The database model file location determines the access control pattern - never question this structure.