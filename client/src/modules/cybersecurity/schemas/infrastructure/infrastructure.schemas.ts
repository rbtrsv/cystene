/**
 * Infrastructure Schemas
 *
 * Zod validation schemas for Infrastructure model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/cybersecurity/models/infrastructure_models.py
 * - Schema: /server/apps/cybersecurity/schemas/infrastructure_schemas/infrastructure_schemas.py
 * - Router: /server/apps/cybersecurity/subrouters/infrastructure_subrouters/infrastructure_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Infrastructure type options — matches backend InfraType enum
 * Backend: class InfraType(str, Enum)
 */
export const InfraTypeEnum = z.enum(['server', 'application', 'database', 'network_device', 'cloud_service', 'cloud_account']);

/**
 * Environment options — matches backend Environment enum
 * Backend: class Environment(str, Enum)
 */
export const EnvironmentEnum = z.enum(['production', 'staging', 'development', 'testing']);

/**
 * Criticality level options — matches backend Criticality enum
 * Backend: class Criticality(str, Enum)
 */
export const CriticalityEnum = z.enum(['critical', 'high', 'medium', 'low']);

// ==========================================
// Infrastructure Schema (Full Representation)
// ==========================================

/**
 * Infrastructure schema — full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class InfrastructureDetail(BaseModel)
 */
export const InfrastructureSchema = z.object({
  id: z.number(),
  organization_id: z.number(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  infra_type: InfraTypeEnum,
  description: z.string().nullable().optional(),
  environment: EnvironmentEnum,
  criticality: CriticalityEnum,
  owner: z.string().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  hostname: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  cloud_provider: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating new infrastructure (POST)
 * Excludes: id, organization_id, created_at, updated_at (auto-generated or set by server)
 *
 * Backend equivalent: class InfrastructureCreate(BaseModel)
 */
export const CreateInfrastructureSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  infra_type: InfraTypeEnum,
  description: z.string().nullable().optional(),
  environment: EnvironmentEnum.default('production').optional(),
  criticality: CriticalityEnum.default('medium').optional(),
  owner: z.string().max(255).nullable().optional(),
  ip_address: z.string().max(255).nullable().optional(),
  hostname: z.string().max(255).nullable().optional(),
  url: z.string().max(500).nullable().optional(),
  cloud_provider: z.string().max(100).nullable().optional(),
  region: z.string().max(100).nullable().optional(),
  tags: z.string().max(500).nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().default(true).optional(),
});

/**
 * Schema for updating infrastructure (PUT)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class InfrastructureUpdate(BaseModel)
 */
export const UpdateInfrastructureSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  infra_type: InfraTypeEnum.optional(),
  description: z.string().nullable().optional(),
  environment: EnvironmentEnum.optional(),
  criticality: CriticalityEnum.optional(),
  owner: z.string().max(255).nullable().optional(),
  ip_address: z.string().max(255).nullable().optional(),
  hostname: z.string().max(255).nullable().optional(),
  url: z.string().max(500).nullable().optional(),
  cloud_provider: z.string().max(100).nullable().optional(),
  region: z.string().max(100).nullable().optional(),
  tags: z.string().max(500).nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type InfraType = z.infer<typeof InfraTypeEnum>;
export type Environment = z.infer<typeof EnvironmentEnum>;
export type Criticality = z.infer<typeof CriticalityEnum>;
export type Infrastructure = z.infer<typeof InfrastructureSchema>;
export type CreateInfrastructure = z.infer<typeof CreateInfrastructureSchema>;
export type UpdateInfrastructure = z.infer<typeof UpdateInfrastructureSchema>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for infrastructure types */
export const INFRA_TYPE_LABELS: Record<InfraType, string> = {
  server: 'Server',
  application: 'Application',
  database: 'Database',
  network_device: 'Network Device',
  cloud_service: 'Cloud Service',
  cloud_account: 'Cloud Account',
};

/** Human-readable labels for environments */
export const ENVIRONMENT_LABELS: Record<Environment, string> = {
  production: 'Production',
  staging: 'Staging',
  development: 'Development',
  testing: 'Testing',
};

/** Human-readable labels for criticality levels */
export const CRITICALITY_LABELS: Record<Criticality, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const getInfraTypeLabel = (type: string): string => {
  return INFRA_TYPE_LABELS[type as InfraType] || type;
};

export const getEnvironmentLabel = (env: string): string => {
  return ENVIRONMENT_LABELS[env as Environment] || env;
};

export const getCriticalityLabel = (crit: string): string => {
  return CRITICALITY_LABELS[crit as Criticality] || crit;
};

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single infrastructure item
 * Backend equivalent: class InfrastructureResponse(BaseModel)
 */
export type InfrastructureResponse = {
  success: boolean;
  data?: Infrastructure;
  error?: string;
};

/**
 * Response containing multiple infrastructure items
 * Backend equivalent: class InfrastructuresResponse(BaseModel)
 */
export type InfrastructuresResponse = {
  success: boolean;
  data?: Infrastructure[];
  error?: string;
};
