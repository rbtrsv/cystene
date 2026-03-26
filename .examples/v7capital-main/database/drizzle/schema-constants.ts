/**
 * Schema Constants
 * 
 * This file contains all the constants used in the schema as enums.
 * Using string constants instead of PostgreSQL enums provides better flexibility and type safety.
 * 
 * NOTE: This file is for REFERENCE ONLY. Do not import these constants directly in components.
 * Instead, define the enum values directly in your schema files using z.enum() with human-readable values.
 * Components should import and use the enum types from their respective schema files.
 */

// Time period choices
export const QUARTER_CHOICES = {
  Q1: 'Q1',
  Q2: 'Q2',
  Q3: 'Q3',
  Q4: 'Q4',
} as const;

export type QuarterChoice = (typeof QUARTER_CHOICES)[keyof typeof QUARTER_CHOICES];

export const SEMESTER_CHOICES = {
  H1: 'H1',
  H2: 'H2',
} as const;

export type SemesterChoice = (typeof SEMESTER_CHOICES)[keyof typeof SEMESTER_CHOICES];

export const MONTH_CHOICES = {
  JANUARY: 'January',
  FEBRUARY: 'February',
  MARCH: 'March',
  APRIL: 'April',
  MAY: 'May',
  JUNE: 'June',
  JULY: 'July',
  AUGUST: 'August',
  SEPTEMBER: 'September',
  OCTOBER: 'October',
  NOVEMBER: 'November',
  DECEMBER: 'December',
} as const;

export type MonthChoice = (typeof MONTH_CHOICES)[keyof typeof MONTH_CHOICES];

// Financial scenarios
export const FINANCIAL_SCENARIOS = {
  ACTUAL: 'Actual',
  FORECAST: 'Forecast',
  BUDGET: 'Budget',
} as const;

export type FinancialScenario = (typeof FINANCIAL_SCENARIOS)[keyof typeof FINANCIAL_SCENARIOS];

// Cash flow scenarios (subset of financial scenarios - no budget for cash flows)
export const CASH_FLOW_SCENARIOS = {
  ACTUAL: 'Actual',
  FORECAST: 'Forecast',
} as const;

export type CashFlowScenario = (typeof CASH_FLOW_SCENARIOS)[keyof typeof CASH_FLOW_SCENARIOS];

// Security types
export const SECURITY_TYPES = {
  COMMON_SHARES: 'Common Shares',
  PREFERRED_SHARES: 'Preferred Shares',
  CONVERTIBLE: 'Convertible',
  WARRANT: 'Warrant',
  OPTION: 'Option',
  BOND: 'Bond',
} as const;

export type SecurityType = (typeof SECURITY_TYPES)[keyof typeof SECURITY_TYPES];

// Stakeholder types
export const STAKEHOLDER_TYPES = {
  FUND: 'Fund',
  INVESTOR: 'Investor',
  EMPLOYEE: 'Employee',
} as const;

export type StakeholderType = (typeof STAKEHOLDER_TYPES)[keyof typeof STAKEHOLDER_TYPES];

