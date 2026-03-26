/**
 * Performance Computed Schemas
 *
 * Zod validation schemas for computed performance endpoints (read-only).
 * These endpoints compute metrics ON THE FLY from raw data — no CRUD operations.
 *
 * Backend sources:
 * - Service: /server/apps/assetmanager/services/performance_service.py
 * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/performance_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Entity Performance Schema
// ==========================================

/**
 * Entity/Fund performance metrics — computed from holding_cash_flows + fees + holdings
 *
 * Backend equivalent: get_entity_performance() return dict
 */
export const EntityPerformanceSchema = z.object({
  entity_id: z.number(),

  // Cash flow totals
  total_invested: z.number(),
  total_returned: z.number(),
  fair_value: z.number(),

  // Fee totals
  total_fees: z.number(),
  fees_breakdown: z.record(z.string(), z.number()), // { fee_type: amount }

  // Performance metrics
  irr: z.number().nullable(),
  tvpi: z.number().nullable(),
  dpi: z.number().nullable(),
  rvpi: z.number().nullable(),
});

// ==========================================
// Holding Performance Schema (per-holding breakdown)
// ==========================================

/**
 * Per-holding performance metrics — computed from holding_cash_flows grouped by holding_id
 *
 * Backend equivalent: get_holdings_performance() return list item
 */
export const HoldingPerformanceComputedSchema = z.object({
  holding_id: z.number(),
  investment_name: z.string().nullable(),
  company_name: z.string().nullable(),
  sector: z.string().nullable(),
  investment_status: z.string().nullable(),

  // Cash flow totals
  total_invested: z.number(),
  total_returned: z.number(),
  fair_value: z.number(),

  // Performance metrics
  irr: z.number().nullable(),
  tvpi: z.number().nullable(),
  moic: z.number().nullable(),
});

// ==========================================
// Stakeholder Returns Schema
// ==========================================

/**
 * Per-stakeholder performance metrics — computed from security_transactions + holdings NAV
 *
 * Backend equivalent: get_stakeholder_returns() return list item
 */
export const StakeholderReturnSchema = z.object({
  stakeholder_id: z.number(),
  stakeholder_name: z.string().nullable(),
  stakeholder_type: z.string().nullable(),

  // Cash flow totals
  total_invested: z.number(),
  total_returned: z.number(),
  fair_value: z.number(),

  // Ownership
  ownership_percentage: z.number(),

  // Performance metrics
  irr: z.number().nullable(),
  tvpi: z.number().nullable(),
  dpi: z.number().nullable(),
  rvpi: z.number().nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type EntityPerformance = z.infer<typeof EntityPerformanceSchema>;
export type HoldingPerformanceComputed = z.infer<typeof HoldingPerformanceComputedSchema>;
export type StakeholderReturn = z.infer<typeof StakeholderReturnSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response for entity performance endpoint
 * Backend: GET /assetmanager/performance/entity/{entity_id}
 */
export type EntityPerformanceResponse = {
  success: boolean;
  data?: EntityPerformance;
  error?: string;
};

/**
 * Response for holdings performance endpoint
 * Backend: GET /assetmanager/performance/holdings/{entity_id}
 */
export type HoldingsPerformanceResponse = {
  success: boolean;
  data?: HoldingPerformanceComputed[];
  error?: string;
};

/**
 * Response for stakeholder returns endpoint
 * Backend: GET /assetmanager/performance/stakeholders/{entity_id}
 */
export type StakeholderReturnsResponse = {
  success: boolean;
  data?: StakeholderReturn[];
  error?: string;
};
