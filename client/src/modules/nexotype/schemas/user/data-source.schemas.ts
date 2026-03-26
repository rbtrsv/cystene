import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

export const DataSourceTypeEnum = z.enum(['Wearable', 'Lab', 'Genetic']);

// ==========================================
// Options (for Select dropdowns)
// ==========================================

/** DataSource.source_type */
export const DATA_SOURCE_TYPE_OPTIONS = [
  { label: 'Wearable', value: 'Wearable' },
  { label: 'Lab', value: 'Lab' },
  { label: 'Genetic', value: 'Genetic' },
] as const;

// ==========================================
// Full Schema (GET responses)
// ==========================================

export const DataSourceSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  source_type: DataSourceTypeEnum,
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

export const CreateDataSourceSchema = z.object({
  name: z.string().min(1).max(100),
  source_type: DataSourceTypeEnum,
});

export const UpdateDataSourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  source_type: DataSourceTypeEnum.optional(),
});

// ==========================================
// Types
// ==========================================

export type DataSource = z.infer<typeof DataSourceSchema>;
export type CreateDataSource = z.infer<typeof CreateDataSourceSchema>;
export type UpdateDataSource = z.infer<typeof UpdateDataSourceSchema>;
export type DataSourceType = z.infer<typeof DataSourceTypeEnum>;

// ==========================================
// Response Types
// ==========================================

export type DataSourceResponse = {
  success: boolean;
  data?: DataSource;
  error?: string;
};

export type DataSourcesResponse = {
  success: boolean;
  data?: DataSource[];
  count?: number;
  error?: string;
};
