/**
 * Deal Pipeline Schemas
 *
 * Zod validation schemas for DealPipeline model.
 * Field names and validation rules match backend exactly (snake_case).
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/holding_models.py
 * - Schema: /server/apps/assetmanager/schemas/holding_schemas/deal_pipeline_schemas.py
 * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/deal_pipeline_subrouter.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Pipeline priority options - matches backend PipelinePriority enum
 * Backend: class PipelinePriority(str, Enum)
 */
export const PipelinePriorityEnum = z.enum([
  'p1',
  'p2',
  'p3',
  'p4',
  'p5',
]);

/**
 * Pipeline status options - matches backend PipelineStatus enum
 * Backend: class PipelineStatus(str, Enum)
 */
export const PipelineStatusEnum = z.enum([
  'initial_screening',
  'due_diligence',
  'term_sheet',
  'negotiation',
  'closing',
  'closed',
  'passed',
  'rejected',
]);

// ==========================================
// DealPipeline Schema (Full Representation)
// ==========================================

/**
 * DealPipeline schema - full representation
 * Used for GET operations (single and list)
 *
 * Backend equivalent: class DealPipeline(BaseModel)
 */
export const DealPipelineSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  target_entity_id: z.number().nullable(),
  company_name: z.string().nullable(),
  deal_name: z.string(),
  priority: z.string(),
  status: z.string(),
  round_type: z.string(),
  sector: z.string(),

  // Financial Details
  target_raise: z.number().nullable(),
  pre_money_valuation: z.number().nullable(),
  post_money_valuation: z.number().nullable(),
  expected_ownership: z.number().nullable(),
  investment_amount: z.number().nullable(),
  is_lead_investor: z.boolean(),
  other_investors: z.string().nullable(),

  // Dates
  first_contact_date: z.string().nullable(),
  last_interaction_date: z.string().nullable(),
  next_meeting_date: z.string().nullable(),
  expected_close_date: z.string().nullable(),

  // Notes & Analysis
  investment_thesis: z.string().nullable(),
  key_risks: z.string().nullable(),
  due_diligence_notes: z.string().nullable(),
  next_steps: z.string().nullable(),
  rejection_reason: z.string().nullable(),
  notes: z.string().nullable(),

  // Assignment
  assigned_to_id: z.number().nullable(),

  created_at: z.string(), // ISO datetime string from backend
  updated_at: z.string().nullable(), // ISO datetime string from backend
});

// ==========================================
// Input Schemas
// ==========================================

/**
 * Schema for creating a new deal pipeline entry (POST)
 * Excludes: id, created_at, updated_at (auto-generated)
 *
 * Backend equivalent: class DealPipelineCreate(BaseModel)
 */
export const CreateDealPipelineSchema = z.object({
  entity_id: z.number(),
  deal_name: z.string(),
  priority: PipelinePriorityEnum,
  round_type: z.string(),
  sector: z.string(),
  status: PipelineStatusEnum.default('initial_screening'),
  is_lead_investor: z.boolean().optional(),
  target_entity_id: z.number().nullable().optional(),
  company_name: z.string().nullable().optional(),

  // Financial Details
  target_raise: z.number().nullable().optional(),
  pre_money_valuation: z.number().nullable().optional(),
  post_money_valuation: z.number().nullable().optional(),
  expected_ownership: z.number().nullable().optional(),
  investment_amount: z.number().nullable().optional(),
  other_investors: z.string().nullable().optional(),

  // Dates
  first_contact_date: z.string().nullable().optional(),
  last_interaction_date: z.string().nullable().optional(),
  next_meeting_date: z.string().nullable().optional(),
  expected_close_date: z.string().nullable().optional(),

  // Notes & Analysis
  investment_thesis: z.string().nullable().optional(),
  key_risks: z.string().nullable().optional(),
  due_diligence_notes: z.string().nullable().optional(),
  next_steps: z.string().nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),

  // Assignment
  assigned_to_id: z.number().nullable().optional(),
});

/**
 * Schema for updating a deal pipeline entry (PUT/PATCH)
 * All fields optional to support partial updates
 *
 * Backend equivalent: class DealPipelineUpdate(BaseModel)
 */
export const UpdateDealPipelineSchema = z.object({
  entity_id: z.number().nullable().optional(),
  target_entity_id: z.number().nullable().optional(),
  company_name: z.string().nullable().optional(),
  deal_name: z.string().nullable().optional(),
  priority: PipelinePriorityEnum.nullable().optional(),
  status: PipelineStatusEnum.nullable().optional(),
  round_type: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),

  // Financial Details
  target_raise: z.number().nullable().optional(),
  pre_money_valuation: z.number().nullable().optional(),
  post_money_valuation: z.number().nullable().optional(),
  expected_ownership: z.number().nullable().optional(),
  investment_amount: z.number().nullable().optional(),
  is_lead_investor: z.boolean().nullable().optional(),
  other_investors: z.string().nullable().optional(),

  // Dates
  first_contact_date: z.string().nullable().optional(),
  last_interaction_date: z.string().nullable().optional(),
  next_meeting_date: z.string().nullable().optional(),
  expected_close_date: z.string().nullable().optional(),

  // Notes & Analysis
  investment_thesis: z.string().nullable().optional(),
  key_risks: z.string().nullable().optional(),
  due_diligence_notes: z.string().nullable().optional(),
  next_steps: z.string().nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),

  // Assignment
  assigned_to_id: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================

export type PipelinePriority = z.infer<typeof PipelinePriorityEnum>;
export type PipelineStatus = z.infer<typeof PipelineStatusEnum>;
export type DealPipeline = z.infer<typeof DealPipelineSchema>;
export type CreateDealPipeline = z.infer<typeof CreateDealPipelineSchema>;
export type UpdateDealPipeline = z.infer<typeof UpdateDealPipelineSchema>;

// ==========================================
// Response Types
// ==========================================

/**
 * Response containing a single deal pipeline entry
 * Backend equivalent: class DealPipelineResponse(BaseModel)
 */
export type DealPipelineResponse = {
  success: boolean;
  data?: DealPipeline;
  error?: string;
};

/**
 * Response containing multiple deal pipeline entries
 * Backend equivalent: class DealPipelinesResponse(BaseModel)
 */
export type DealPipelinesResponse = {
  success: boolean;
  data?: DealPipeline[];
  error?: string;
};
