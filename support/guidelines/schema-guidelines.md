# Schema Design Guidelines for CRUD Applications

## Simplified Schema Pattern for CRUD Operations

This document outlines a consistent, minimal schema pattern for defining data models across all projects.

---

### Core Schema Types

For any entity (e.g., "Items"), use these standard schema types:

1. **Entity Schema** (for GET operations):
   * `Item` - The complete entity schema with all fields
   * Used for API responses (single item and lists)
   * Includes all fields: IDs, timestamps, and business data

2. **Input Schemas** (for CREATE and UPDATE):
   * `ItemCreate` - Schema for creating new records (POST)
   * `ItemUpdate` - Schema for updating existing records (PUT/PATCH)

3. **Response Types** (optional - backend or frontend can skip if handled by API client):
   * `ItemResponse` - Response containing a single item
   * `ItemsResponse` - Response containing multiple items

4. **DELETE Operations**:
   * No schema needed - only requires ID (primitive type)

**Schema Usage by CRUD Operation:**

| Operation | Schema Used | Purpose |
|-----------|-------------|---------|
| **GET** (single/list) | `Item` | Parse/validate API response |
| **POST** (create) | `ItemCreate` | Validate request/form data |
| **PUT/PATCH** (update) | `ItemUpdate` | Validate request/form data |
| **DELETE** | *(none)* | Only needs ID parameter |

---

### Implementation Examples

#### Zod Schema Example (TypeScript)

```typescript
import { z } from 'zod';

// Enums
export const ItemStatus = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);

// Entity schema (full representation)
export const Item = z.object({
  id: z.number(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().nullable(),
  status: ItemStatus.default('ACTIVE'),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// Input schemas
export const ItemCreate = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().nullable().optional(),
  status: ItemStatus.optional().default('ACTIVE'),
});

export const ItemUpdate = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().nullable().optional(),
  status: ItemStatus.optional(),
});

// Type exports
export type ItemStatusType = z.infer<typeof ItemStatus>;
export type ItemType = z.infer<typeof Item>;
export type ItemCreateType = z.infer<typeof ItemCreate>;
export type ItemUpdateType = z.infer<typeof ItemUpdate>;

// Response types
export type ItemResponse = {
  success: boolean;
  data?: ItemType;
  error?: string;
};

export type ItemsResponse = {
  success: boolean;
  data?: ItemType[];
  error?: string;
};
```

#### FastAPI/Pydantic v2 Example (Python 3.10+)

```python
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from datetime import date as date_type
from enum import Enum
from typing import Literal

# Enums for reusable constrained values
class ItemStatus(str, Enum):
    """Item status options"""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"

# Entity schema (full representation)
class Item(BaseModel):
    id: int
    name: str = Field(min_length=2, description="Item name")
    description: str | None = None
    status: ItemStatus = Field(default=ItemStatus.ACTIVE, description="Item status")
    created_at: datetime
    updated_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

# Input schemas
class ItemCreate(BaseModel):
    name: str = Field(min_length=2, description="Item name")
    description: str | None = None
    status: ItemStatus = Field(default=ItemStatus.ACTIVE, description="Item status")

class ItemUpdate(BaseModel):
    name: str | None = Field(None, min_length=2)
    description: str | None = None
    status: ItemStatus | None = None

# Response schemas
class ItemResponse(BaseModel):
    success: bool
    data: Item | None = None
    error: str | None = None

class ItemsResponse(BaseModel):
    success: bool
    data: list[Item] | None = None
    error: str | None = None
```

---

### Modern Python Schema Guidelines (Pydantic v2)

1. **Use Modern Python Syntax**
   * Use `|` union operator instead of `Optional`: `str | None` not `Optional[str]`
   * Use lowercase generics: `list[Item]` not `List[Item]`
   * Avoid importing from `typing` when possible (except for special types)

2. **Pydantic v2 Configuration**
   * Use `model_config = ConfigDict(from_attributes=True)` instead of nested `class Config`
   * Import `ConfigDict` from pydantic: `from pydantic import BaseModel, ConfigDict`

3. **Field Validation**
   * Use `Field()` for validation and documentation
   * Include descriptive `description` parameter
   * Set constraints inline: `Field(min_length=2, max_length=255)`
   * For restricted string values, use `Literal` instead of open strings

4. **Date/Time Handling**
   * Import datetime types carefully to avoid naming conflicts:
     ```python
     from datetime import datetime
     from datetime import date as date_type  # if needed
     ```

