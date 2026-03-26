from sqlalchemy import Integer, String, Boolean, ForeignKey, Text, Numeric, UniqueConstraint, Date
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import date as date_type
from core.db import Base
from .mixin_models import BaseMixin


class IncomeStatement(Base, BaseMixin):
    """
    Profit & Loss (P&L) Statement.

    Tracks comprehensive income statement data including:
    - Sales and cost of goods
    - Operating expenses breakdown (R&D, SG&A)
    - Non-operating interest income/expense
    - Pretax and net income calculations
    - Per-share metrics (EPS, outstanding shares)
    - Additional metrics like EBITDA and minority interests
    """
    __tablename__ = "income_statements"
    __table_args__ = (UniqueConstraint('entity_id', 'period_start', 'period_end', 'scenario'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)

    # Detailed time dimensions
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[str | None] = mapped_column(String(2), nullable=True)  # 'Q1', 'Q2', 'Q3', 'Q4'
    semester: Mapped[str | None] = mapped_column(String(2), nullable=True)  # 'S1', 'S2'
    month: Mapped[str | None] = mapped_column(String(9), nullable=True)
    full_year: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    scenario: Mapped[str] = mapped_column(String(20), default="actual", nullable=False)  # 'actual', 'forecast', 'budget'

    # Period dimensions
    period_start: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    period_end: Mapped[date_type | None] = mapped_column(Date, nullable=True)

    # Revenue section
    revenue: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    cost_of_goods: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    gross_profit: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Operating expenses
    research_and_development: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    selling_general_and_administrative: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_operating_expenses: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Results
    operating_income: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    non_operating_interest_income: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    non_operating_interest_expense: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_income_expense: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    pretax_income: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    income_tax: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    net_income: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Additional metrics
    eps_basic: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    eps_diluted: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    basic_shares_outstanding: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    diluted_shares_outstanding: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    ebitda: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    net_income_continuous_operations: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    minority_interests: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    preferred_stock_dividends: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)


class CashFlowStatement(Base, BaseMixin):
    """
    Cash Flow Statement.

    Tracks cash movements across:
    - Operating activities (net income, depreciation, working capital)
    - Investing activities (capital expenditures, investments)
    - Financing activities (debt, equity, dividends)
    """
    __tablename__ = "cash_flow_statements"
    __table_args__ = (UniqueConstraint('entity_id', 'period_start', 'period_end', 'scenario'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)

    # Detailed time dimensions
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[str | None] = mapped_column(String(2), nullable=True)
    semester: Mapped[str | None] = mapped_column(String(2), nullable=True)
    month: Mapped[str | None] = mapped_column(String(9), nullable=True)
    full_year: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    scenario: Mapped[str] = mapped_column(String(20), default="actual", nullable=False)

    # Period dimensions
    period_start: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    period_end: Mapped[date_type | None] = mapped_column(Date, nullable=True)

    # Operating activities
    net_income: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    depreciation: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    deferred_taxes: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    stock_based_compensation: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_non_cash_items: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    accounts_receivable: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    accounts_payable: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_assets_liabilities: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    operating_cash_flow: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Investing activities
    capital_expenditures: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    net_intangibles: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    net_acquisitions: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    purchase_of_investments: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    sale_of_investments: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_investing_activity: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    investing_cash_flow: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Financing activities
    long_term_debt_issuance: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    long_term_debt_payments: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    short_term_debt_issuance: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    common_stock_issuance: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    common_stock_repurchase: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    common_dividends: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_financing_charges: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    financing_cash_flow: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Summary
    end_cash_position: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    income_tax_paid: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    interest_paid: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    free_cash_flow: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)


