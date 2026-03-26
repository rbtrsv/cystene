import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const MechanismEnum = z.enum(['Inhibitor', 'Agonist', 'Antagonist', 'Modulator']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** DrugTargetMechanism.mechanism */
export const MECHANISM_OPTIONS = [
  { label: 'Inhibitor', value: 'Inhibitor' },
  { label: 'Agonist', value: 'Agonist' },
  { label: 'Antagonist', value: 'Antagonist' },
  { label: 'Modulator', value: 'Modulator' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const DrugTargetMechanismSchema = z.object({
  id: z.number(),
  asset_id: z.number().int(),
  protein_id: z.number().int(),
  mechanism: MechanismEnum,
  affinity_value: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateDrugTargetMechanismSchema = z.object({
  asset_id: z.number().int(),
  protein_id: z.number().int(),
  mechanism: MechanismEnum,
  affinity_value: z.number().nullable().optional(),
});

export const UpdateDrugTargetMechanismSchema = z.object({
  asset_id: z.number().int().optional(),
  protein_id: z.number().int().optional(),
  mechanism: MechanismEnum.optional(),
  affinity_value: z.number().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type DrugTargetMechanism = z.infer<typeof DrugTargetMechanismSchema>;
export type CreateDrugTargetMechanism = z.infer<typeof CreateDrugTargetMechanismSchema>;
export type UpdateDrugTargetMechanism = z.infer<typeof UpdateDrugTargetMechanismSchema>;
export type Mechanism = z.infer<typeof MechanismEnum>;

// ==========================================
// Response Types
// ==========================================

export type DrugTargetMechanismResponse = {
  success: boolean;
  data?: DrugTargetMechanism;
  error?: string;
};

export type DrugTargetMechanismsResponse = {
  success: boolean;
  data?: DrugTargetMechanism[];
  count?: number;
  error?: string;
};