5. **String Field Restrictions (CRITICAL)**
   * Use `Enum` for string fields with specific allowed values that are reused
   * Use `Literal` only for simple one-off constraints (like sort orders)
   * Always inherit from `str` when creating Enums: `class Status(str, Enum)`
   * Import: `from enum import Enum`
   * Example:
     ```python
     # ✅ CORRECT - Use Enum for reusable constrained strings
     from enum import Enum
     
     class Status(str, Enum):
         ACTIVE = "ACTIVE"
         INACTIVE = "INACTIVE"
         ARCHIVED = "ARCHIVED"
     
     status: Status = Field(default=Status.ACTIVE)
     
     # ✅ ALSO CORRECT - Use Literal for one-off simple constraints
     sort_by: Literal["name", "date", "status"] = "name"
     
     # ❌ WRONG - Don't use Literal for reusable values across multiple schemas
     status: Literal["ACTIVE", "INACTIVE", "ARCHIVED"] = "ACTIVE"  # Hard to maintain
     ```

---

### Enum Best Practices

1. **When to Use Enum vs Literal**
   * **Use Enum for**: Values used across multiple schemas, need for iteration, better IDE support
   * **Use Literal for**: Simple one-off constraints like sort orders or binary choices
   
2. **Enum Definition Pattern**
   ```python
   # ✅ CORRECT - Always inherit from str
   class EntityType(str, Enum):
       """Entity type options"""
       FUND = "fund"
       COMPANY = "company"
       INDIVIDUAL = "individual"
   
   # ❌ WRONG - Missing str inheritance
   class EntityType(Enum):
       FUND = "fund"  # This won't serialize properly
   ```

3. **Database Integration**
   * Store plain strings in database (no constraints needed)
   * Convert enum to string when saving: `entity_type=data.entity_type.value`
   * Pydantic automatically validates strings against enum values
   
4. **Usage in Subrouters**
   ```python
   # When creating database records, use .value
   entity = Entity(
       name=data.name,
       entity_type=data.entity_type.value  # Convert to string
   )
   
   # When filtering, enum works directly  
   if entity_type:
       query = query.filter(Entity.entity_type == entity_type)
   ```

5. **Enum Advantages**
   * IDE autocomplete: `EntityType.FUND`
   * Can iterate: `[e.value for e in EntityType]`
   * Single source of truth
   * Better for API documentation generation
   * Can add methods to enum class if needed

---

### Schema Guidelines

1. **Keep It Simple**
   * Only define schemas that are directly used in CRUD operations
   * Avoid creating base schemas unless there's significant field overlap

2. **Consistent Naming**
   * Use singular nouns for entity names (Item, not Items)
   * Use PascalCase for schema names
   * Follow naming pattern: `Item`, `ItemCreate`, `ItemUpdate`
   * **IMPORTANT**: Use EXACTLY the same schema names in both backend and frontend

3. **Field Validation**
   * Place validation rules inline with field definitions
   * Use Enums for constrained string values that are reused
   * Include descriptive error messages
   * Default values should be conservative and match business logic

4. **Input Schemas**
   * Create: Include all required fields to create a valid entity
   * Update: Make all fields optional to support partial updates

5. **Response Types**
   * Always include `success` boolean flag
   * Include optional `data` field for the actual content
   * Include optional `error` field for error messages

6. **File Organization**
   * Group related schemas in a single file named `entity.schemas.ts` or `entity_schemas.py`
   * Export all necessary types and schemas

7. **Type Consistency**
   * Ensure database types match schema types
   * Convert values between formats when needed (e.g., string to Date)

8. **Frontend Schema Strategy**
   * **Schema names**: Use EXACTLY the same names as backend (`Item`, `ItemCreate`, `ItemUpdate`)
   * Only create schemas that frontend actually uses (not all backend schemas)
   * **Field names**: MUST match backend exactly (e.g., `user_id` not `userId`)
   * **Enum values**: MUST be identical to backend (e.g., `["OWNER", "ADMIN"]`)
   * Response wrappers can be skipped if API client handles them

---

### Field Naming Convention: snake_case vs camelCase

**Decision: Keep Backend Naming (snake_case) on Frontend**

This project uses `snake_case` field names throughout the entire stack (database → backend → frontend → UI). This is a deliberate architectural decision based on industry best practices.

#### Why Keep snake_case?

**Industry Examples:**
Many successful API-first companies maintain backend naming conventions in their client libraries:

* **Stripe JavaScript SDK** - Uses snake_case consistently
  ```javascript
  stripe.customers.create({
    email: 'customer@example.com',
    payment_method: 'pm_card_visa',  // snake_case
    invoice_settings: {
      default_payment_method: 'pm_card_visa'  // snake_case
    }
  })
  ```

