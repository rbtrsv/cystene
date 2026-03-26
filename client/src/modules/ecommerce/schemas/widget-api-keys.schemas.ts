/**
 * Widget API Key Schemas
 *
 * Zod validation schemas for widget API key management.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Schema: /server/apps/ecommerce/schemas/widget_api_key_schemas.py
 * - Router: /server/apps/ecommerce/subrouters/widget_api_key_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Widget API Key Schemas
// ==========================================

/**
 * Widget API key detail schema — listed keys (no plaintext secret)
 * Backend equivalent: class WidgetAPIKeyDetail(BaseModel)
 */
export const WidgetAPIKeyDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  api_key_prefix: z.string(),
  allowed_domains: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
});

/**
 * Widget API key created detail schema — includes plaintext secret (shown once)
 * Backend equivalent: class WidgetAPIKeyCreatedDetail(BaseModel)
 */
export const WidgetAPIKeyCreatedDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  api_key: z.string(),
  api_key_prefix: z.string(),
  created_at: z.string(),
});

// ==========================================
// Type Exports
// ==========================================

export type WidgetAPIKeyDetail = z.infer<typeof WidgetAPIKeyDetailSchema>;
export type WidgetAPIKeyCreatedDetail = z.infer<typeof WidgetAPIKeyCreatedDetailSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response for key creation — includes plaintext secret (shown once)
 * Backend equivalent: class WidgetAPIKeyCreatedResponse(BaseModel)
 */
export type WidgetAPIKeyCreatedResponse = {
  success: boolean;
  data?: WidgetAPIKeyCreatedDetail;
  error?: string;
};

/**
 * Response for listing widget API keys
 * Backend equivalent: class WidgetAPIKeyListResponse(BaseModel)
 */
export type WidgetAPIKeyListResponse = {
  success: boolean;
  data?: WidgetAPIKeyDetail[];
  count: number;
  error?: string;
};

/**
 * Simple message response
 * Backend equivalent: class MessageResponse(BaseModel)
 */
export type WidgetAPIKeyMessageResponse = {
  success: boolean;
  message?: string;
  error?: string;
};