class BalanceSheet(Base, BaseMixin):
    """
    Balance Sheet.

    Provides a snapshot of an entity's financial position at a specific point in time,
    detailing assets, liabilities, and shareholders' equity.
    Follows standard accounting equation: Assets = Liabilities + Equity
    """
    __tablename__ = "balance_sheets"
    __table_args__ = (UniqueConstraint('entity_id', 'date', 'scenario'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)

    # Detailed time dimensions
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[str | None] = mapped_column(String(2), nullable=True)
    semester: Mapped[str | None] = mapped_column(String(2), nullable=True)
    month: Mapped[str | None] = mapped_column(String(9), nullable=True)
    full_year: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    scenario: Mapped[str] = mapped_column(String(20), default="actual", nullable=False)

    # Period dimension
    date: Mapped[date_type | None] = mapped_column(Date, nullable=True)

    # Current Assets
    cash: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    cash_equivalents: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    cash_and_cash_equivalents: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_short_term_investments: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    accounts_receivable: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_receivables: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    inventory: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    prepaid_assets: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    restricted_cash: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    assets_held_for_sale: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    hedging_assets: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_current_assets: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    total_current_assets: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Non-current Assets
    properties: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    land_and_improvements: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    machinery_furniture_equipment: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    construction_in_progress: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    leases: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    accumulated_depreciation: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    goodwill: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    investment_properties: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    financial_assets: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    intangible_assets: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    investments_and_advances: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_non_current_assets: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    total_non_current_assets: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Total Assets
    total_assets: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Current Liabilities
    accounts_payable: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    accrued_expenses: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    short_term_debt: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    deferred_revenue: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    tax_payable: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    pensions: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_current_liabilities: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    total_current_liabilities: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Non-current Liabilities
    long_term_provisions: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    long_term_debt: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    provision_for_risks_and_charges: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    deferred_liabilities: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    derivative_product_liabilities: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_non_current_liabilities: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    total_non_current_liabilities: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Total Liabilities
    total_liabilities: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Shareholders' Equity
    common_stock: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    retained_earnings: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    other_shareholders_equity: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    total_shareholders_equity: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    additional_paid_in_capital: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    treasury_stock: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    minority_interest: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)


