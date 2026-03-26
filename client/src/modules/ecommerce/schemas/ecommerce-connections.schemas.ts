/**
 * Ecommerce Connection Schemas
 *
 * Zod validation schemas for EcommerceConnection model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/ecommerce/models.py → EcommerceConnection
 * - Schema: /server/apps/ecommerce/schemas/ecommerce_connection_schemas.py
 * - Router: /server/apps/ecommerce/subrouters/ecommerce_connection_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Supported ecommerce platforms - matches backend PlatformType enum
 * Backend: class PlatformType(str, Enum)
 */
export const PlatformTypeEnum = z.enum(['shopify', 'woocommerce', 'magento', 'custom_integration']);

/**
 * Connection method options - matches backend ConnectionMethod enum
 * Backend: class ConnectionMethod(str, Enum)
 */
export const ConnectionMethodEnum = z.enum(['api', 'database', 'ingest']);

/**
 * Auto-sync frequency options - matches backend SyncInterval enum
 * Backend: class SyncInterval(str, Enum)
 */
export const SyncIntervalEnum = z.enum(['hourly', 'every_6_hours', 'daily', 'weekly']);

// ==========================================
// Connection Schema (Full Representation)
// ==========================================

/**
 * Connection schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class EcommerceConnectionDetail(BaseModel)
 */
export const ConnectionSchema = z.object({
  id: z.number(),
  connection_name: z.string(),
  platform: PlatformTypeEnum,
  connection_method: ConnectionMethodEnum,
  // API fields (api_key/api_secret excluded — backend never exposes secrets)
  store_url: z.string().nullable(),
  // Database fields (db_password excluded — backend never exposes secrets)
  db_host: z.string().nullable(),
  db_name: z.string().nullable(),
  db_user: z.string().nullable(),
  db_port: z.number().nullable(),
  is_active: z.boolean(),
  // Auto-Sync fields — periodic data pull status and schedule
  auto_sync_enabled: z.boolean(),
  sync_interval: z.string(),
  last_synced_at: z.string().nullable(),
  next_sync_at: z.string().nullable(),
  last_sync_status: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new connection (POST)
 * Excludes: id, is_active, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class EcommerceConnectionCreate(BaseModel)
 */
export const CreateConnectionSchema = z.object({
  connection_name: z.string().min(3, 'Connection name must be at least 3 characters'),
  platform: PlatformTypeEnum,
  connection_method: ConnectionMethodEnum.default('api'),
  // API-based fields
  store_url: z.string().nullable().optional(),
  api_key: z.string().nullable().optional(),
  api_secret: z.string().nullable().optional(),
  // Database-based fields
  db_host: z.string().nullable().optional(),
  db_name: z.string().nullable().optional(),
  db_user: z.string().nullable().optional(),
  db_password: z.string().nullable().optional(),
  db_port: z.number().nullable().optional(),
});

/**
 * Schema for updating a connection (PUT)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class EcommerceConnectionUpdate(BaseModel)
 */
export const UpdateConnectionSchema = z.object({
  connection_name: z.string().nullable().optional(),
  platform: PlatformTypeEnum.nullable().optional(),
  connection_method: ConnectionMethodEnum.nullable().optional(),
  // API-based fields
  store_url: z.string().nullable().optional(),
  api_key: z.string().nullable().optional(),
  api_secret: z.string().nullable().optional(),
  // Database-based fields
  db_host: z.string().nullable().optional(),
  db_name: z.string().nullable().optional(),
  db_user: z.string().nullable().optional(),
  db_password: z.string().nullable().optional(),
  db_port: z.number().nullable().optional(),
  // Auto-Sync settings
  auto_sync_enabled: z.boolean().nullable().optional(),
  sync_interval: SyncIntervalEnum.nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type PlatformType = z.infer<typeof PlatformTypeEnum>;
export type ConnectionMethod = z.infer<typeof ConnectionMethodEnum>;
export type SyncInterval = z.infer<typeof SyncIntervalEnum>;
export type Connection = z.infer<typeof ConnectionSchema>;
export type CreateConnection = z.infer<typeof CreateConnectionSchema>;
export type UpdateConnection = z.infer<typeof UpdateConnectionSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single connection
 * Backend equivalent: class EcommerceConnectionResponse(BaseModel)
 */
export type ConnectionResponse = {
  success: boolean;
  data?: Connection;
  error?: string;
};

/**
 * Response containing multiple connections
 * Backend equivalent: class EcommerceConnectionListResponse(BaseModel)
 */
export type ConnectionsResponse = {
  success: boolean;
  data?: Connection[];
  count?: number;
  error?: string;
};

/**
 * Response for connection test results
 * Backend equivalent: class EcommerceConnectionTestResponse(BaseModel)
 */
export type ConnectionTestResponse = {
  success: boolean;
  message: string;
  sample_products_count?: number;
};
