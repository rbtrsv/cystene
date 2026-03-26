import { pgTable, smallserial, text, varchar, timestamp, numeric, date, boolean, integer, index } from 'drizzle-orm/pg-core';
import { DEAL_PRIORITIES, DEAL_STATUSES, SECTOR_TYPES, PORTFOLIO_STATUSES, INVESTMENT_TYPES, CASH_FLOW_TYPES } from '../schema-constants';
import { companies } from './companies';
import { funds, rounds } from './captable';

// ===============================================
// DEAL PIPELINE & PORTFOLIO TABLES
// ===============================================

export const dealPipeline = pgTable('deal_pipeline', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  dealName: text('deal_name').notNull(),
  priority: varchar('priority', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  round: text('round').notNull(),
  sector: varchar('sector', { length: 50 }).notNull(),
  preMoneyValuation: numeric('pre_money_valuation', { precision: 15, scale: 2 }),
  postMoneyValuation: numeric('post_money_valuation', { precision: 15, scale: 2 }),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_deal_pipeline_company').on(table.companyId),
  index('idx_deal_pipeline_status').on(table.status)
]);

export const investmentPortfolio = pgTable('investment_portfolio', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  fundId: integer('fund_id').notNull().references(() => funds.id, { onDelete: 'cascade' }),
  roundId: integer('round_id').notNull().references(() => rounds.id, { onDelete: 'cascade' }),
  portfolioStatus: varchar('portfolio_status', { length: 50 }).notNull(),
  investmentType: varchar('investment_type', { length: 50 }).notNull(),
  sector: varchar('sector', { length: 50 }).notNull(),
  investmentAmount: numeric('investment_amount', { precision: 15, scale: 2 }),
  ownershipPercentage: numeric('ownership_percentage', { precision: 5, scale: 2 }),
  currentFairValue: numeric('current_fair_value', { precision: 15, scale: 2 }),
  companyType: varchar('company_type', { length: 20 }).notNull().default('Venture Capital'),
  numberOfShares: numeric('number_of_shares', { precision: 15, scale: 2 }),
  sharePrice: numeric('share_price', { precision: 15, scale: 2 }),
  moic: numeric('moic', { precision: 8, scale: 2 }),
  irr: numeric('irr', { precision: 8, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_investment_portfolio_company').on(table.companyId),
  index('idx_investment_portfolio_fund').on(table.fundId),
  index('idx_investment_portfolio_round').on(table.roundId),
  index('idx_investment_portfolio_status').on(table.portfolioStatus)
]);

export const portfolioCashFlow = pgTable('portfolio_cash_flow', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  fundId: integer('fund_id').notNull().references(() => funds.id, { onDelete: 'cascade' }),
  roundId: integer('round_id').notNull().references(() => rounds.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  
  // ======== Transaction Amounts ========
  // Amount fields for cash flow transactions (debit/credit approach)
  amountDebit: numeric('amount_debit', { precision: 15, scale: 2 }).default('0'),
  amountCredit: numeric('amount_credit', { precision: 15, scale: 2 }).default('0'),
  
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  cashFlowType: varchar('cash_flow_type', { length: 50 }).notNull(),
  scenario: varchar('scenario', { length: 20 }).notNull().default('Actual'),
  transactionReference: text('transaction_reference'),
  description: text('description'),
  includeInIrr: boolean('include_in_irr').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_portfolio_cash_flow_company').on(table.companyId),
  index('idx_portfolio_cash_flow_fund').on(table.fundId),
  index('idx_portfolio_cash_flow_round').on(table.roundId),
  index('idx_portfolio_cash_flow_scenario').on(table.scenario),
  index('idx_transaction_reference').on(table.transactionReference)
]);

export const portfolioPerformance = pgTable('portfolio_performance', {
  id: smallserial('id').primaryKey(),
  fundId: integer('fund_id').notNull().references(() => funds.id, { onDelete: 'cascade' }),
  roundId: integer('round_id').references(() => rounds.id, { onDelete: 'cascade' }),
  reportDate: date('report_date').notNull(),

  // Core Financial Metrics (all nullable)
  totalInvestedAmount: numeric('total_invested_amount', { precision: 15, scale: 2 }),
  fairValue: numeric('fair_value', { precision: 15, scale: 2 }),
  cashRealized: numeric('cash_realized', { precision: 15, scale: 2 }),

  // NAV Fields
  nav: numeric('nav', { precision: 20, scale: 2 }),
  totalFundUnits: numeric('total_fund_units', { precision: 15, scale: 2 }),
  navPerShare: numeric('nav_per_share', { precision: 10, scale: 4 }),

  // Performance Ratios
  tvpi: numeric('tvpi', { precision: 8, scale: 2 }),
  dpi: numeric('dpi', { precision: 8, scale: 2 }),
  rvpi: numeric('rvpi', { precision: 8, scale: 2 }),
  irr: numeric('irr', { precision: 8, scale: 2 }),

  // Metadata
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_portfolio_performance_round').on(table.roundId),
  index('idx_portfolio_performance_fund').on(table.fundId),
  index('idx_portfolio_performance_report_date').on(table.reportDate)
]);