class FinancialMetrics(Base, BaseMixin):
    """
    Consolidated financial analytics metrics table.

    Combines the previous FinancialRatios, RevenueMetrics, CustomerMetrics,
    OperationalMetrics, and TeamMetrics models into one snapshot table keyed by:
    (entity_id, period_end, scenario).
    """
    __tablename__ = "financial_metrics"
    __table_args__ = (UniqueConstraint('entity_id', 'period_end', 'scenario'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)

    # Detailed time dimensions
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[str | None] = mapped_column(String(2), nullable=True)
    semester: Mapped[str | None] = mapped_column(String(2), nullable=True)
    month: Mapped[str | None] = mapped_column(String(9), nullable=True)
    full_year: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    scenario: Mapped[str] = mapped_column(String(20), default="actual", nullable=False)

    # Period dimension (as-of period end date)
    period_end: Mapped[date_type | None] = mapped_column(Date, nullable=True)

    # Ratios: liquidity
    current_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    quick_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    cash_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    operating_cash_flow_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)

    # Ratios: solvency
    debt_to_equity_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    debt_to_assets_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    interest_coverage_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    debt_service_coverage_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)

    # Ratios: profitability
    gross_profit_margin: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    operating_profit_margin: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    net_profit_margin: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    ebitda_margin: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    return_on_assets: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    return_on_equity: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    return_on_invested_capital: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)

    # Ratios: efficiency
    asset_turnover_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    inventory_turnover_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    receivables_turnover_ratio: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    days_sales_outstanding: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    days_inventory_outstanding: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    days_payables_outstanding: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)

    # Ratios: investment
    earnings_per_share: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    price_earnings_ratio: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    dividend_yield: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    dividend_payout_ratio: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    book_value_per_share: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)

    # Revenue metrics
    recurring_revenue: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    non_recurring_revenue: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    revenue_growth_rate: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    existing_customer_existing_seats_revenue: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    existing_customer_additional_seats_revenue: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    new_customer_new_seats_revenue: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    discounts_and_refunds: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    arr: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    mrr: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    average_revenue_per_customer: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    average_contract_value: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    revenue_churn_rate: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    net_revenue_retention: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    gross_revenue_retention: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    growth_rate_cohort_1: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    growth_rate_cohort_2: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    growth_rate_cohort_3: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)

    # Customer metrics
    total_customers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_customers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    churned_customers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_users: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active_users: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_monthly_active_client_users: Mapped[int | None] = mapped_column(Integer, nullable=True)
    existing_customer_existing_seats_users: Mapped[int | None] = mapped_column(Integer, nullable=True)
    existing_customer_additional_seats_users: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_customer_new_seats_users: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_growth_rate: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    new_customer_total_addressable_seats: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_customer_new_seats_percent_signed: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    new_customer_total_addressable_seats_remaining: Mapped[int | None] = mapped_column(Integer, nullable=True)
    existing_customer_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    existing_customer_expansion_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_customer_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    customer_growth_rate: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    cac: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    ltv: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    ltv_cac_ratio: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    payback_period: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    customer_churn_rate: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    customer_acquisition_efficiency: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    sales_efficiency: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)

    # Operational metrics
    burn_rate: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    runway_months: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    runway_gross: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    runway_net: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    burn_multiple: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    rule_of_40: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    gross_margin: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    contribution_margin: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    revenue_per_employee: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    profit_per_employee: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    capital_efficiency: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    cash_conversion_cycle: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    capex: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    ebitda: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    total_costs: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Team metrics
    total_employees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    full_time_employees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    part_time_employees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    contractors: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Department breakdown
    number_of_management: Mapped[int | None] = mapped_column(Integer, nullable=True)
    number_of_sales_marketing_staff: Mapped[int | None] = mapped_column(Integer, nullable=True)
    number_of_research_development_staff: Mapped[int | None] = mapped_column(Integer, nullable=True)
    number_of_customer_service_support_staff: Mapped[int | None] = mapped_column(Integer, nullable=True)
    number_of_general_staff: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Growth and efficiency metrics
    employee_growth_rate: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)

    # Retention and satisfaction metrics
    employee_turnover_rate: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    average_tenure_months: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)

    # Staff costs
    management_costs: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    sales_marketing_staff_costs: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    research_development_staff_costs: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    customer_service_support_staff_costs: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    general_staff_costs: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    staff_costs_total: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class KPI(Base, BaseMixin):
    """
    Defines a custom KPI for an entity.

    This model merges the KPI definition and calculated KPI concepts.
    It includes the KPI's name, description, data type, and optional formula
    for calculating the KPI with components from other KPIs.
    """
    __tablename__ = "kpis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_type: Mapped[str] = mapped_column(String(50), default="decimal", nullable=False)  # 'decimal', 'integer', 'string'
    is_calculated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    formula: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    values: Mapped[list["KPIValue"]] = relationship(back_populates="kpi", cascade="all, delete-orphan")


class KPIValue(Base, BaseMixin):
    """
    Stores the value of a KPI for a given entity on a specific date,
    under a particular scenario and granularity.
    """
    __tablename__ = "kpi_values"
    __table_args__ = (UniqueConstraint('kpi_id', 'date', 'scenario'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kpi_id: Mapped[int] = mapped_column(Integer, ForeignKey("kpis.id", ondelete="CASCADE"), nullable=False)

    # Detailed time dimensions
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[str | None] = mapped_column(String(2), nullable=True)
    semester: Mapped[str | None] = mapped_column(String(2), nullable=True)
    month: Mapped[str | None] = mapped_column(String(9), nullable=True)
    full_year: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    scenario: Mapped[str] = mapped_column(String(20), default="actual", nullable=False)

    # Period dimension
    date: Mapped[date_type | None] = mapped_column(Date, nullable=True)

    # Value and metadata
    value: Mapped[float | None] = mapped_column(Numeric(20, 4), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    kpi: Mapped["KPI"] = relationship(back_populates="values")
