import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const securityTypeEnum = z.enum([
  'Common Shares',
  'Preferred Shares',
  'Convertible',
  'Warrant',
  'Option',
  'Bond',
]);
export type SecurityType = z.infer<typeof securityTypeEnum>;

export const currencyEnum = z.enum([
  'USD', 'EUR', 'GBP', 'RON', 'CHF', 'JPY', 
  'CNY', 'AUD', 'CAD', 'SGD', 'HKD'
]);
export type Currency = z.infer<typeof currencyEnum>;

export const antiDilutionTypeEnum = z.enum([
  'NONE',
  'FULL_RATCHET',
  'WEIGHTED_AVERAGE_BROAD',
  'WEIGHTED_AVERAGE_NARROW',
]);
export type AntiDilutionType = z.infer<typeof antiDilutionTypeEnum>;

export const interestRateTypeEnum = z.enum(['FIXED', 'VARIABLE']);
export type InterestRateType = z.infer<typeof interestRateTypeEnum>;

export const conversionBaseEnum = z.enum(['PRE_MONEY', 'POST_MONEY']);
export type ConversionBase = z.infer<typeof conversionBaseEnum>;

export const issueRightEnum = z.enum(['GROSS', 'NET']);
export type IssueRight = z.infer<typeof issueRightEnum>;

// ==========================================
// Option & Warrant Type Enums
// ==========================================
export const optionTypeEnum = z.enum([
  'Employee Stock Option',
  'Incentive Stock Option (ISO)',
  'Non-Qualified Stock Option (NQSO)',
  'Restricted Stock Unit',
  'Virtual Stock Option (VSOP)',
  'Stock Appreciation Right (SAR)',
  'Phantom Option',
  'Founder Option',
  'Advisor Option',
  'Call Option',
  'Put Option',
  'Conversion Option',
  'Performance-Based Option',
  'Other'
]);
export type OptionType = z.infer<typeof optionTypeEnum>;

export const warrantTypeEnum = z.enum([
  'Investor Warrant',
  'Series Warrant (A/B/C)',
  'Bridge Financing Warrant',
  'Private Placement Warrant',
  'Debt Warrant',
  'Loan Warrant',
  'Convertible Bond Warrant',
  'Strategic Partnership Warrant',
  'Vendor/Supplier Warrant',
  'Milestone Warrant',
  'Detachable Warrant',
  'Cashless Exercise Warrant',
  'Other'
]);
export type WarrantType = z.infer<typeof warrantTypeEnum>;

// ==========================================
// Schema Definitions
// ==========================================
export const SecuritySchema = z.object({
  // Base Security Fields
  id: z.number(),
  securityName: z.string(),
  code: z.string(),
  roundId: z.number(),
  securityType: securityTypeEnum,
  currency: currencyEnum.optional(),
  issuePrice: z.number().optional(),
  specialTerms: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // Stock Fields (Common & Preferred Shares)
  isPreferred: z.boolean().optional(),
  
  // Voting Rights (Both Common & Preferred)
  hasVotingRights: z.boolean().optional(),
  votingRatio: z.number().optional(),
  
  // Dividend Rights (Primarily Preferred)
  hasDividendRights: z.boolean().optional(),
  dividendRate: z.number().optional(),
  isDividendCumulative: z.boolean().optional(),
  
  // Liquidation & Participation (Preferred Only)
  liquidationPreference: z.number().optional(),
  hasParticipation: z.boolean().optional(),
  participationCap: z.number().optional(),
  seniority: z.number().optional(),
  antiDilution: antiDilutionTypeEnum.optional(),
  
  // Conversion Rights (Preferred Only)
  hasConversionRights: z.boolean().optional(),
  conversionRatio: z.number().optional(),
  
  // Redemption Rights (Preferred Only)
  hasRedemptionRights: z.boolean().optional(),
  redemptionTerm: z.number().optional(),

  // Lockup Period (All Security Types)
  lockupMonths: z.number().int().positive().nullable().optional(),

  // Convertible Fields
  interestRate: z.number().optional(),
  interestRateType: interestRateTypeEnum.optional(),
  interestPeriod: z.string().optional(),
  maturityDate: z.date().optional(),
  valuationCap: z.number().optional(),
  conversionDiscount: z.number().optional(),
  conversionBasis: conversionBaseEnum.optional(),
  
  // Option Fields
  optionType: optionTypeEnum.optional(),
  vestingStart: z.date().optional(),
  vestingMonths: z.number().optional(),
  cliffMonths: z.number().optional(),
  vestingScheduleType: z.string().optional(),
  exerciseWindowDays: z.number().optional(),
  strikePrice: z.number().optional(),
  expirationDate: z.date().optional(),
  terminationDate: z.date().optional(),
  poolName: z.string().optional(),
  poolSize: z.number().optional(),
  poolAvailable: z.number().optional(),
  isActive: z.boolean().optional(),
  
  // Warrant Fields
  warrantType: warrantTypeEnum.optional(),
  isDetachable: z.boolean().optional(),
  dealContext: z.string().optional(),
  isTransferable: z.boolean().optional(),
  
  // Shared Option/Warrant Fields
  totalShares: z.number().optional(),
  issueRights: issueRightEnum.optional(),
  convertTo: z.string().optional(),
  
  // Bond Fields
  principal: z.number().optional(),
  couponRate: z.number().optional(),
  couponFrequency: z.string().optional(),
  principalFrequency: z.string().optional(),
  tenureMonths: z.number().optional(),
  moratoriumPeriod: z.number().optional(),
});

