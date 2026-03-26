/**
 * Entity Schemas
 *
 * Zod validation schemas for Entity model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/entity_models.py
 * - Schema: /server/apps/assetmanager/schemas/entity_schemas/entity_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/entity_subrouters/entity_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Entity type options - matches backend EntityType enum
 * Backend: class EntityType(str, Enum)
 */
export const EntityTypeEnum = z.enum(['fund', 'company', 'individual']);

/**
 * Entity role options - matches backend EntityRole enum
 * Backend: class EntityRole(str, Enum)
 */
export const EntityRoleEnum = z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']);

// ==========================================
// Entity Schema (Full Representation)
// ==========================================

/**
 * Entity schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class Entity(BaseModel)
 */
export const EntitySchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  entity_type: EntityTypeEnum,
  parent_id: z.number().nullable(),
  current_valuation: z.number().nullable(),
  organization_id: z.number(),
  cash_balance: z.number().default(0),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new entity (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class CreateEntity(BaseModel)
 */
export const CreateEntitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  entity_type: EntityTypeEnum,
  parent_id: z.number().nullable().optional(),
  current_valuation: z.number().nullable().optional(),
  organization_id: z.number(),
  cash_balance: z.number().default(0).optional(),
});

/**
 * Schema for updating an entity (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class UpdateEntity(BaseModel)
 */
export const UpdateEntitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  entity_type: EntityTypeEnum.optional(),
  parent_id: z.number().nullable().optional(),
  current_valuation: z.number().nullable().optional(),
  cash_balance: z.number().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type EntityType = z.infer<typeof EntityTypeEnum>;
export type EntityRole = z.infer<typeof EntityRoleEnum>;
export type Entity = z.infer<typeof EntitySchema>;
export type CreateEntity = z.infer<typeof CreateEntitySchema>;
export type UpdateEntity = z.infer<typeof UpdateEntitySchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for entity types */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  fund: 'Fund',
  company: 'Company',
  individual: 'Individual',
};

/**
 * Get human-readable label for an entity type
 * @param type Entity type enum value
 * @returns Display label string
 */
export const getEntityTypeLabel = (type: string): string => {
  return ENTITY_TYPE_LABELS[type as EntityType] || type;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single entity
 * Backend equivalent: class EntityResponse(BaseModel)
 */
export type EntityResponse = {
  success: boolean;
  data?: Entity;
  error?: string;
};

/**
 * Response containing multiple entities
 * Backend equivalent: class EntitiesResponse(BaseModel)
 */
export type EntitiesResponse = {
  success: boolean;
  data?: Entity[];
  error?: string;
};
