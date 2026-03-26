/**
 * Recommendation Settings Schemas
 *
 * Zod validation schemas for RecommendationSettings model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/ecommerce/models.py → RecommendationSettings
 * - Schema: /server/apps/ecommerce/schemas/recommendation_settings_schemas.py
 * - Router: /server/apps/ecommerce/subrouters/recommendation_settings_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Bestseller method options - matches backend BestsellerMethod enum
 * Backend: class BestsellerMethod(str, Enum)
 */
export const BestsellerMethodEnum = z.enum(['volume', 'value', 'balanced']);

// ==========================================
// Settings Schema (Full Representation)
// ==========================================

/**
 * Recommendation settings schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class RecommendationSettingsDetail(BaseModel)
 */
export const RecommendationSettingsSchema = z.object({
  id: z.number(),
  connection_id: z.number(),
  bestseller_method: BestsellerMethodEnum,
  bestseller_lookback_days: z.number(),
  crosssell_lookback_days: z.number(),
  max_recommendations: z.number(),
  min_price_increase_percent: z.number(),
  shop_base_url: z.string().nullable(),
  product_url_template: z.string().nullable(),
  // Brand identity defaults — visual settings for widget rendering
  // Group 1: Widget Container
  widget_bg_color: z.string().nullable(),
  widget_padding: z.number().nullable(),
  // Group 2: Widget Title
  widget_title: z.string().nullable(),
  title_color: z.string().nullable(),
  title_size: z.number().nullable(),
  title_alignment: z.string().nullable(),
  // Group 3: Layout
  widget_style: z.string().nullable(),
  widget_columns: z.number().nullable(),
  gap: z.number().nullable(),
  card_min_width: z.number().nullable(),
  card_max_width: z.number().nullable(),
  // Group 4: Product Card
  card_bg_color: z.string().nullable(),
  card_border_radius: z.number().nullable(),
  card_border_width: z.number().nullable(),
  card_border_color: z.string().nullable(),
  card_shadow: z.string().nullable(),
  card_padding: z.number().nullable(),
  card_hover: z.string().nullable(),
  // Group 5: Product Image
  image_aspect_w: z.number().nullable(),
  image_aspect_h: z.number().nullable(),
  image_fit: z.string().nullable(),
  image_radius: z.number().nullable(),
  // Group 6: Product Title in Card
  product_title_color: z.string().nullable(),
  product_title_size: z.number().nullable(),
  product_title_weight: z.number().nullable(),
  product_title_lines: z.number().nullable(),
  product_title_alignment: z.string().nullable(),
  // Group 7: Price
  show_price: z.boolean().nullable(),
  price_color: z.string().nullable(),
  price_size: z.number().nullable(),
  // Group 8: CTA Button
  button_text: z.string().nullable(),
  button_bg_color: z.string().nullable(),
  button_text_color: z.string().nullable(),
  button_radius: z.number().nullable(),
  button_size: z.number().nullable(),
  button_variant: z.string().nullable(),
  button_full_width: z.boolean().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating or updating recommendation settings (PUT)
 * connection_id is passed in the URL path, not in the body
 *
 * Backend equivalent: class RecommendationSettingsCreateOrUpdate(BaseModel)
 */
export const CreateOrUpdateSettingsSchema = z.object({
  // connection_id is passed in the URL path, not in the body
  bestseller_method: BestsellerMethodEnum.default('volume'),
  bestseller_lookback_days: z.number().min(1).max(365).default(30),
  crosssell_lookback_days: z.number().min(1).max(365).default(30),
  max_recommendations: z.number().min(1).max(100).default(10),
  min_price_increase_percent: z.number().min(0).max(1000).default(10),
  shop_base_url: z.string().nullable().optional(),
  product_url_template: z.string().nullable().optional(),
  // Brand identity defaults — visual settings for widget rendering
  // Group 1: Widget Container
  widget_bg_color: z.string().nullable().optional(),
  widget_padding: z.number().nullable().optional(),
  // Group 2: Widget Title
  widget_title: z.string().nullable().optional(),
  title_color: z.string().nullable().optional(),
  title_size: z.number().nullable().optional(),
  title_alignment: z.string().nullable().optional(),
  // Group 3: Layout
  widget_style: z.string().nullable().optional(),
  widget_columns: z.number().min(1).max(6).nullable().optional(),
  gap: z.number().nullable().optional(),
  card_min_width: z.number().nullable().optional(),
  card_max_width: z.number().nullable().optional(),
  // Group 4: Product Card
  card_bg_color: z.string().nullable().optional(),
  card_border_radius: z.number().nullable().optional(),
  card_border_width: z.number().nullable().optional(),
  card_border_color: z.string().nullable().optional(),
  card_shadow: z.string().nullable().optional(),
  card_padding: z.number().nullable().optional(),
  card_hover: z.string().nullable().optional(),
  // Group 5: Product Image
  image_aspect_w: z.number().nullable().optional(),
  image_aspect_h: z.number().nullable().optional(),
  image_fit: z.string().nullable().optional(),
  image_radius: z.number().nullable().optional(),
  // Group 6: Product Title in Card
  product_title_color: z.string().nullable().optional(),
  product_title_size: z.number().nullable().optional(),
  product_title_weight: z.number().nullable().optional(),
  product_title_lines: z.number().min(1).max(3).nullable().optional(),
  product_title_alignment: z.string().nullable().optional(),
  // Group 7: Price
  show_price: z.boolean().nullable().optional(),
  price_color: z.string().nullable().optional(),
  price_size: z.number().nullable().optional(),
  // Group 8: CTA Button
  button_text: z.string().nullable().optional(),
  button_bg_color: z.string().nullable().optional(),
  button_text_color: z.string().nullable().optional(),
  button_radius: z.number().nullable().optional(),
  button_size: z.number().nullable().optional(),
  button_variant: z.string().nullable().optional(),
  button_full_width: z.boolean().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type BestsellerMethod = z.infer<typeof BestsellerMethodEnum>;
export type RecommendationSettings = z.infer<typeof RecommendationSettingsSchema>;
export type CreateOrUpdateSettings = z.infer<typeof CreateOrUpdateSettingsSchema>;

// ==========================================
// Connection Settings (list response item)
// ==========================================

/**
 * Connection settings schema - used in list response
 * Shows connection info alongside its settings
 */
export const ConnectionSettingsSchema = z.object({
  connection_id: z.number(),
  connection_name: z.string(),
  platform: z.string(),
  settings: RecommendationSettingsSchema.nullable(),
});
export type ConnectionSettings = z.infer<typeof ConnectionSettingsSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single settings object
 * Backend equivalent: class RecommendationSettingsResponse(BaseModel)
 */
export type SettingsResponse = {
  success: boolean;
  data?: RecommendationSettings;
  error?: string;
};

/**
 * Response containing list of connection settings
 * Backend equivalent: class RecommendationSettingsListResponse(BaseModel)
 */
export type SettingsListResponse = {
  success: boolean;
  data?: ConnectionSettings[];
  error?: string;
};
