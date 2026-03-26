import { z } from 'zod';
import {
  RoundSchema,
  Round,
  CreateRoundSchema,
  UpdateRoundSchema,
  RoundResponse,
  RoundsResponse,
  RoundWithSecurities,
  roundTypeEnum,
  RoundType
} from './rounds.schemas';

// ==========================================
// Enums & Types
// ==========================================
export const fundStatusEnum = z.enum(['Active', 'Fundraising', 'Closed', 'Liquidating']);
export type FundStatus = z.infer<typeof fundStatusEnum>;

// Re-export round type enum for convenience
export { roundTypeEnum, type RoundType };

// ==========================================
// Entity Schemas
// ==========================================
export const FundSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Fund name is required'),
  description: z.string().optional().nullable(),
  targetSize: z.number().optional().nullable(),
  vintage: z.number().optional().nullable(),
  status: fundStatusEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ==========================================
// Input Schemas
// ==========================================
export const CreateFundSchema = z.object({
  name: z.string().min(1, 'Fund name is required'),
  description: z.string().optional().nullable(),
  targetSize: z.number().optional().nullable(),
  vintage: z.number().optional().nullable(),
  status: fundStatusEnum.default('Active'),
});

export const UpdateFundSchema = z.object({
  name: z.string().min(1, 'Fund name is required').optional(),
  description: z.string().optional().nullable(),
  targetSize: z.number().optional().nullable(),
  vintage: z.number().optional().nullable(),
  status: fundStatusEnum.optional(),
});

// ==========================================
// Type Exports
// ==========================================
export type Fund = z.infer<typeof FundSchema>;
export type CreateFundInput = z.infer<typeof CreateFundSchema>;
export type UpdateFundInput = z.infer<typeof UpdateFundSchema>;

// ==========================================
// Response Types
// ==========================================
export type FundResponse = {
  success: boolean;
  data?: Fund;
  error?: string;
};

export type FundsResponse = {
  success: boolean;
  data?: Fund[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================
export interface FundWithRounds extends Fund {
  rounds?: Round[];
}

export interface FundWithStakeholders extends Fund {
  stakeholders?: {
    id: number;
    stakeholderName: string;
    type: string;
  }[];
}

// ==========================================
// Helper functions
// ==========================================
export function isActiveFund(fund: Fund): boolean {
  return fund.status === 'Active';
}

export function isClosedFund(fund: Fund): boolean {
  return fund.status === 'Closed';
}

export function isFundraisingFund(fund: Fund): boolean {
  return fund.status === 'Fundraising';
}

export function isLiquidatingFund(fund: Fund): boolean {
  return fund.status === 'Liquidating';
}

export function calculateFundProgress(fund: Fund, rounds: Round[]): number {
  if (!fund.targetSize || fund.targetSize <= 0) return 0;
  
  const totalRaised = rounds.reduce((sum, round) => sum + round.raisedAmount, 0);
  return Math.min(100, (totalRaised / fund.targetSize) * 100);
}

export function getRoundsByFund(rounds: Round[], fundId: number): Round[] {
  return rounds.filter(round => round.fundId === fundId);
}
