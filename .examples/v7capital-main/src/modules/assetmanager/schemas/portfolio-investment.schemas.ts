import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const portfolioStatusEnum = z.enum(['Active', 'Exited', 'Written Off', 'On Hold']);
export const investmentTypeEnum = z.enum(['Equity', 'Debt', 'Convertible', 'Warrant', 'Option', 'Cash']);
export const sectorTypeEnum = z.enum(['Fintech', 'Healthtech', 'Ecommerce', 'SaaS', 'AI/ML', 'Blockchain', 'Cleantech', 'Edtech', 'Enterprise', 'Consumer', 'Other']);
export const companyTypeEnum = z.enum(['Venture Capital', 'Private Equity', 'Public', 'Cash']);

export type PortfolioStatus = z.infer<typeof portfolioStatusEnum>;
export type InvestmentType = z.infer<typeof investmentTypeEnum>;
export type SectorType = z.infer<typeof sectorTypeEnum>;
export type CompanyType = z.infer<typeof companyTypeEnum>;

// ==========================================
// Entity Schemas
// ==========================================
export const InvestmentPortfolioSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  fundId: z.number(),
  roundId: z.number(),
  portfolioStatus: portfolioStatusEnum,
  investmentType: investmentTypeEnum,
  sector: sectorTypeEnum,
  investmentAmount: z.number().nullable(),
  ownershipPercentage: z.number().nullable(),
  currentFairValue: z.number().nullable(),
  companyType: companyTypeEnum,
  numberOfShares: z.number().nullable(),
  sharePrice: z.number().nullable(),
  moic: z.number().nullable(),
  irr: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  percentOfNav: z.number().nullable().optional(),
});

// ==========================================
// Input Schemas
// ==========================================
export const CreateInvestmentPortfolioSchema = z.object({
  companyId: z.number().min(1, 'Company is required'),
  fundId: z.number().min(1, 'Fund is required'),
  roundId: z.number().min(1, 'Round is required'),
  portfolioStatus: portfolioStatusEnum.default('Active'),
  investmentType: investmentTypeEnum,
  sector: sectorTypeEnum,
  investmentAmount: z.number().nonnegative('Investment amount cannot be negative').optional().nullable(),
  ownershipPercentage: z.number().min(0, 'Ownership percentage cannot be negative').max(100, 'Ownership percentage cannot exceed 100%').optional().nullable(),
  currentFairValue: z.number().nonnegative('Current fair value cannot be negative').optional().nullable(),
  companyType: companyTypeEnum.default('Venture Capital'),
  numberOfShares: z.number().nonnegative('Number of shares cannot be negative').optional().nullable(),
  sharePrice: z.number().nonnegative('Share price cannot be negative').optional().nullable(),
  irr: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateInvestmentPortfolioSchema = z.object({
  companyId: z.number().min(1, 'Company is required').optional(),
  fundId: z.number().min(1, 'Fund is required').optional(),
  roundId: z.number().min(1, 'Round is required').optional(),
  portfolioStatus: portfolioStatusEnum.optional(),
  investmentType: investmentTypeEnum.optional(),
  sector: sectorTypeEnum.optional(),
  investmentAmount: z.number().nonnegative('Investment amount cannot be negative').optional().nullable(),
  ownershipPercentage: z.number().min(0, 'Ownership percentage cannot be negative').max(100, 'Ownership percentage cannot exceed 100%').optional().nullable(),
  currentFairValue: z.number().nonnegative('Current fair value cannot be negative').optional().nullable(),
  companyType: companyTypeEnum.optional(),
  numberOfShares: z.number().nonnegative('Number of shares cannot be negative').optional().nullable(),
  sharePrice: z.number().nonnegative('Share price cannot be negative').optional().nullable(),
  irr: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ==========================================
// Type Exports
// ==========================================
export type InvestmentPortfolio = z.infer<typeof InvestmentPortfolioSchema>;
export type CreateInvestmentPortfolioInput = z.infer<typeof CreateInvestmentPortfolioSchema>;
export type UpdateInvestmentPortfolioInput = z.infer<typeof UpdateInvestmentPortfolioSchema>;

// ==========================================
// Response Types
// ==========================================
export type InvestmentPortfolioResponse = {
  success: boolean;
  data?: InvestmentPortfolio;
  error?: string;
};

export type InvestmentPortfoliosResponse = {
  success: boolean;
  data?: InvestmentPortfolio[];
  error?: string;
};

// ==========================================
// Extended Types (with relations)
// ==========================================
export interface InvestmentPortfolioWithRelations extends InvestmentPortfolio {
  company?: {
    id: number;
    name: string;
  };
  fund?: {
    id: number;
    name: string;
  };
  round?: {
    id: number;
    name: string;
  };
}