export const CreateSecuritySchema = z.object({
  securityName: z.string(),
  code: z.string(),
  roundId: z.number(),
  securityType: securityTypeEnum,
  currency: currencyEnum.optional(),
  issuePrice: z.number().optional(),
  specialTerms: z.string().optional(),
  
  // Stock Fields (Common & Preferred Shares)
  isPreferred: z.boolean().optional(),
  
  // Voting Rights (Both Common & Preferred)
  hasVotingRights: z.boolean().optional(),
  votingRatio: z.number().optional(),
  
  // Dividend Rights (Primarily Preferred)
  hasDividendRights: z.boolean().optional(),
  dividendRate: z.number().optional(),
  isDividendCumulative: z.boolean().optional(),
  
  // Liquidation & Participation (Preferred Only)
  liquidationPreference: z.number().optional(),
  hasParticipation: z.boolean().optional(),
  participationCap: z.number().optional(),
  seniority: z.number().optional(),
  antiDilution: antiDilutionTypeEnum.optional(),
  
  // Conversion Rights (Preferred Only)
  hasConversionRights: z.boolean().optional(),
  conversionRatio: z.number().optional(),
  
  // Redemption Rights (Preferred Only)
  hasRedemptionRights: z.boolean().optional(),
  redemptionTerm: z.number().optional(),

  // Lockup Period (All Security Types)
  lockupMonths: z.number().int().positive().nullable().optional(),

  // Convertible fields
  interestRate: z.number().optional(),
  interestRateType: interestRateTypeEnum.optional(),
  interestPeriod: z.string().optional(),
  maturityDate: z.string().or(z.date()).optional(),
  valuationCap: z.number().optional(),
  conversionDiscount: z.number().optional(),
  conversionBasis: conversionBaseEnum.optional(),
  
  // Option fields
  optionType: optionTypeEnum.optional(),
  vestingStart: z.string().or(z.date()).optional(),
  vestingMonths: z.number().optional(),
  cliffMonths: z.number().optional(),
  vestingScheduleType: z.string().optional(),
  exerciseWindowDays: z.number().optional(),
  strikePrice: z.number().optional(),
  expirationDate: z.string().or(z.date()).optional(),
  terminationDate: z.string().or(z.date()).optional(),
  poolName: z.string().optional(),
  poolSize: z.number().optional(),
  poolAvailable: z.number().optional(),
  isActive: z.boolean().optional(),
  
  // Warrant fields
  warrantType: warrantTypeEnum.optional(),
  isDetachable: z.boolean().optional(),
  dealContext: z.string().optional(),
  isTransferable: z.boolean().optional(),
  
  // Shared Option/Warrant fields
  totalShares: z.number().optional(),
  issueRights: issueRightEnum.optional(),
  convertTo: z.string().optional(),
  
  // Bond fields
  principal: z.number().optional(),
  couponRate: z.number().optional(),
  couponFrequency: z.string().optional(),
  principalFrequency: z.string().optional(),
  tenureMonths: z.number().optional(),
  moratoriumPeriod: z.number().optional(),
});