// Transaction types
export const TRANSACTION_TYPES = {
  // Entity Perspective: Primary transaction types
  ISSUANCE: 'ISSUANCE',           // Fund receives cash (amountDebit), issues units to stakeholder (unitsCredit)
  DISTRIBUTION: 'DISTRIBUTION',   // Fund pays cash to stakeholder (amountCredit)
  REDEMPTION: 'REDEMPTION',       // Fund buys back units (unitsDebit), pays cash (amountCredit)

  // Transfer transactions (stakeholder-to-stakeholder)
  TRANSFER_IN: 'TRANSFER_IN',     // Stakeholder receives units (unitsCredit)
  TRANSFER_OUT: 'TRANSFER_OUT',   // Stakeholder loses units (unitsDebit)

  // Legacy/Other cash transactions
  CASH_IN: 'CASH_IN',
  CASH_OUT: 'CASH_OUT',
  COUPON_IN: 'COUPON_IN',
  COUPON_OUT: 'COUPON_OUT',

  // Share related transactions
  CONVERSION_IN: 'CONVERSION_IN',
  CONVERSION_OUT: 'CONVERSION_OUT',
  SPLIT: 'SPLIT',
  CONSOLIDATION: 'CONSOLIDATION',

  // Option related transactions
  GRANT: 'GRANT',
  VEST: 'VEST',
  EXERCISE: 'EXERCISE',
  EXPIRE: 'EXPIRE',
  FORFEIT: 'FORFEIT',
  CANCEL: 'CANCEL',

  // Adjustment
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

// Fee and cost types
export const FEE_COST_TYPES = {
  MANAGEMENT: 'MANAGEMENT',
  PERFORMANCE: 'PERFORMANCE',
  SETUP: 'SETUP',
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  LEGAL: 'LEGAL',
  AUDIT: 'AUDIT',
  CUSTODIAN: 'CUSTODIAN',
  OTHER: 'OTHER',
} as const;

export type FeeCostType = (typeof FEE_COST_TYPES)[keyof typeof FEE_COST_TYPES];

// Frequencies
export const FREQUENCIES = {
  ONE_TIME: 'ONE_TIME',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUAL: 'ANNUAL',
} as const;

export type Frequency = (typeof FREQUENCIES)[keyof typeof FREQUENCIES];

// Deal priorities
export const DEAL_PRIORITIES = {
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
  P5: 'P5',
} as const;

export type DealPriority = (typeof DEAL_PRIORITIES)[keyof typeof DEAL_PRIORITIES];

// Deal statuses
export const DEAL_STATUSES = {
  INITIAL_SCREENING: 'Initial Screening',
  FIRST_MEETING: 'First Meeting',
  FOLLOW_UP: 'Follow Up',
  DUE_DILIGENCE: 'Due Diligence',
  NEGOTIATION: 'Negotiation',
  TERM_SHEET: 'Term Sheet',
  LEGAL_REVIEW: 'Legal Review',
  CLOSING: 'Closing',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
  ON_HOLD: 'On Hold',
} as const;

export type DealStatus = (typeof DEAL_STATUSES)[keyof typeof DEAL_STATUSES];

// Round types
export const ROUND_TYPES = {
  SEED: 'Seed',
  PRE_SERIES_A: 'Pre Series A',
  SERIES_A: 'Series A',
  SERIES_B: 'Series B',
  SERIES_C: 'Series C',
  DEBT: 'Debt',
  CONVERTIBLE: 'Convertible',
  SAFE: 'SAFE',
  BRIDGE: 'Bridge',
  SECONDARY: 'Secondary',
  OTHER: 'Other',
} as const;

export type RoundType = (typeof ROUND_TYPES)[keyof typeof ROUND_TYPES];

// Sector types
export const SECTOR_TYPES = {
  FINTECH: 'Fintech',
  HEALTHTECH: 'Healthtech',
  ECOMMERCE: 'Ecommerce',
  SAAS: 'SaaS',
  AI_ML: 'AI/ML',
  BLOCKCHAIN: 'Blockchain',
  CLEANTECH: 'Cleantech',
  EDTECH: 'Edtech',
  ENTERPRISE: 'Enterprise',
  CONSUMER: 'Consumer',
  OTHER: 'Other',
} as const;

export type SectorType = (typeof SECTOR_TYPES)[keyof typeof SECTOR_TYPES];

// Portfolio statuses
export const PORTFOLIO_STATUSES = {
  ACTIVE: 'Active',
  EXITED: 'Exited',
  WRITTEN_OFF: 'Written Off',
  ON_HOLD: 'On Hold',
} as const;

export type PortfolioStatus = (typeof PORTFOLIO_STATUSES)[keyof typeof PORTFOLIO_STATUSES];

// Investment types
export const INVESTMENT_TYPES = {
  EQUITY: 'Equity',
  DEBT: 'Debt',
  CONVERTIBLE: 'Convertible',
  WARRANT: 'Warrant',
  OPTION: 'Option',
} as const;

export type InvestmentType = (typeof INVESTMENT_TYPES)[keyof typeof INVESTMENT_TYPES];

// Cash flow types
export const CASH_FLOW_TYPES = {
  INVESTMENT: 'Investment',
  FOLLOW_ON: 'Follow-on',
  DIVIDEND: 'Dividend',
  INTEREST: 'Interest',
  SALE_PROCEEDS: 'Sale Proceeds',
  EXIT_PROCEEDS: 'Exit Proceeds',
  DISTRIBUTION: 'Distribution',
  MANAGEMENT_FEE: 'Management Fee',
  PERFORMANCE_FEE: 'Performance Fee',
} as const;

export type CashFlowType = (typeof CASH_FLOW_TYPES)[keyof typeof CASH_FLOW_TYPES];

// KPI data types
export const KPI_DATA_TYPES = {
  DECIMAL: 'DECIMAL',
  INTEGER: 'INTEGER',
  STRING: 'STRING',
} as const;

export type KpiDataType = (typeof KPI_DATA_TYPES)[keyof typeof KPI_DATA_TYPES];

// Anti-dilution types
export const ANTI_DILUTION_TYPES = {
  NONE: 'NONE',
  FULL_RATCHET: 'FULL_RATCHET',
  WEIGHTED_AVERAGE_BROAD: 'WEIGHTED_AVERAGE_BROAD',
  WEIGHTED_AVERAGE_NARROW: 'WEIGHTED_AVERAGE_NARROW',
} as const;

export type AntiDilutionType = (typeof ANTI_DILUTION_TYPES)[keyof typeof ANTI_DILUTION_TYPES];

// Conversion bases
export const CONVERSION_BASES = {
  PRE_MONEY: 'PRE_MONEY',
  POST_MONEY: 'POST_MONEY',
} as const;

export type ConversionBase = (typeof CONVERSION_BASES)[keyof typeof CONVERSION_BASES];

// Interest rate types
export const INTEREST_RATE_TYPES = {
  FIXED: 'FIXED',
  VARIABLE: 'VARIABLE',
} as const;

export type InterestRateType = (typeof INTEREST_RATE_TYPES)[keyof typeof INTEREST_RATE_TYPES];

// Issue rights
export const ISSUE_RIGHTS = {
  GROSS: 'GROSS',
  NET: 'NET',
} as const;

export type IssueRight = (typeof ISSUE_RIGHTS)[keyof typeof ISSUE_RIGHTS];

// Currencies 
export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  RON: 'RON',
  CHF: 'CHF',
  JPY: 'JPY',
  CNY: 'CNY',
  AUD: 'AUD',
  CAD: 'CAD',
  SGD: 'SGD',
  HKD: 'HKD',
} as const;

export type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES];

// User roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Fund statuses
export const FUND_STATUSES = {
  ACTIVE: 'Active',
  FUNDRAISING: 'Fundraising',
  CLOSED: 'Closed',
  LIQUIDATING: 'Liquidating',
} as const;

export type FundStatus = (typeof FUND_STATUSES)[keyof typeof FUND_STATUSES];