* **Shopify API** - GraphQL fields are snake_case
  ```graphql
  {
    customer {
      created_at
      updated_at
      default_address {
        first_name
        last_name
      }
    }
  }
  ```

* **Twilio API** - All client SDKs preserve API field names
  ```javascript
  client.messages.create({
    to: '+1234567890',
    from: '+0987654321',
    status_callback: 'https://example.com/callback'  // snake_case
  })
  ```

* **AWS SDK** - Uses service definition naming (PascalCase in their case)

**Benefits of Keeping Backend Naming:**

1. ✅ **Zero Transformation Cost**
   ```typescript
   // API response → State (direct assignment)
   const entity = await api.getEntity();
   setState(entity);  // No conversion needed
   ```

2. ✅ **Impossible to Have Field Name Bugs**
   ```typescript
   // What you see in API is what you get in code
   // Network tab shows: user_id
   // Code shows: user_id
   // No mental mapping required
   ```

3. ✅ **Simpler Debugging**
   ```typescript
   // Backend logs: "entity_type: 'fund', user_id: 123"
   // Frontend logs: "entity_type: 'fund', user_id: 123"
   // Same identifiers everywhere = easier to trace issues
   ```

4. ✅ **Consistent Across All Clients**
   ```typescript
   // Web app, mobile app, CLI tools, webhooks
   // All use the same field names
   // Documentation matches code perfectly
   ```

5. ✅ **No Performance Overhead**
   ```typescript
   // No object transformation on every request/response
   // No recursive key mapping
   // Direct JSON parse → use
   ```

**Problems with Transformation to camelCase:**

If you transform to camelCase on the frontend, you need:

1. ❌ **Transformation Layer Everywhere**
   ```typescript
   // In service layer
   const transformToSnakeCase = (obj) => { /* Recursive transformation */ };
   const transformToCamelCase = (obj) => { /* Recursive transformation */ };

   // Every API call
   const response = await fetch('/api/entities');
   const data = transformToCamelCase(response);  // Manual transformation

   // Every POST/PUT
   const payload = transformToSnakeCase(input);  // Manual transformation
   await fetch('/api/entities', { body: payload });
   ```

2. ❌ **Risk of Mapping Errors**
   ```typescript
   // Easy to forget transformation
   const entity = await api.getEntity();
   console.log(entity.entityType);  // undefined! (it's entity_type)

   // Nested objects are tricky
   const transformed = transformKeys(entity);  // Did we handle all nesting?
   ```

3. ❌ **More Complex Codebase**
   ```typescript
   // Two naming conventions to maintain
   // Backend uses: entity_type, user_id, created_at
   // Frontend uses: entityType, userId, createdAt
   // Need to remember both systems
   ```

4. ❌ **Performance Overhead**
   ```typescript
   // Transform every API response (potentially thousands of objects)
   // Transform every request payload
   // Recursive traversal of nested objects and arrays
   // Can be significant with large datasets
   ```

5. ❌ **Debugging Complexity**
   ```typescript
   // Network inspector shows: user_id
   // React DevTools shows: userId
   // Need to mentally map between the two when debugging
   ```

6. ❌ **Maintenance Burden**
   ```typescript
   // Add new field? Update transformer
   // Nested object? Update transformer logic
   // Array of objects? Update transformer logic
   // Special cases? More transformer code
   ```

#### When to Consider Transformation

You might want to transform to camelCase if:
* ✅ You have a very large frontend team (50+ developers) where JS conventions matter more
* ✅ You have sophisticated build tools and code generation from API schemas
* ✅ Your frontend has complex domain logic that benefits from idiomatic JS
* ✅ You can afford dedicated developer experience (DX) team to maintain transformations

For small to medium projects, **the simplicity and reliability of keeping backend naming far outweighs the aesthetic preference for camelCase**.

---

### When To Use This Pattern

This pattern works well for:
* REST APIs
* GraphQL APIs
* Server Actions in Next.js
* Any CRUD-based application

It ensures consistency across projects while keeping schemas minimally complex.

---

### Exceptions

Add additional schemas only when absolutely necessary:
* Complex filtering/search operations might require a `FilterItemSchema`
* Relationships might require expanded schemas like `ItemWithRelatedSchema`

### Helper Functions

Helper functions can be added to schema files when they are:
* **Pure functions** (no side effects) that work with the schema types
* **Data manipulation/calculation** functions (formatting, filtering, analysis)
* **Reusable across client and server** without external dependencies

Helper functions should go in **actions** when they require:
* Database queries or external API calls
* Authentication/permission checks
* Complex business workflows with side effects

---

*This document serves as a reference for maintaining consistency across all projects. Adaptations may be needed for specific frameworks, but the core principles should remain the same.*