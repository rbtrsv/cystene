import { z } from 'zod';

// ==========================================
// Portfolio Performance Schemas
// ==========================================

export const PortfolioPerformanceSchema = z.object({
  id: z.number(),
  fundId: z.number(),
  roundId: z.number().nullable(),
  reportDate: z.string(), // ISO date string

  // Core Financial Metrics (all nullable)
  totalInvestedAmount: z.number().nullable(),
  fairValue: z.number().nullable(),
  cashRealized: z.number().nullable(),

  // NAV Fields
  nav: z.number().nullable(),
  totalFundUnits: z.number().nullable(),
  navPerShare: z.number().nullable(),

  // Performance Ratios
  tvpi: z.number().nullable(),
  dpi: z.number().nullable(),
  rvpi: z.number().nullable(),
  irr: z.number().nullable(),

  // Metadata
  notes: z.string().nullable(),

  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const CreatePortfolioPerformanceSchema = z.object({
  fundId: z.number({ required_error: 'Fund is required' }),
  roundId: z.number().nullable().optional(),
  reportDate: z.string({ required_error: 'Report date is required' }),

  // Core Financial Metrics (all optional)
  totalInvestedAmount: z.number().nullable().optional(),
  fairValue: z.number().nullable().optional(),
  cashRealized: z.number().nullable().optional(),

  // NAV Fields (all optional)
  nav: z.number().nullable().optional(),
  totalFundUnits: z.number().nullable().optional(),
  navPerShare: z.number().nullable().optional(),

  // Performance Ratios (all optional)
  tvpi: z.number().nullable().optional(),
  dpi: z.number().nullable().optional(),
  rvpi: z.number().nullable().optional(),
  irr: z.number().nullable().optional(),

  // Metadata
  notes: z.string().optional(),
});

export const UpdatePortfolioPerformanceSchema = CreatePortfolioPerformanceSchema.partial();

// ==========================================
// Type Exports
// ==========================================

export type PortfolioPerformance = z.infer<typeof PortfolioPerformanceSchema>;
export type CreatePortfolioPerformanceInput = z.infer<typeof CreatePortfolioPerformanceSchema>;
export type UpdatePortfolioPerformanceInput = z.infer<typeof UpdatePortfolioPerformanceSchema>;

// Provider-expected type aliases
export type CreatePortfolioPerformanceData = CreatePortfolioPerformanceInput;
export type UpdatePortfolioPerformanceData = UpdatePortfolioPerformanceInput;

// ==========================================
// Response Types
// ==========================================

export type PortfolioPerformanceResponse = {
  success: boolean;
  data?: PortfolioPerformance;
  error?: string;
};

export type PortfolioPerformancesResponse = {
  success: boolean;
  data?: PortfolioPerformance[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================

export interface PortfolioPerformanceWithRelations extends PortfolioPerformance {
  fund?: {
    id: number;
    name: string;
  };
  round?: {
    id: number;
    roundName: string;
    roundType: string;
  };
}