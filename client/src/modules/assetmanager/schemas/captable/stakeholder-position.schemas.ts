/**
 * Stakeholder Position Schemas
 *
 * Zod validation schemas for computed stakeholder position endpoints (read-only).
 * Positions are computed ON THE FLY from Stakeholder + SecurityTransaction — no CRUD.
 *
 * This is the INVESTOR SIDE view (my positions on other cap tables),
 * as opposed to the cap-table page which is ISSUER SIDE (all stakeholders on my cap table).
 *
 * Backend sources:
 * - Schema: /server/apps/assetmanager/schemas/entity_schemas/stakeholder_position_schemas.py
 * - Service: /server/apps/assetmanager/services/stakeholder_position_service.py
 * - Router: /server/apps/assetmanager/subrouters/captable_subrouters/stakeholder_position_subrouter.py
 */

import { z } from 'zod';
import { SecurityTransactionSchema } from './security-transaction.schemas';

// ==========================================
// Stakeholder Position Summary Schema
// ==========================================

/**
 * Summary of a single position (one stakeholder record on one cap table).
 * Returned by both list and detail endpoints.
 *
 * List endpoint: transactions is null (not included).
 * Detail endpoint: transactions is populated with SecurityTransaction objects.
 *
 * Backend equivalent: class StakeholderPositionSummary(BaseModel)
 */
export const StakeholderPositionSummarySchema = z.object({
  // Stakeholder identity
  stakeholder_id: z.number(),
  stakeholder_type: z.string(),
  // Cap table entity (where the position sits)
  entity_id: z.number(),
  entity_name: z.string(),
  entity_type: z.string(),
  // Computed position metrics — entity perspective debit/credit convention
  total_units: z.number(),
  total_invested: z.number(),
  ownership_percentage: z.number(),
  // Detail view only — reuses existing SecurityTransaction schema directly
  transactions: z.array(SecurityTransactionSchema).nullable(),
});

// ==========================================
// Type Exports
// ==========================================

export type StakeholderPositionSummary = z.infer<typeof StakeholderPositionSummarySchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response for stakeholder positions list endpoint
 * Backend: GET /assetmanager/stakeholder-positions/?source_entity_id=X
 */
export type StakeholderPositionsResponse = {
  success: boolean;
  data?: StakeholderPositionSummary[];
  error?: string;
};

/**
 * Response for stakeholder position detail endpoint
 * Backend: GET /assetmanager/stakeholder-positions/{entity_id}?source_entity_id=X
 */
export type StakeholderPositionResponse = {
  success: boolean;
  data?: StakeholderPositionSummary;
  error?: string;
};

/**
 * Response for track-as-holding action (Feature 3)
 * Backend: POST /assetmanager/stakeholder-positions/{entity_id}/track-as-holding?source_entity_id=X
 */
export type TrackAsHoldingResponse = {
  success: boolean;
  holdings_created?: number;
  cash_flows_created?: number;
  message?: string;
  error?: string;
};

// ==========================================
// Label Helpers
// ==========================================

/**
 * Human-readable labels for entity types on position cards
 * Same values as entity.schemas.ts ENTITY_TYPE_LABELS but scoped to this module
 */
export const STAKEHOLDER_POSITION_ENTITY_TYPE_LABELS: Record<string, string> = {
  fund: 'Fund',
  company: 'Company',
  individual: 'Individual',
  syndicate: 'Syndicate',
};

/**
 * Get human-readable label for an entity type
 * @param type Entity type string
 * @returns Display label string
 */
export const getEntityTypeLabel = (type: string): string => {
  return STAKEHOLDER_POSITION_ENTITY_TYPE_LABELS[type] || type;
};
