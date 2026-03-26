import { pgTable, smallserial, text, varchar, timestamp, numeric, date, boolean, integer, uniqueIndex, index, primaryKey } from 'drizzle-orm/pg-core';
import { 
  STAKEHOLDER_TYPES, 
  USER_ROLES, 
  FUND_STATUSES, 
  ROUND_TYPES, 
  SECURITY_TYPES, 
  CURRENCIES, 
  ANTI_DILUTION_TYPES, 
  INTEREST_RATE_TYPES, 
  CONVERSION_BASES, 
  ISSUE_RIGHTS, 
  TRANSACTION_TYPES, 
  FEE_COST_TYPES, 
  FREQUENCIES 
} from '../schema-constants';
import { userProfiles } from './accounts';
import { companies } from './companies';

export const stakeholders = pgTable('stakeholders', {
  id: smallserial('id').primaryKey(),
  stakeholderName: text('stakeholder_name').notNull(),
  type: varchar('type', { length: 50 }).notNull().default(STAKEHOLDER_TYPES.INVESTOR),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const stakeholderUsers = pgTable('stakeholder_users', {
  userProfileId: integer('user_profile_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  stakeholderId: integer('stakeholder_id').notNull().references(() => stakeholders.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default(USER_ROLES.VIEWER),
}, (table) => [
  primaryKey({ columns: [table.userProfileId, table.stakeholderId] }),
  index('idx_stakeholder_user_stakeholder').on(table.stakeholderId)
]);


export const funds = pgTable('funds', {
  id: smallserial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  targetSize: numeric('target_size', { precision: 15, scale: 2 }),
  vintage: integer('vintage'),
  status: varchar('status', { length: 50 }).default(FUND_STATUSES.ACTIVE),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const rounds = pgTable('rounds', {
  id: smallserial('id').primaryKey(),
  fundId: integer('fund_id').notNull().references(() => funds.id, { onDelete: 'restrict' }),
  roundName: text('round_name').notNull(),
  roundType: varchar('round_type', { length: 50 }).notNull(),
  roundDate: date('round_date').notNull(),
  targetAmount: numeric('target_amount', { precision: 15, scale: 2 }).notNull(),
  raisedAmount: numeric('raised_amount', { precision: 15, scale: 2 }).notNull(),
  preMoneyValuation: numeric('pre_money_valuation', { precision: 15, scale: 2 }),
  postMoneyValuation: numeric('post_money_valuation', { precision: 15, scale: 2 }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_rounds_fund').on(table.fundId)
]);


export const securities = pgTable('securities', {
  // ======== Primary Keys & References ========
  id: smallserial('id').primaryKey(),
  roundId: integer('round_id').notNull().references(() => rounds.id, { onDelete: 'restrict' }),

  // ======== Basic Security Information ========
  securityName: text('security_name').notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  securityType: varchar('security_type', { length: 50 }).notNull(),
  currency: varchar('currency', { length: 10 }).default(CURRENCIES.USD),
  issuePrice: numeric('issue_price', { precision: 15, scale: 2 }),
  specialTerms: text('special_terms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  
  // ======== Stock Fields (Common & Preferred Shares) ========
  isPreferred: boolean('is_preferred'),
  
  // Voting Rights (Both Common & Preferred)
  hasVotingRights: boolean('has_voting_rights'),
  votingRatio: numeric('voting_ratio', { precision: 5, scale: 2 }),
  
  // Dividend Rights (Primarily Preferred)
  hasDividendRights: boolean('has_dividend_rights'),
  dividendRate: numeric('dividend_rate', { precision: 5, scale: 2 }),
  isDividendCumulative: boolean('is_dividend_cumulative'),
  
  // Liquidation & Participation (Preferred Only)
  liquidationPreference: numeric('liquidation_preference', { precision: 5, scale: 2 }),
  hasParticipation: boolean('has_participation'),
  participationCap: numeric('participation_cap', { precision: 5, scale: 2 }),
  seniority: integer('seniority'),
  antiDilution: varchar('anti_dilution', { length: 50 }),
  
  // Conversion Rights (Preferred Only)
  hasConversionRights: boolean('has_conversion_rights'),
  conversionRatio: numeric('conversion_ratio', { precision: 10, scale: 4 }),
  
  // Redemption Rights (Preferred Only)
  hasRedemptionRights: boolean('has_redemption_rights'),
  redemptionTerm: integer('redemption_term'), // in months

  // ======== Lockup Period (All Security Types) ========
  lockupMonths: integer('lockup_months'), // Duration in months from transaction date, null = no lockup

  // ======== Convertible Security Fields ========
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }),
  interestRateType: varchar('interest_rate_type', { length: 50 }),
  interestPeriod: text('interest_period'),
  maturityDate: date('maturity_date'), // Shared with Bond fields
  valuationCap: numeric('valuation_cap', { precision: 15, scale: 2 }),
  conversionDiscount: numeric('conversion_discount', { precision: 5, scale: 2 }),
  conversionBasis: varchar('conversion_basis', { length: 50 }),
  
  // ======== Option-Specific Fields (Employee Compensation) ========
  optionType: text('option_type'), // References optionTypeEnum
  
  // Vesting & Exercise Terms (Options Only)
  vestingStart: date('vesting_start'),
  vestingMonths: integer('vesting_months'),
  cliffMonths: integer('cliff_months'),
  vestingScheduleType: text('vesting_schedule_type'),
  exerciseWindowDays: integer('exercise_window_days'),
  strikePrice: numeric('strike_price', { precision: 15, scale: 2 }),
  expirationDate: date('expiration_date'),
  terminationDate: date('termination_date'),
  
  // Option Pool Management (Options Only)
  poolName: text('pool_name'),
  poolSize: numeric('pool_size', { precision: 15, scale: 2 }),
  poolAvailable: numeric('pool_available', { precision: 15, scale: 2 }),
  isActive: boolean('is_active'),
  
  // ======== Warrant-Specific Fields (Investment Instruments) ========
  warrantType: text('warrant_type'), // References warrantTypeEnum
  isDetachable: boolean('is_detachable').default(false),
  dealContext: text('deal_context'), // e.g., "Series A warrant", "Bridge warrant"
  isTransferable: boolean('is_transferable').default(false),
  
  // ======== Shared Option/Warrant Fields ========
  totalShares: numeric('total_shares', { precision: 15, scale: 2 }),
  issueRights: varchar('issue_rights', { length: 50 }),
  convertTo: text('convert_to'),
  
  // ======== Bond Fields ========
  principal: numeric('principal', { precision: 15, scale: 2 }),
  couponRate: numeric('coupon_rate', { precision: 5, scale: 2 }),
  couponFrequency: text('coupon_frequency'),
  principalFrequency: text('principal_frequency'),
  tenureMonths: integer('tenure_months'),
  moratoriumPeriod: integer('moratorium_period'),
}, (table) => [
  index('idx_security_round').on(table.roundId),
  index('idx_security_type').on(table.securityType)
]);

export const transactions = pgTable('transactions', {
  // ======== Primary & Identity ========
  id: smallserial('id').primaryKey(),
  
  // ======== Transaction Core Info ========
  transactionDate: date('transaction_date').notNull(),
  transactionReference: text('transaction_reference').notNull(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(),
  
  // ======== References ========
  stakeholderId: integer('stakeholder_id').notNull().references(() => stakeholders.id, { onDelete: 'cascade' }),
  securityId: integer('security_id').notNull().references(() => securities.id, { onDelete: 'cascade' }),
  fundId: integer('fund_id').notNull().references(() => funds.id, { onDelete: 'cascade' }),
  roundId: integer('round_id').notNull().references(() => rounds.id, { onDelete: 'cascade' }),
  
  // ======== Transaction Amounts ========
  // Amount fields for cash transactions
  amountDebit: numeric('amount_debit', { precision: 15, scale: 2 }).default('0'),
  amountCredit: numeric('amount_credit', { precision: 15, scale: 2 }).default('0'),
  
  // Units fields for security transactions
  unitsDebit: numeric('units_debit', { precision: 15, scale: 2 }).default('0'),
  unitsCredit: numeric('units_credit', { precision: 15, scale: 2 }).default('0'),
  
  // ======== Related & Metadata ========
  // Optional link to related transaction (e.g., for conversions)
  relatedTransactionId: integer('related_transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_transaction_stakeholder').on(table.stakeholderId),
  index('idx_transaction_security').on(table.securityId),
  index('idx_transaction_fund').on(table.fundId),
  index('idx_transaction_round').on(table.roundId),
  index('idx_transaction_date').on(table.transactionDate),
  index('idx_transaction_related').on(table.relatedTransactionId)
]);

export const feeCosts = pgTable('fee_costs', {
  id: smallserial('id').primaryKey(),
  feeCostType: varchar('fee_cost_type', { length: 50 }).notNull(),
  fundId: integer('fund_id').notNull().references(() => funds.id, { onDelete: 'cascade' }),
  roundId: integer('round_id').references(() => rounds.id, { onDelete: 'cascade' }),
  feeCostName: text('fee_cost_name'),
  frequency: varchar('frequency', { length: 50 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  date: date('date').notNull(),
  transactionReference: text('transaction_reference'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_feecost_fund').on(table.fundId),
  index('idx_feecost_round').on(table.roundId),
  index('idx_feecost_date').on(table.date),
  index('idx_feecost_transaction_reference').on(table.transactionReference)
]);

export const capTableEntries = pgTable('cap_table_entries', {
  id: smallserial('id').primaryKey(),
  stakeholderId: integer('stakeholder_id').notNull().references(() => stakeholders.id, { onDelete: 'cascade' }),
  securityId: integer('security_id').notNull().references(() => securities.id, { onDelete: 'cascade' }),
  fundId: integer('fund_id').notNull().references(() => funds.id, { onDelete: 'cascade' }),
  roundId: integer('round_id').notNull().references(() => rounds.id, { onDelete: 'cascade' }),
  totalEquityUnits: numeric('total_equity_units', { precision: 15, scale: 2 }).notNull(),
  ownershipPercentage: numeric('ownership_percentage', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_captableentry_stakeholder').on(table.stakeholderId),
  index('idx_captableentry_security').on(table.securityId),
  index('idx_captableentry_fund').on(table.fundId),
  index('idx_captableentry_round').on(table.roundId)
]);
