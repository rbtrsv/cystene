import { z } from 'zod';

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const SmallMoleculeSchema = z.object({
  id: z.number(),
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  project_code: z.string().max(50).nullable().optional(),
  asset_type: z.string().max(50),
  smiles: z.string().min(1),
  inchi_key: z.string().max(27).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateSmallMoleculeSchema = z.object({
  uid: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  project_code: z.string().max(50).nullable().optional(),
  smiles: z.string().min(1),
  inchi_key: z.string().max(27).nullable().optional(),
});

export const UpdateSmallMoleculeSchema = z.object({
  uid: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  project_code: z.string().max(50).nullable().optional(),
  smiles: z.string().min(1).optional(),
  inchi_key: z.string().max(27).nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type SmallMolecule = z.infer<typeof SmallMoleculeSchema>;
export type CreateSmallMolecule = z.infer<typeof CreateSmallMoleculeSchema>;
export type UpdateSmallMolecule = z.infer<typeof UpdateSmallMoleculeSchema>;

// ==========================================
// Response Types
// ==========================================

export type SmallMoleculeResponse = {
  success: boolean;
  data?: SmallMolecule;
  error?: string;
};

export type SmallMoleculesResponse = {
  success: boolean;
  data?: SmallMolecule[];
  count?: number;
  error?: string;
};
