/**
 * Security Schemas
 *
 * Zod validation schemas for Security model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/captable_models.py
 * - Schema: /server/apps/assetmanager/schemas/captable_schemas/security_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/captable_subrouters/security_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Security type options - matches backend SecurityType enum
 * Backend: class SecurityType(str, Enum)
 */
export const SecurityTypeEnum = z.enum([
  'common',
  'preferred',
  'convertible',
  'warrant',
  'option',
  'bond',
  'safe',
]);

/**
 * Currency options - matches backend Currency enum
 * Backend: class Currency(str, Enum)
 */
export const CurrencyEnum = z.enum([
  'USD',
  'EUR',
  'GBP',
  'RON',
  'CHF',
  'JPY',
  'CNY',
  'AUD',
  'CAD',
  'SGD',
  'HKD',
]);

/**
 * Anti-dilution protection types - matches backend AntiDilutionType enum
 * Backend: class AntiDilutionType(str, Enum)
 */
export const AntiDilutionTypeEnum = z.enum([
  'none',
  'full_ratchet',
  'weighted_average',
]);

/**
 * Interest rate types - matches backend InterestRateType enum
 * Backend: class InterestRateType(str, Enum)
 */
export const InterestRateTypeEnum = z.enum([
  'fixed',
  'variable',
  'simple',
  'compound',
]);

// ==========================================
// Security Schema (Full Representation)
// ==========================================

/**
 * Security schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class Security(BaseModel)
 */
