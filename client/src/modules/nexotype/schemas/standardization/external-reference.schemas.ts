import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const EntityTypeEnum = z.enum(['protein', 'gene', 'asset']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** ExternalReference.entity_type */
export const ENTITY_TYPE_OPTIONS = [
  { label: 'Protein', value: 'protein' },
  { label: 'Gene', value: 'gene' },
  { label: 'Asset', value: 'asset' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const ExternalReferenceSchema = z.object({
  id: z.number(),
  entity_type: EntityTypeEnum,
  entity_id: z.number(),
  source: z.string().min(1).max(50),
  external_id: z.string().min(1).max(100),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateExternalReferenceSchema = z.object({
  entity_type: EntityTypeEnum,
  entity_id: z.number(),
  source: z.string().min(1).max(50),
  external_id: z.string().min(1).max(100),
});

export const UpdateExternalReferenceSchema = z.object({
  entity_type: EntityTypeEnum.optional(),
  entity_id: z.number().optional(),
  source: z.string().min(1).max(50).optional(),
  external_id: z.string().min(1).max(100).optional(),
});

// ==========================================
// Types
// ==========================================

export type ExternalReference = z.infer<typeof ExternalReferenceSchema>;
export type CreateExternalReference = z.infer<typeof CreateExternalReferenceSchema>;
export type UpdateExternalReference = z.infer<typeof UpdateExternalReferenceSchema>;
export type EntityType = z.infer<typeof EntityTypeEnum>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for entity types */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  protein: 'Protein',
  gene: 'Gene',
  asset: 'Asset',
};

/** Get human-readable label for an entity type */
export const getEntityTypeLabel = (type: string): string => {
  return ENTITY_TYPE_LABELS[type as EntityType] || type;
};

// ==========================================
// Response Types
// ==========================================

export type ExternalReferenceResponse = {
  success: boolean;
  data?: ExternalReference;
  error?: string;
};

export type ExternalReferencesResponse = {
  success: boolean;
  data?: ExternalReference[];
  count?: number;
  error?: string;
};
