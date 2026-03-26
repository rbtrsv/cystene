import { pgTable, smallserial, text, varchar, timestamp, numeric, date, boolean, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { FINANCIAL_SCENARIOS, KPI_DATA_TYPES, USER_ROLES } from '../schema-constants';
import { userProfiles } from './accounts';

export const companies = pgTable('companies', {
  id: smallserial('id').primaryKey(),
  name: text('name').notNull(),
  website: text('website'),
  country: varchar('country', { length: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const companyUsers = pgTable('company_users', {
  userProfileId: integer('user_profile_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default(USER_ROLES.VIEWER),
}, (table) => [
  primaryKey({ columns: [table.userProfileId, table.companyId] }),
  index('idx_company_user_company').on(table.companyId)
]);

// ===============================================
// FINANCIAL STATEMENTS
// ===============================================

export const incomeStatements = pgTable('income_statements', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  semester: varchar('semester', { length: 10 }),
  quarter: varchar('quarter', { length: 10 }),
  month: varchar('month', { length: 20 }),
  scenario: varchar('scenario', { length: 50 }).default(FINANCIAL_SCENARIOS.ACTUAL),
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  
  // Revenue section
  revenue: numeric('revenue', { precision: 20, scale: 2 }),
  costOfGoods: numeric('cost_of_goods', { precision: 20, scale: 2 }),
  grossProfit: numeric('gross_profit', { precision: 20, scale: 2 }),
  
  // Operating expenses
  researchAndDevelopment: numeric('research_and_development', { precision: 20, scale: 2 }),
  sellingGeneralAndAdministrative: numeric('selling_general_and_administrative', { precision: 20, scale: 2 }),
  otherOperatingExpenses: numeric('other_operating_expenses', { precision: 20, scale: 2 }),
  
  // Results
  operatingIncome: numeric('operating_income', { precision: 20, scale: 2 }),
  nonOperatingInterestIncome: numeric('non_operating_interest_income', { precision: 20, scale: 2 }),
  nonOperatingInterestExpense: numeric('non_operating_interest_expense', { precision: 20, scale: 2 }),
  otherIncomeExpense: numeric('other_income_expense', { precision: 20, scale: 2 }),
  pretaxIncome: numeric('pretax_income', { precision: 20, scale: 2 }),
  incomeTax: numeric('income_tax', { precision: 20, scale: 2 }),
  netIncome: numeric('net_income', { precision: 20, scale: 2 }),
  
  // Additional metrics
  epsBasic: numeric('eps_basic', { precision: 10, scale: 4 }),
  epsDiluted: numeric('eps_diluted', { precision: 10, scale: 4 }),
  basicSharesOutstanding: numeric('basic_shares_outstanding', { precision: 20, scale: 2 }),
  dilutedSharesOutstanding: numeric('diluted_shares_outstanding', { precision: 20, scale: 2 }),
  ebitda: numeric('ebitda', { precision: 20, scale: 2 }),
  netIncomeContinuousOperations: numeric('net_income_continuous_operations', { precision: 20, scale: 2 }),
  minorityInterests: numeric('minority_interests', { precision: 20, scale: 2 }),
  preferredStockDividends: numeric('preferred_stock_dividends', { precision: 20, scale: 2 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_income_statement_company').on(table.companyId),
  index('idx_income_statement_year').on(table.year),
  index('idx_income_statement_period').on(table.periodStart, table.periodEnd)
]);

export const cashFlowStatements = pgTable('cash_flow_statements', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  semester: varchar('semester', { length: 10 }),
  quarter: varchar('quarter', { length: 10 }),
  month: varchar('month', { length: 20 }),
  scenario: varchar('scenario', { length: 50 }).default(FINANCIAL_SCENARIOS.ACTUAL),
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  
  // Operating activities
  netIncome: numeric('net_income', { precision: 20, scale: 2 }),
  depreciation: numeric('depreciation', { precision: 20, scale: 2 }),
  deferredTaxes: numeric('deferred_taxes', { precision: 20, scale: 2 }),
  stockBasedCompensation: numeric('stock_based_compensation', { precision: 20, scale: 2 }),
  otherNonCashItems: numeric('other_non_cash_items', { precision: 20, scale: 2 }),
  accountsReceivable: numeric('accounts_receivable', { precision: 20, scale: 2 }),
  accountsPayable: numeric('accounts_payable', { precision: 20, scale: 2 }),
  otherAssetsLiabilities: numeric('other_assets_liabilities', { precision: 20, scale: 2 }),
  operatingCashFlow: numeric('operating_cash_flow', { precision: 20, scale: 2 }),
  
  // Investing activities
  capitalExpenditures: numeric('capital_expenditures', { precision: 20, scale: 2 }),
  netIntangibles: numeric('net_intangibles', { precision: 20, scale: 2 }),
  netAcquisitions: numeric('net_acquisitions', { precision: 20, scale: 2 }),
  purchaseOfInvestments: numeric('purchase_of_investments', { precision: 20, scale: 2 }),
  saleOfInvestments: numeric('sale_of_investments', { precision: 20, scale: 2 }),
  otherInvestingActivity: numeric('other_investing_activity', { precision: 20, scale: 2 }),
  investingCashFlow: numeric('investing_cash_flow', { precision: 20, scale: 2 }),
  
  // Financing activities
  longTermDebtIssuance: numeric('long_term_debt_issuance', { precision: 20, scale: 2 }),
  longTermDebtPayments: numeric('long_term_debt_payments', { precision: 20, scale: 2 }),
  shortTermDebtIssuance: numeric('short_term_debt_issuance', { precision: 20, scale: 2 }),
  commonStockIssuance: numeric('common_stock_issuance', { precision: 20, scale: 2 }),
  commonStockRepurchase: numeric('common_stock_repurchase', { precision: 20, scale: 2 }),
  commonDividends: numeric('common_dividends', { precision: 20, scale: 2 }),
  otherFinancingCharges: numeric('other_financing_charges', { precision: 20, scale: 2 }),
  financingCashFlow: numeric('financing_cash_flow', { precision: 20, scale: 2 }),
  
  // Summary
  endCashPosition: numeric('end_cash_position', { precision: 20, scale: 2 }),
  incomeTaxPaid: numeric('income_tax_paid', { precision: 20, scale: 2 }),
  interestPaid: numeric('interest_paid', { precision: 20, scale: 2 }),
  freeCashFlow: numeric('free_cash_flow', { precision: 20, scale: 2 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_cash_flow_statement_company').on(table.companyId),
  index('idx_cash_flow_statement_year').on(table.year),
  index('idx_cash_flow_statement_period').on(table.periodStart, table.periodEnd)
]);

export const balanceSheets = pgTable('balance_sheets', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  semester: varchar('semester', { length: 10 }),
  quarter: varchar('quarter', { length: 10 }),
  month: varchar('month', { length: 20 }),
  scenario: varchar('scenario', { length: 50 }).default(FINANCIAL_SCENARIOS.ACTUAL),
  date: date('date'),
  
  // Current Assets
  cash: numeric('cash', { precision: 20, scale: 2 }),
  cashEquivalents: numeric('cash_equivalents', { precision: 20, scale: 2 }),
  cashAndCashEquivalents: numeric('cash_and_cash_equivalents', { precision: 20, scale: 2 }),
  otherShortTermInvestments: numeric('other_short_term_investments', { precision: 20, scale: 2 }),
  accountsReceivable: numeric('accounts_receivable', { precision: 20, scale: 2 }),
  otherReceivables: numeric('other_receivables', { precision: 20, scale: 2 }),
  inventory: numeric('inventory', { precision: 20, scale: 2 }),
  prepaidAssets: numeric('prepaid_assets', { precision: 20, scale: 2 }),
  restrictedCash: numeric('restricted_cash', { precision: 20, scale: 2 }),
  assetsHeldForSale: numeric('assets_held_for_sale', { precision: 20, scale: 2 }),
  hedgingAssets: numeric('hedging_assets', { precision: 20, scale: 2 }),
  otherCurrentAssets: numeric('other_current_assets', { precision: 20, scale: 2 }),
  totalCurrentAssets: numeric('total_current_assets', { precision: 20, scale: 2 }),
  
  // Non-current Assets
  properties: numeric('properties', { precision: 20, scale: 2 }),
  landAndImprovements: numeric('land_and_improvements', { precision: 20, scale: 2 }),
  machineryFurnitureEquipment: numeric('machinery_furniture_equipment', { precision: 20, scale: 2 }),
  constructionInProgress: numeric('construction_in_progress', { precision: 20, scale: 2 }),
  leases: numeric('leases', { precision: 20, scale: 2 }),
  accumulatedDepreciation: numeric('accumulated_depreciation', { precision: 20, scale: 2 }),
  goodwill: numeric('goodwill', { precision: 20, scale: 2 }),
  investmentProperties: numeric('investment_properties', { precision: 20, scale: 2 }),
  financialAssets: numeric('financial_assets', { precision: 20, scale: 2 }),
  intangibleAssets: numeric('intangible_assets', { precision: 20, scale: 2 }),
  investmentsAndAdvances: numeric('investments_and_advances', { precision: 20, scale: 2 }),
  otherNonCurrentAssets: numeric('other_non_current_assets', { precision: 20, scale: 2 }),
  totalNonCurrentAssets: numeric('total_non_current_assets', { precision: 20, scale: 2 }),
  
  // Total Assets
  totalAssets: numeric('total_assets', { precision: 20, scale: 2 }),
  
  // Current Liabilities
  accountsPayable: numeric('accounts_payable', { precision: 20, scale: 2 }),
  accruedExpenses: numeric('accrued_expenses', { precision: 20, scale: 2 }),
  shortTermDebt: numeric('short_term_debt', { precision: 20, scale: 2 }),
  deferredRevenue: numeric('deferred_revenue', { precision: 20, scale: 2 }),
  taxPayable: numeric('tax_payable', { precision: 20, scale: 2 }),
  pensions: numeric('pensions', { precision: 20, scale: 2 }),
  otherCurrentLiabilities: numeric('other_current_liabilities', { precision: 20, scale: 2 }),
  totalCurrentLiabilities: numeric('total_current_liabilities', { precision: 20, scale: 2 }),
  
  // Non-current Liabilities
  longTermProvisions: numeric('long_term_provisions', { precision: 20, scale: 2 }),
  longTermDebt: numeric('long_term_debt', { precision: 20, scale: 2 }),
  provisionForRisksAndCharges: numeric('provision_for_risks_and_charges', { precision: 20, scale: 2 }),
  deferredLiabilities: numeric('deferred_liabilities', { precision: 20, scale: 2 }),
  derivativeProductLiabilities: numeric('derivative_product_liabilities', { precision: 20, scale: 2 }),
  otherNonCurrentLiabilities: numeric('other_non_current_liabilities', { precision: 20, scale: 2 }),
  totalNonCurrentLiabilities: numeric('total_non_current_liabilities', { precision: 20, scale: 2 }),
  
  // Total Liabilities
  totalLiabilities: numeric('total_liabilities', { precision: 20, scale: 2 }),
  
  // Shareholders' Equity
  commonStock: numeric('common_stock', { precision: 20, scale: 2 }),
  retainedEarnings: numeric('retained_earnings', { precision: 20, scale: 2 }),
  otherStakeholdersEquity: numeric('other_stakeholders_equity', { precision: 20, scale: 2 }),
  totalStakeholdersEquity: numeric('total_stakeholders_equity', { precision: 20, scale: 2 }),
  additionalPaidInCapital: numeric('additional_paid_in_capital', { precision: 20, scale: 2 }),
  treasuryStock: numeric('treasury_stock', { precision: 20, scale: 2 }),
  minorityInterest: numeric('minority_interest', { precision: 20, scale: 2 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_balance_sheet_company').on(table.companyId),
  index('idx_balance_sheet_date').on(table.date),
  index('idx_balance_sheet_year').on(table.year)
]);

export const financialRatios = pgTable('financial_ratios', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  semester: varchar('semester', { length: 10 }),
  quarter: varchar('quarter', { length: 10 }),
  month: varchar('month', { length: 20 }),
  scenario: varchar('scenario', { length: 50 }).default(FINANCIAL_SCENARIOS.ACTUAL),
  fullYear: boolean('full_year').default(false),
  date: date('date'),
  
  // Liquidity ratios
  currentRatio: numeric('current_ratio', { precision: 8, scale: 4 }),
  quickRatio: numeric('quick_ratio', { precision: 8, scale: 4 }),
  cashRatio: numeric('cash_ratio', { precision: 8, scale: 4 }),
  operatingCashFlowRatio: numeric('operating_cash_flow_ratio', { precision: 8, scale: 4 }),
  
  // Solvency ratios
  debtToEquityRatio: numeric('debt_to_equity_ratio', { precision: 8, scale: 4 }),
  debtToAssetsRatio: numeric('debt_to_assets_ratio', { precision: 8, scale: 4 }),
  interestCoverageRatio: numeric('interest_coverage_ratio', { precision: 8, scale: 4 }),
  debtServiceCoverageRatio: numeric('debt_service_coverage_ratio', { precision: 8, scale: 4 }),
  
  // Profitability ratios
  grossProfitMargin: numeric('gross_profit_margin', { precision: 6, scale: 2 }),
  operatingProfitMargin: numeric('operating_profit_margin', { precision: 6, scale: 2 }),
  netProfitMargin: numeric('net_profit_margin', { precision: 6, scale: 2 }),
  ebitdaMargin: numeric('ebitda_margin', { precision: 6, scale: 2 }),
  returnOnAssets: numeric('return_on_assets', { precision: 6, scale: 2 }),
  returnOnEquity: numeric('return_on_equity', { precision: 6, scale: 2 }),
  returnOnInvestedCapital: numeric('return_on_invested_capital', { precision: 6, scale: 2 }),
  
  // Efficiency ratios
  assetTurnoverRatio: numeric('asset_turnover_ratio', { precision: 8, scale: 4 }),
  inventoryTurnoverRatio: numeric('inventory_turnover_ratio', { precision: 8, scale: 4 }),
  receivablesTurnoverRatio: numeric('receivables_turnover_ratio', { precision: 8, scale: 4 }),
  daysSalesOutstanding: numeric('days_sales_outstanding', { precision: 8, scale: 2 }),
  daysInventoryOutstanding: numeric('days_inventory_outstanding', { precision: 8, scale: 2 }),
  daysPayablesOutstanding: numeric('days_payables_outstanding', { precision: 8, scale: 2 }),
  
  // Investment ratios
  earningsPerShare: numeric('earnings_per_share', { precision: 10, scale: 4 }),
  priceEarningsRatio: numeric('price_earnings_ratio', { precision: 10, scale: 4 }),
  dividendYield: numeric('dividend_yield', { precision: 6, scale: 2 }),
  dividendPayoutRatio: numeric('dividend_payout_ratio', { precision: 6, scale: 2 }),
  bookValuePerShare: numeric('book_value_per_share', { precision: 10, scale: 4 }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_financial_ratios_company').on(table.companyId),
  index('idx_financial_ratios_date').on(table.date)
]);

// ===============================================
// METRICS & KPIs
// ===============================================

export const revenueMetrics = pgTable('revenue_metrics', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  semester: varchar('semester', { length: 10 }),
  quarter: varchar('quarter', { length: 10 }),
  month: varchar('month', { length: 20 }),
  scenario: varchar('scenario', { length: 50 }).default(FINANCIAL_SCENARIOS.ACTUAL),
  fullYear: boolean('full_year').default(false),
  date: date('date'),
  
  // Core revenue metrics
  recurringRevenue: numeric('recurring_revenue', { precision: 20, scale: 2 }),
  nonRecurringRevenue: numeric('non_recurring_revenue', { precision: 20, scale: 2 }),
  revenueGrowthRate: numeric('revenue_growth_rate', { precision: 6, scale: 2 }),
  
  // Revenue breakdown
  existingCustomerExistingSeatsRevenue: numeric('existing_customer_existing_seats_revenue', { precision: 20, scale: 2 }),
  existingCustomerAdditionalSeatsRevenue: numeric('existing_customer_additional_seats_revenue', { precision: 20, scale: 2 }),
  newCustomerNewSeatsRevenue: numeric('new_customer_new_seats_revenue', { precision: 20, scale: 2 }),
  discountsAndRefunds: numeric('discounts_and_refunds', { precision: 20, scale: 2 }),
  
  // SaaS-specific metrics
  arr: numeric('arr', { precision: 20, scale: 2 }),
  mrr: numeric('mrr', { precision: 20, scale: 2 }),
  
  // Per customer metrics
  averageRevenuePerCustomer: numeric('average_revenue_per_customer', { precision: 20, scale: 2 }),
  averageContractValue: numeric('average_contract_value', { precision: 20, scale: 2 }),
  
  // Retention metrics
  revenueChurnRate: numeric('revenue_churn_rate', { precision: 6, scale: 2 }),
  netRevenueRetention: numeric('net_revenue_retention', { precision: 6, scale: 2 }),
  grossRevenueRetention: numeric('gross_revenue_retention', { precision: 6, scale: 2 }),
  
  // Cohort growth rates
  growthRateCohort1: numeric('growth_rate_cohort_1', { precision: 6, scale: 2 }),
  growthRateCohort2: numeric('growth_rate_cohort_2', { precision: 6, scale: 2 }),
  growthRateCohort3: numeric('growth_rate_cohort_3', { precision: 6, scale: 2 }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_revenue_metrics_company').on(table.companyId),
  index('idx_revenue_metrics_date').on(table.date)
]);

export const customerMetrics = pgTable('customer_metrics', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  semester: varchar('semester', { length: 10 }),
  quarter: varchar('quarter', { length: 10 }),
  month: varchar('month', { length: 20 }),
  scenario: varchar('scenario', { length: 50 }).default(FINANCIAL_SCENARIOS.ACTUAL),
  fullYear: boolean('full_year').default(false),
  date: date('date'),
  
  // Customer counts
  totalCustomers: integer('total_customers'),
  newCustomers: integer('new_customers'),
  churnedCustomers: integer('churned_customers'),
  
  // User metrics
  totalUsers: integer('total_users'),
  activeUsers: integer('active_users'),
  totalMonthlyActiveClientUsers: integer('total_monthly_active_client_users'),
  
  // User breakdown
  existingCustomerExistingSeatsUsers: integer('existing_customer_existing_seats_users'),
  existingCustomerAdditionalSeatsUsers: integer('existing_customer_additional_seats_users'),
  newCustomerNewSeatsUsers: integer('new_customer_new_seats_users'),
  userGrowthRate: numeric('user_growth_rate', { precision: 6, scale: 2 }),
  
  // Addressable market metrics
  newCustomerTotalAddressableSeats: integer('new_customer_total_addressable_seats'),
  newCustomerNewSeatsPercentSigned: numeric('new_customer_new_seats_percent_signed', { precision: 6, scale: 2 }),
  newCustomerTotalAddressableSeatsRemaining: integer('new_customer_total_addressable_seats_remaining'),
  
  // Customer segments
  existingCustomerCount: integer('existing_customer_count'),
  existingCustomerExpansionCount: integer('existing_customer_expansion_count'),
  newCustomerCount: integer('new_customer_count'),
  
  // Growth metrics
  customerGrowthRate: numeric('customer_growth_rate', { precision: 6, scale: 2 }),
  
  // Customer acquisition
  cac: numeric('cac', { precision: 20, scale: 2 }),
  ltv: numeric('ltv', { precision: 20, scale: 2 }),
  ltvCacRatio: numeric('ltv_cac_ratio', { precision: 8, scale: 2 }),
  paybackPeriod: numeric('payback_period', { precision: 8, scale: 2 }),
  
  // Retention metrics
  customerChurnRate: numeric('customer_churn_rate', { precision: 6, scale: 2 }),
  
  // Efficiency metrics
  customerAcquisitionEfficiency: numeric('customer_acquisition_efficiency', { precision: 6, scale: 2 }),
  salesEfficiency: numeric('sales_efficiency', { precision: 6, scale: 2 }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_customer_metrics_company').on(table.companyId),
  index('idx_customer_metrics_date').on(table.date)
]);

export const operationalMetrics = pgTable('operational_metrics', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  semester: varchar('semester', { length: 10 }),
  quarter: varchar('quarter', { length: 10 }),
  month: varchar('month', { length: 20 }),
  scenario: varchar('scenario', { length: 50 }).default(FINANCIAL_SCENARIOS.ACTUAL),
  fullYear: boolean('full_year').default(false),
  date: date('date'),
  
  // Cash metrics
  burnRate: numeric('burn_rate', { precision: 20, scale: 2 }),
  runwayMonths: numeric('runway_months', { precision: 6, scale: 2 }),
  runwayGross: numeric('runway_gross', { precision: 6, scale: 2 }),
  runwayNet: numeric('runway_net', { precision: 6, scale: 2 }),
  
  // Efficiency metrics
  burnMultiple: numeric('burn_multiple', { precision: 6, scale: 2 }),
  ruleOf40: numeric('rule_of_40', { precision: 6, scale: 2 }),
  
  // Unit economics
  grossMargin: numeric('gross_margin', { precision: 6, scale: 2 }),
  contributionMargin: numeric('contribution_margin', { precision: 6, scale: 2 }),
  
  // Productivity metrics
  revenuePerEmployee: numeric('revenue_per_employee', { precision: 20, scale: 2 }),
  profitPerEmployee: numeric('profit_per_employee', { precision: 20, scale: 2 }),
  
  // Investment metrics
  capitalEfficiency: numeric('capital_efficiency', { precision: 6, scale: 2 }),
  cashConversionCycle: numeric('cash_conversion_cycle', { precision: 6, scale: 2 }),
  
  // Capex / Operating metrics
  capex: numeric('capex', { precision: 20, scale: 2 }),
  ebitda: numeric('ebitda', { precision: 20, scale: 2 }),
  totalCosts: numeric('total_costs', { precision: 20, scale: 2 }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_operational_metrics_company').on(table.companyId),
  index('idx_operational_metrics_date').on(table.date)
]);

export const teamMetrics = pgTable('team_metrics', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  semester: varchar('semester', { length: 10 }),
  quarter: varchar('quarter', { length: 10 }),
  month: varchar('month', { length: 20 }),
  scenario: varchar('scenario', { length: 50 }).default(FINANCIAL_SCENARIOS.ACTUAL),
  fullYear: boolean('full_year').default(false),
  date: date('date'),
  
  // Headcount
  totalEmployees: integer('total_employees'),
  fullTimeEmployees: integer('full_time_employees'),
  partTimeEmployees: integer('part_time_employees'),
  contractors: integer('contractors'),
  
  // Department breakdown
  numberOfManagement: integer('number_of_management'),
  numberOfSalesMarketingStaff: integer('number_of_sales_marketing_staff'),
  numberOfResearchDevelopmentStaff: integer('number_of_research_development_staff'),
  numberOfCustomerServiceSupportStaff: integer('number_of_customer_service_support_staff'),
  numberOfGeneralStaff: integer('number_of_general_staff'),
  
  // Growth and efficiency
  employeeGrowthRate: numeric('employee_growth_rate', { precision: 6, scale: 2 }),
  
  // Retention and satisfaction
  employeeTurnoverRate: numeric('employee_turnover_rate', { precision: 6, scale: 2 }),
  averageTenureMonths: numeric('average_tenure_months', { precision: 6, scale: 2 }),
  
  // Staff costs
  managementCosts: numeric('management_costs', { precision: 20, scale: 2 }),
  salesMarketingStaffCosts: numeric('sales_marketing_staff_costs', { precision: 20, scale: 2 }),
  researchDevelopmentStaffCosts: numeric('research_development_staff_costs', { precision: 20, scale: 2 }),
  customerServiceSupportStaffCosts: numeric('customer_service_support_staff_costs', { precision: 20, scale: 2 }),
  generalStaffCosts: numeric('general_staff_costs', { precision: 20, scale: 2 }),
  staffCostsTotal: numeric('staff_costs_total', { precision: 20, scale: 2 }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_team_metrics_company').on(table.companyId),
  index('idx_team_metrics_date').on(table.date)
]);

// ===============================================
// DYNAMIC KPI SYSTEM
// ===============================================

export const kpis = pgTable('kpis', {
  id: smallserial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  dataType: varchar('data_type', { length: 50 }).notNull().default(KPI_DATA_TYPES.DECIMAL),
  isCalculated: boolean('is_calculated').default(false),
  formula: text('formula'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_kpi_company').on(table.companyId),
  uniqueIndex('unique_kpi_name_company').on(table.companyId, table.name)
]);

export const kpiValues = pgTable('kpi_values', {
  id: smallserial('id').primaryKey(),
  kpiId: integer('kpi_id').notNull().references(() => kpis.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  year: integer('year').notNull(),
  semester: varchar('semester', { length: 10 }),
  quarter: varchar('quarter', { length: 10 }),
  month: varchar('month', { length: 20 }),
  fullYear: boolean('full_year').default(false),
  scenario: varchar('scenario', { length: 50 }).default(FINANCIAL_SCENARIOS.ACTUAL),
  value: numeric('value', { precision: 20, scale: 4 }),
  calculatedAt: timestamp('calculated_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_kpi_value_kpi').on(table.kpiId),
  index('idx_kpi_value_date').on(table.date),
  uniqueIndex('unique_kpi_value').on(table.kpiId, table.date, table.scenario)
]);