export const SecuritySchema = z.object({
  id: z.number(),
  funding_round_id: z.number(),
  security_name: z.string().min(1, 'Security name is required').max(255, 'Security name must be less than 255 characters'),
  code: z.string().max(20, 'Code must be less than 20 characters'),
  security_type: SecurityTypeEnum,
  currency: CurrencyEnum,
  issue_price: z.number().nullable(),
  special_terms: z.string().nullable(),

  // Stock Fields
  is_preferred: z.boolean().nullable(),

  // Voting Rights
  has_voting_rights: z.boolean().nullable(),
  voting_ratio: z.number().nullable(),

  // Dividend Rights
  has_dividend_rights: z.boolean().nullable(),
  dividend_rate: z.number().nullable(),
  is_dividend_cumulative: z.boolean().nullable(),

  // Liquidation & Participation
  liquidation_preference: z.number().nullable(),
  has_participation: z.boolean().nullable(),
  participation_cap: z.number().nullable(),
  seniority: z.number().nullable(),
  anti_dilution: AntiDilutionTypeEnum.nullable(),

  // Conversion Rights
  has_conversion_rights: z.boolean().nullable(),
  conversion_ratio: z.number().nullable(),

  // Redemption Rights
  has_redemption_rights: z.boolean().nullable(),
  redemption_term: z.number().nullable(),

  // Convertible Security Fields
  interest_rate: z.number().nullable(),
  interest_rate_type: InterestRateTypeEnum.nullable(),
  interest_period: z.string().nullable(),
  maturity_date: z.string().nullable(), // ISO date string from backend
  valuation_cap: z.number().nullable(),
  conversion_discount: z.number().nullable(),
  conversion_basis: z.string().nullable(),

  // Option-Specific Fields
  option_type: z.string().nullable(),

  // Vesting & Exercise Terms
  vesting_start: z.string().nullable(), // ISO date string from backend
  vesting_months: z.number().nullable(),
  cliff_months: z.number().nullable(),
  vesting_schedule_type: z.string().nullable(),
  exercise_window_days: z.number().nullable(),
  strike_price: z.number().nullable(),
  expiration_date: z.string().nullable(), // ISO date string from backend
  termination_date: z.string().nullable(), // ISO date string from backend

  // Option Pool Management
  pool_name: z.string().nullable(),
  pool_size: z.number().nullable(),
  pool_available: z.number().nullable(),
  is_active: z.boolean().nullable(),

  // Warrant-Specific Fields
  warrant_type: z.string().nullable(),
  is_detachable: z.boolean(),
  deal_context: z.string().nullable(),
  is_transferable: z.boolean(),

  // Shared Option/Warrant Fields
  total_shares: z.number().nullable(),
  issue_rights: z.string().nullable(),
  convert_to: z.string().nullable(),

  // Bond Fields
  principal: z.number().nullable(),
  coupon_rate: z.number().nullable(),
  coupon_frequency: z.string().nullable(),
  principal_frequency: z.string().nullable(),
  tenure_months: z.number().nullable(),
  moratorium_period: z.number().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new security (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class SecurityCreate(BaseModel)
 */
export const CreateSecuritySchema = z.object({
  // Core Fields (required)
  funding_round_id: z.number(),
  security_name: z.string().min(1, 'Security name is required').max(255, 'Security name must be less than 255 characters'),
  code: z.string().max(20, 'Code must be less than 20 characters'),
  security_type: SecurityTypeEnum,
  currency: CurrencyEnum.default('USD'),
  issue_price: z.number().nullable().optional(),
  special_terms: z.string().nullable().optional(),

  // Stock Fields
  is_preferred: z.boolean().nullable().optional(),

  // Voting Rights
  has_voting_rights: z.boolean().nullable().optional(),
  voting_ratio: z.number().nullable().optional(),

  // Dividend Rights
  has_dividend_rights: z.boolean().nullable().optional(),
  dividend_rate: z.number().nullable().optional(),
  is_dividend_cumulative: z.boolean().nullable().optional(),

  // Liquidation & Participation
  liquidation_preference: z.number().nullable().optional(),
  has_participation: z.boolean().nullable().optional(),
  participation_cap: z.number().nullable().optional(),
  seniority: z.number().nullable().optional(),
  anti_dilution: AntiDilutionTypeEnum.nullable().optional(),

  // Conversion Rights
  has_conversion_rights: z.boolean().nullable().optional(),
  conversion_ratio: z.number().nullable().optional(),

  // Redemption Rights
  has_redemption_rights: z.boolean().nullable().optional(),
  redemption_term: z.number().nullable().optional(),

  // Convertible Security Fields
  interest_rate: z.number().nullable().optional(),
  interest_rate_type: InterestRateTypeEnum.nullable().optional(),
  interest_period: z.string().nullable().optional(),
  maturity_date: z.string().nullable().optional(), // ISO date string
  valuation_cap: z.number().nullable().optional(),
  conversion_discount: z.number().nullable().optional(),
  conversion_basis: z.string().max(50, 'Conversion basis must be less than 50 characters').nullable().optional(),

  // Option-Specific Fields
  option_type: z.string().nullable().optional(),

  // Vesting & Exercise Terms
  vesting_start: z.string().nullable().optional(), // ISO date string
  vesting_months: z.number().nullable().optional(),
  cliff_months: z.number().nullable().optional(),
  vesting_schedule_type: z.string().nullable().optional(),
  exercise_window_days: z.number().nullable().optional(),
  strike_price: z.number().nullable().optional(),
  expiration_date: z.string().nullable().optional(), // ISO date string
  termination_date: z.string().nullable().optional(), // ISO date string

  // Option Pool Management
  pool_name: z.string().nullable().optional(),
  pool_size: z.number().nullable().optional(),
  pool_available: z.number().nullable().optional(),
  is_active: z.boolean().nullable().optional(),

  // Warrant-Specific Fields
  warrant_type: z.string().nullable().optional(),
  is_detachable: z.boolean().default(false),
  deal_context: z.string().nullable().optional(),
  is_transferable: z.boolean().default(false),

  // Shared Option/Warrant Fields
  total_shares: z.number().nullable().optional(),
  issue_rights: z.string().max(50, 'Issue rights must be less than 50 characters').nullable().optional(),
  convert_to: z.string().nullable().optional(),

  // Bond Fields
  principal: z.number().nullable().optional(),
  coupon_rate: z.number().nullable().optional(),
  coupon_frequency: z.string().nullable().optional(),
  principal_frequency: z.string().nullable().optional(),
  tenure_months: z.number().nullable().optional(),
  moratorium_period: z.number().nullable().optional(),
});

/**
 * Schema for updating a security (PUT)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class SecurityUpdate(BaseModel)
 */
export const UpdateSecuritySchema = z.object({
  // Core Fields
  funding_round_id: z.number().optional(),
  security_name: z.string().min(1, 'Security name is required').max(255, 'Security name must be less than 255 characters').optional(),
  code: z.string().max(20, 'Code must be less than 20 characters').optional(),
  security_type: SecurityTypeEnum.optional(),
  currency: CurrencyEnum.optional(),
  issue_price: z.number().nullable().optional(),
  special_terms: z.string().nullable().optional(),

  // Stock Fields
  is_preferred: z.boolean().nullable().optional(),

  // Voting Rights
  has_voting_rights: z.boolean().nullable().optional(),
  voting_ratio: z.number().nullable().optional(),

  // Dividend Rights
  has_dividend_rights: z.boolean().nullable().optional(),
  dividend_rate: z.number().nullable().optional(),
  is_dividend_cumulative: z.boolean().nullable().optional(),

  // Liquidation & Participation
  liquidation_preference: z.number().nullable().optional(),
  has_participation: z.boolean().nullable().optional(),
  participation_cap: z.number().nullable().optional(),
  seniority: z.number().nullable().optional(),
  anti_dilution: AntiDilutionTypeEnum.nullable().optional(),

  // Conversion Rights
  has_conversion_rights: z.boolean().nullable().optional(),
  conversion_ratio: z.number().nullable().optional(),

  // Redemption Rights
  has_redemption_rights: z.boolean().nullable().optional(),
  redemption_term: z.number().nullable().optional(),

  // Convertible Security Fields
  interest_rate: z.number().nullable().optional(),
  interest_rate_type: InterestRateTypeEnum.nullable().optional(),
  interest_period: z.string().nullable().optional(),
  maturity_date: z.string().nullable().optional(),
  valuation_cap: z.number().nullable().optional(),
  conversion_discount: z.number().nullable().optional(),
  conversion_basis: z.string().max(50, 'Conversion basis must be less than 50 characters').nullable().optional(),

  // Option-Specific Fields
  option_type: z.string().nullable().optional(),

  // Vesting & Exercise Terms
  vesting_start: z.string().nullable().optional(),
  vesting_months: z.number().nullable().optional(),
  cliff_months: z.number().nullable().optional(),
  vesting_schedule_type: z.string().nullable().optional(),
  exercise_window_days: z.number().nullable().optional(),
  strike_price: z.number().nullable().optional(),
  expiration_date: z.string().nullable().optional(),
  termination_date: z.string().nullable().optional(),

  // Option Pool Management
  pool_name: z.string().nullable().optional(),
  pool_size: z.number().nullable().optional(),
  pool_available: z.number().nullable().optional(),
  is_active: z.boolean().nullable().optional(),

  // Warrant-Specific Fields
  warrant_type: z.string().nullable().optional(),
  is_detachable: z.boolean().nullable().optional(),
  deal_context: z.string().nullable().optional(),
  is_transferable: z.boolean().nullable().optional(),

  // Shared Option/Warrant Fields
  total_shares: z.number().nullable().optional(),
  issue_rights: z.string().max(50, 'Issue rights must be less than 50 characters').nullable().optional(),
  convert_to: z.string().nullable().optional(),

  // Bond Fields
  principal: z.number().nullable().optional(),
  coupon_rate: z.number().nullable().optional(),
  coupon_frequency: z.string().nullable().optional(),
  principal_frequency: z.string().nullable().optional(),
  tenure_months: z.number().nullable().optional(),
  moratorium_period: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type SecurityType = z.infer<typeof SecurityTypeEnum>;
export type Currency = z.infer<typeof CurrencyEnum>;
export type AntiDilutionType = z.infer<typeof AntiDilutionTypeEnum>;
export type InterestRateType = z.infer<typeof InterestRateTypeEnum>;
export type Security = z.infer<typeof SecuritySchema>;
export type CreateSecurity = z.infer<typeof CreateSecuritySchema>;
export type UpdateSecurity = z.infer<typeof UpdateSecuritySchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single security
 * Backend equivalent: class SecurityResponse(BaseModel)
 */
export type SecurityResponse = {
  success: boolean;
  data?: Security;
  error?: string;
};

/**
 * Response containing multiple securities
 * Backend equivalent: class SecuritiesResponse(BaseModel)
 */
export type SecuritiesResponse = {
  success: boolean;
  data?: Security[];
  error?: string;
};

// ==========================================
// Type Guards
// ==========================================

/** Human-readable labels for security types */
export const SECURITY_TYPE_LABELS: Record<SecurityType, string> = {
  common: 'Common Shares',
  preferred: 'Preferred Shares',
  convertible: 'Convertible',
  warrant: 'Warrant',
  option: 'Option',
  bond: 'Bond',
  safe: 'SAFE',
};

/**
 * Get human-readable label for a security type
 * @param type Security type enum value
 * @returns Display label string
 */
export const getSecurityTypeLabel = (type: string): string => {
  return SECURITY_TYPE_LABELS[type as SecurityType] || type;
};

/**
 * Check if security is a stock type (common or preferred)
 */
export const isStockSecurity = (security: Security): boolean => {
  return security.security_type === 'common' || security.security_type === 'preferred';
};

/**
 * Check if security is a convertible type
 */
export const isConvertibleSecurity = (security: Security): boolean => {
  return security.security_type === 'convertible';
};

/**
 * Check if security is an option type
 */
export const isOptionSecurity = (security: Security): boolean => {
  return security.security_type === 'option';
};

/**
 * Check if security is a warrant type
 */
export const isWarrantSecurity = (security: Security): boolean => {
  return security.security_type === 'warrant';
};

/**
 * Check if security is a bond type
 */
export const isBondSecurity = (security: Security): boolean => {
  return security.security_type === 'bond';
};

/**
 * Check if security is a SAFE type
 */
export const isSafeSecurity = (security: Security): boolean => {
  return security.security_type === 'safe';
};
