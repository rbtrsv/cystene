/**
 * Data / Analytics Schemas
 *
 * Zod validation schemas for connection data statistics.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Schema: /server/apps/ecommerce/schemas/data_schemas.py
 * - Router: /server/apps/ecommerce/subrouters/data_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Connection Stats Schema (Full Representation)
// ==========================================

/**
 * Connection statistics schema - imported data summary
 * Backend equivalent: class ConnectionStatsDetail(BaseModel)
 */
export const ConnectionStatsSchema = z.object({
  connection_id: z.number(),
  connection_name: z.string(),
  platform: z.string(),
  products_count: z.number(),
  orders_count: z.number(),
  last_sync: z.string().nullable(),
  data_freshness_days: z.number().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type ConnectionStats = z.infer<typeof ConnectionStatsSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing connection statistics
 * Backend equivalent: class ConnectionStatsResponse(BaseModel)
 */
export type ConnectionStatsResponse = {
  success: boolean;
  data?: ConnectionStats;
  error?: string;
};