export const UpdateSecuritySchema = z.object({
  securityName: z.string().optional(),
  code: z.string().optional(),
  roundId: z.number().optional(),
  securityType: securityTypeEnum.optional(),
  currency: currencyEnum.optional(),
  issuePrice: z.number().nullable().optional(),
  specialTerms: z.string().nullable().optional(),
  
  // Stock fields
  isPreferred: z.boolean().nullable().optional(),
  liquidationPreference: z.number().nullable().optional(),
  hasParticipation: z.boolean().nullable().optional(),
  participationCap: z.number().nullable().optional(),
  seniority: z.number().nullable().optional(),
  antiDilution: antiDilutionTypeEnum.nullable().optional(),
  hasDividendRights: z.boolean().nullable().optional(),
  dividendRate: z.number().nullable().optional(),
  isDividendCumulative: z.boolean().nullable().optional(),
  hasConversionRights: z.boolean().nullable().optional(),
  conversionRatio: z.number().nullable().optional(),
  hasRedemptionRights: z.boolean().nullable().optional(),
  redemptionTerm: z.number().nullable().optional(),
  hasVotingRights: z.boolean().nullable().optional(),
  votingRatio: z.number().nullable().optional(),

  // Lockup Period (All Security Types)
  lockupMonths: z.number().int().positive().nullable().optional(),

  // Convertible fields
  interestRate: z.number().nullable().optional(),
  interestRateType: interestRateTypeEnum.nullable().optional(),
  interestPeriod: z.string().nullable().optional(),
  maturityDate: z.string().or(z.date()).nullable().optional(),
  valuationCap: z.number().nullable().optional(),
  conversionDiscount: z.number().nullable().optional(),
  conversionBasis: conversionBaseEnum.nullable().optional(),

  // Option fields
  optionType: optionTypeEnum.nullable().optional(),
  vestingStart: z.string().or(z.date()).nullable().optional(),
  vestingMonths: z.number().nullable().optional(),
  cliffMonths: z.number().nullable().optional(),
  vestingScheduleType: z.string().nullable().optional(),
  exerciseWindowDays: z.number().nullable().optional(),
  strikePrice: z.number().nullable().optional(),
  expirationDate: z.string().or(z.date()).nullable().optional(),
  terminationDate: z.string().or(z.date()).nullable().optional(),
  poolName: z.string().nullable().optional(),
  poolSize: z.number().nullable().optional(),
  poolAvailable: z.number().nullable().optional(),
  isActive: z.boolean().nullable().optional(),

  // Warrant fields
  warrantType: warrantTypeEnum.nullable().optional(),
  isDetachable: z.boolean().nullable().optional(),
  dealContext: z.string().nullable().optional(),
  isTransferable: z.boolean().nullable().optional(),

  // Shared Option/Warrant fields
  totalShares: z.number().nullable().optional(),
  issueRights: issueRightEnum.nullable().optional(),
  convertTo: z.string().nullable().optional(),

  // Bond fields
  principal: z.number().nullable().optional(),
  couponRate: z.number().nullable().optional(),
  couponFrequency: z.string().nullable().optional(),
  principalFrequency: z.string().nullable().optional(),
  tenureMonths: z.number().nullable().optional(),
  moratoriumPeriod: z.number().nullable().optional(),
});

// ==========================================
// Type Exports
// ==========================================
export type Security = z.infer<typeof SecuritySchema>;
export type CreateSecurityInput = z.infer<typeof CreateSecuritySchema>;
export type UpdateSecurityInput = z.infer<typeof UpdateSecuritySchema>;

// ==========================================
// Response Types
// ==========================================
export interface SecurityResponse {
  success: boolean;
  data?: Security;
  error?: string;
}

export interface SecuritiesResponse {
  success: boolean;
  data?: Security[];
  error?: string;
}

// ==========================================
// Stakeholder Lockup Types
// ==========================================
export interface StakeholderLockup {
  transactionId: number;
  transactionDate: Date;
  securityId: number;
  securityCode: string;
  securityName: string;
  amount: number;
  unitsCredit: number;
  lockupMonths: number | null;
}

export interface StakeholderLockupsResponse {
  success: boolean;
  data?: StakeholderLockup[];
  error?: string;
}

// ==========================================
// Helper functions
// ==========================================
export function createStockSecurity(security: Security): Security {
  return {
    ...security,
    securityType: security.securityType === 'Preferred Shares' 
      ? 'Preferred Shares' 
      : 'Common Shares'
  };
}

export function createConvertibleSecurity(security: Security): Security {
  return {
    ...security,
    securityType: 'Convertible'
  };
}

export function createOptionSecurity(security: Security): Security {
  return {
    ...security,
    securityType: 'Option'
  };
}

export function createWarrantSecurity(security: Security): Security {
  return {
    ...security,
    securityType: 'Warrant'
  };
}

export function createBondSecurity(security: Security): Security {
  return {
    ...security,
    securityType: 'Bond'
  };
}

// Type guards to check security types
export function isStockSecurity(security: Security): boolean {
  return security.securityType === 'Common Shares' || 
         security.securityType === 'Preferred Shares';
}

export function isConvertibleSecurity(security: Security): boolean {
  return security.securityType === 'Convertible';
}

export function isOptionSecurity(security: Security): boolean {
  return security.securityType === 'Option';
}

export function isWarrantSecurity(security: Security): boolean {
  return security.securityType === 'Warrant';
}

export function isBondSecurity(security: Security): boolean {
  return security.securityType === 'Bond';
}
