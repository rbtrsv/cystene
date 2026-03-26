/**
 * Recommendation Schemas
 *
 * Zod validation schemas for recommendation engine results.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Schema: /server/apps/ecommerce/schemas/recommendation_schemas.py
 * - Router: /server/apps/ecommerce/subrouters/recommendation_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Recommendation type options - matches backend RecommendationType enum
 * Backend: class RecommendationType(str, Enum)
 */
export const RecommendationTypeEnum = z.enum([
  'bestseller',
  'cross_sell',
  'up_sell',
  'similar',
  'user_based',
]);

// ==========================================
// Recommendation Schemas (Full Representation)
// ==========================================

/**
 * Product recommendation schema - single recommended product
 * Backend equivalent: class ProductRecommendation(BaseModel)
 */
export const ProductRecommendationSchema = z.object({
  product_id: z.string(),
  title: z.string(),
  price: z.number(),
  handle: z.string().nullable(),
  vendor: z.string().nullable(),
  sku: z.string().nullable(),
  position: z.number(),
  metrics: z.record(z.string(), z.unknown()).nullable(),
  co_occurrence_count: z.number().nullable(),
  price_increase_percent: z.number().nullable(),
  similarity_score: z.number().nullable(),
});

/**
 * Recommendation result schema - full recommendation response
 * Backend equivalent: class RecommendationResult(BaseModel)
 */
export const RecommendationResultSchema = z.object({
  recommendations: z.array(ProductRecommendationSchema),
  count: z.number(),
  method: z.string().nullable(),
  base_product_id: z.string().nullable(),
  lookback_days: z.number(),
  generated_at: z.string(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Input schema for bestsellers endpoint
 * Backend equivalent: query params on GET /recommendations/bestsellers
 */
export const BestsellersInputSchema = z.object({
  connection_id: z.number(),
  limit: z.number().default(10),
  lookback_days: z.number().default(30),
  method: z.enum(['volume', 'value', 'balanced']).default('volume'),
});

/**
 * Input schema for cross-sell endpoint
 * Backend equivalent: query params on GET /recommendations/cross-sell
 */
export const CrossSellInputSchema = z.object({
  connection_id: z.number(),
  product_id: z.string().min(1, 'Product ID is required'),
  limit: z.number().default(10),
  lookback_days: z.number().default(30),
});

/**
 * Input schema for upsell endpoint
 * Backend equivalent: query params on GET /recommendations/upsell
 */
export const UpsellInputSchema = z.object({
  connection_id: z.number(),
  product_id: z.string().min(1, 'Product ID is required'),
  limit: z.number().default(10),
  lookback_days: z.number().default(30),
  min_price_increase_percent: z.number().default(10),
});

/**
 * Input schema for similar products endpoint
 * Backend equivalent: query params on GET /recommendations/similar
 */
export const SimilarInputSchema = z.object({
  connection_id: z.number(),
  product_id: z.string().min(1, 'Product ID is required'),
  limit: z.number().default(10),
  lookback_days: z.number().default(30),
});

// ==========================================
// Type Exports
// ==========================================

export type RecommendationType = z.infer<typeof RecommendationTypeEnum>;
export type ProductRecommendation = z.infer<typeof ProductRecommendationSchema>;
export type RecommendationResult = z.infer<typeof RecommendationResultSchema>;
export type BestsellersInput = z.infer<typeof BestsellersInputSchema>;
export type CrossSellInput = z.infer<typeof CrossSellInputSchema>;
export type UpsellInput = z.infer<typeof UpsellInputSchema>;
export type SimilarInput = z.infer<typeof SimilarInputSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing recommendation results
 * Backend equivalent: RecommendationResult wrapped in standard response
 */
export type RecommendationResponse = {
  success: boolean;
  data?: RecommendationResult;
  error?: string;
};
