import { z } from 'zod';

// Zod schema for cap table entry (matches database)
export const capTableEntrySchema = z.object({
  id: z.number().optional(),
  stakeholderId: z.number(),
  securityId: z.number(),
  fundId: z.number(),
  roundId: z.number(),
  totalEquityUnits: z.string(), // Stored as string for precision
  ownershipPercentage: z.string(), // Stored as string for precision
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Zod schema for cap table aggregated view (for UI)
export const capTableRowSchema = z.object({
  stakeholderId: z.number(),
  stakeholderName: z.string(),
  stakeholderType: z.string(),
  
  // Security breakdown
  commonShares: z.number().default(0),
  preferredShares: z.number().default(0),
  options: z.number().default(0),
  warrants: z.number().default(0),
  convertibles: z.number().default(0),
  
  // Calculated values
  totalEquityShares: z.number(),
  totalFullyDilutedShares: z.number(),
  equityOwnershipPercentage: z.number(),
  fullyDilutedOwnershipPercentage: z.number(),
  
  // Financial data
  totalInvestment: z.number().default(0),
  averagePricePerShare: z.number().default(0),
  currency: z.string().default('USD'),
});

// Zod schema for cap table summary
export const capTableSummarySchema = z.object({
  fundId: z.number(),
  fundName: z.string(),
  asOfRoundId: z.number().optional(),
  asOfRoundName: z.string().optional(),
  totalStakeholders: z.number(),
  totalEquityShares: z.number(),
  totalFullyDilutedShares: z.number(),
  totalValuation: z.number(),
  lastUpdated: z.date(),
});

// Zod schema for cap table filters
export const capTableFiltersSchema = z.object({
  fundId: z.number().optional(),
  asOfRoundId: z.number().optional(),
  stakeholderTypes: z.array(z.string()).optional(),
  securityTypes: z.array(z.string()).optional(),
  minOwnership: z.number().optional(),
  maxOwnership: z.number().optional(),
});

// TypeScript types derived from schemas
export type CapTableEntry = z.infer<typeof capTableEntrySchema>;
export type CapTableRow = z.infer<typeof capTableRowSchema>;
export type CapTableSummary = z.infer<typeof capTableSummarySchema>;
export type CapTableFilters = z.infer<typeof capTableFiltersSchema>;

// Export format options
export const exportFormatSchema = z.enum(['csv', 'excel', 'pdf']);
export type ExportFormat = z.infer<typeof exportFormatSchema>;
