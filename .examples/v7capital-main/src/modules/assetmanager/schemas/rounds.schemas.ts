import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const roundTypeEnum = z.enum([
  'Seed', 
  'Pre Series A', 
  'Series A', 
  'Series B', 
  'Series C', 
  'Debt', 
  'Convertible', 
  'SAFE', 
  'Bridge', 
  'Secondary', 
  'Other'
]);
export type RoundType = z.infer<typeof roundTypeEnum>;

// ==========================================
// Entity Schemas
// ==========================================
export const RoundSchema = z.object({
  id: z.number(),
  fundId: z.number(),
  roundName: z.string().min(1, 'Round name is required'),
  roundType: roundTypeEnum,
  roundDate: z.date(),
  targetAmount: z.number(),
  raisedAmount: z.number(),
  preMoneyValuation: z.number().nullable(),
  postMoneyValuation: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ==========================================
// Input Schemas
// ==========================================
export const CreateRoundSchema = z.object({
  fundId: z.number(),
  roundName: z.string().min(1, 'Round name is required'),
  roundType: roundTypeEnum,
  roundDate: z.string().or(z.date()),
  targetAmount: z.number(),
  raisedAmount: z.number(),
  preMoneyValuation: z.number().optional().nullable(),
  postMoneyValuation: z.number().optional().nullable(),
});

export const UpdateRoundSchema = z.object({
  roundName: z.string().min(1, 'Round name is required').optional(),
  roundType: roundTypeEnum.optional(),
  roundDate: z.string().or(z.date()).optional(),
  targetAmount: z.number().optional(),
  raisedAmount: z.number().optional(),
  preMoneyValuation: z.number().optional().nullable(),
  postMoneyValuation: z.number().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================
export type Round = z.infer<typeof RoundSchema>;
export type CreateRoundInput = z.infer<typeof CreateRoundSchema>;
export type UpdateRoundInput = z.infer<typeof UpdateRoundSchema>;

// ==========================================
// Response Types
// ==========================================
export type RoundResponse = {
  success: boolean;
  data?: Round;
  error?: string;
};

export type RoundsResponse = {
  success: boolean;
  data?: Round[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================
export interface RoundWithFund extends Round {
  fund?: {
    id: number;
    name: string;
    status: string;
  };
}

export interface RoundWithSecurities extends Round {
  securities?: {
    id: number;
    securityName: string;
    securityType: string;
    code: string;
  }[];
}

export interface RoundWithDetails extends Round {
  fund?: {
    id: number;
    name: string;
    status: string;
  };
  securities?: {
    id: number;
    securityName: string;
    securityType: string;
    code: string;
  }[];
}

// ==========================================
// Helper functions
// ==========================================
export function getRoundsByFundId(rounds: Round[], fundId: number): Round[] {
  return rounds.filter(round => round.fundId === fundId);
}

export function calculateTotalRaised(rounds: Round[]): number {
  return rounds.reduce((total, round) => total + round.raisedAmount, 0);
}

export function calculateFundingProgress(round: Round): number {
  if (!round.targetAmount || round.targetAmount <= 0) return 0;
  return Math.min(100, (round.raisedAmount / round.targetAmount) * 100);
}
