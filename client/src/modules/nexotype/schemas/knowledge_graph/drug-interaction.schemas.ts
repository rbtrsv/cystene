import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const InteractionTypeEnum = z.enum(['Synergy', 'Contraindication', 'Antagonism']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** DrugInteraction.interaction_type */
export const INTERACTION_TYPE_OPTIONS = [
  { label: 'Synergy', value: 'Synergy' },
  { label: 'Contraindication', value: 'Contraindication' },
  { label: 'Antagonism', value: 'Antagonism' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const DrugInteractionSchema = z.object({
  id: z.number(),
  asset_a_id: z.number().int(),
  asset_b_id: z.number().int(),
  interaction_type: InteractionTypeEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateDrugInteractionSchema = z.object({
  asset_a_id: z.number().int(),
  asset_b_id: z.number().int(),
  interaction_type: InteractionTypeEnum,
});

export const UpdateDrugInteractionSchema = z.object({
  asset_a_id: z.number().int().optional(),
  asset_b_id: z.number().int().optional(),
  interaction_type: InteractionTypeEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type DrugInteraction = z.infer<typeof DrugInteractionSchema>;
export type CreateDrugInteraction = z.infer<typeof CreateDrugInteractionSchema>;
export type UpdateDrugInteraction = z.infer<typeof UpdateDrugInteractionSchema>;
export type InteractionType = z.infer<typeof InteractionTypeEnum>;

// ==========================================
// Response Types
// ==========================================

export type DrugInteractionResponse = {
  success: boolean;
  data?: DrugInteraction;
  error?: string;
};

export type DrugInteractionsResponse = {
  success: boolean;
  data?: DrugInteraction[];
  count?: number;
  error?: string;
};
