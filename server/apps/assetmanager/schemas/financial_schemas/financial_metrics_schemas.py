"""
Financial Metrics Schemas

Pydantic schemas for the consolidated FinancialMetrics model.
"""

from datetime import datetime
from datetime import date as date_type

from pydantic import BaseModel, ConfigDict, Field
from .shared_financial_schemas import Scenario, Quarter, Semester, Month


class FinancialMetrics(BaseModel):
    """Financial metrics schema - full representation."""

    id: int
    entity_id: int = Field(description="Associated entity ID")

    # Time dimensions
    year: int = Field(description="Year")
    quarter: Quarter | None = Field(None, description="Fiscal quarter")
    semester: Semester | None = Field(None, description="Fiscal semester")
    month: Month | None = Field(None, description="Month")
    full_year: bool = Field(default=False, description="Full year aggregation flag")
    scenario: Scenario = Field(description="Scenario type")
    period_end: date_type | None = Field(None, description="As-of period end date")

    # Ratios: liquidity
    current_ratio: float | None = None
    quick_ratio: float | None = None
    cash_ratio: float | None = None
    operating_cash_flow_ratio: float | None = None

    # Ratios: solvency
    debt_to_equity_ratio: float | None = None
    debt_to_assets_ratio: float | None = None
    interest_coverage_ratio: float | None = None
    debt_service_coverage_ratio: float | None = None

    # Ratios: profitability
    gross_profit_margin: float | None = None
    operating_profit_margin: float | None = None
    net_profit_margin: float | None = None
    ebitda_margin: float | None = None
    return_on_assets: float | None = None
    return_on_equity: float | None = None
    return_on_invested_capital: float | None = None

    # Ratios: efficiency
    asset_turnover_ratio: float | None = None
    inventory_turnover_ratio: float | None = None
    receivables_turnover_ratio: float | None = None
    days_sales_outstanding: float | None = None
    days_inventory_outstanding: float | None = None
    days_payables_outstanding: float | None = None

    # Ratios: investment
    earnings_per_share: float | None = None
    price_earnings_ratio: float | None = None
    dividend_yield: float | None = None
    dividend_payout_ratio: float | None = None
    book_value_per_share: float | None = None

    # Revenue metrics
    recurring_revenue: float | None = None
    non_recurring_revenue: float | None = None
    revenue_growth_rate: float | None = None
    existing_customer_existing_seats_revenue: float | None = None
    existing_customer_additional_seats_revenue: float | None = None
    new_customer_new_seats_revenue: float | None = None
    discounts_and_refunds: float | None = None
    arr: float | None = None
    mrr: float | None = None
    average_revenue_per_customer: float | None = None
    average_contract_value: float | None = None
    revenue_churn_rate: float | None = None
    net_revenue_retention: float | None = None
    gross_revenue_retention: float | None = None
    growth_rate_cohort_1: float | None = None
    growth_rate_cohort_2: float | None = None
    growth_rate_cohort_3: float | None = None

    # Customer metrics
    total_customers: int | None = None
    new_customers: int | None = None
    churned_customers: int | None = None
    total_users: int | None = None
    active_users: int | None = None
    total_monthly_active_client_users: int | None = None
    existing_customer_existing_seats_users: int | None = None
    existing_customer_additional_seats_users: int | None = None
    new_customer_new_seats_users: int | None = None
    user_growth_rate: float | None = None
    new_customer_total_addressable_seats: int | None = None
    new_customer_new_seats_percent_signed: float | None = None
    new_customer_total_addressable_seats_remaining: int | None = None
    existing_customer_count: int | None = None
    existing_customer_expansion_count: int | None = None
    new_customer_count: int | None = None
    customer_growth_rate: float | None = None
    cac: float | None = None
    ltv: float | None = None
    ltv_cac_ratio: float | None = None
    payback_period: float | None = None
    customer_churn_rate: float | None = None
    customer_acquisition_efficiency: float | None = None
    sales_efficiency: float | None = None

    # Operational metrics
    burn_rate: float | None = None
    runway_months: float | None = None
    runway_gross: float | None = None
    runway_net: float | None = None
    burn_multiple: float | None = None
    rule_of_40: float | None = None
    gross_margin: float | None = None
    contribution_margin: float | None = None
    revenue_per_employee: float | None = None
    profit_per_employee: float | None = None
    capital_efficiency: float | None = None
    cash_conversion_cycle: float | None = None
    capex: float | None = None
    ebitda: float | None = None
    total_costs: float | None = None

    # Team metrics
    total_employees: int | None = None
    full_time_employees: int | None = None
    part_time_employees: int | None = None
    contractors: int | None = None
    number_of_management: int | None = None
    number_of_sales_marketing_staff: int | None = None
    number_of_research_development_staff: int | None = None
    number_of_customer_service_support_staff: int | None = None
    number_of_general_staff: int | None = None
    employee_growth_rate: float | None = None
    employee_turnover_rate: float | None = None
    average_tenure_months: float | None = None
    management_costs: float | None = None
    sales_marketing_staff_costs: float | None = None
    research_development_staff_costs: float | None = None
    customer_service_support_staff_costs: float | None = None
    general_staff_costs: float | None = None
    staff_costs_total: float | None = None

    # Notes and audit timestamps
    notes: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class FinancialMetricsCreate(BaseModel):
    """Schema for creating financial metrics."""

    entity_id: int = Field(description="Associated entity ID")
    year: int = Field(description="Year")
    quarter: Quarter | None = None
    semester: Semester | None = None
    month: Month | None = None
    full_year: bool = False
    scenario: Scenario = Scenario.ACTUAL
    period_end: date_type | None = None

    # Keep metric fields optional for partial data ingestion.
    current_ratio: float | None = None
    quick_ratio: float | None = None
    cash_ratio: float | None = None
    operating_cash_flow_ratio: float | None = None
    debt_to_equity_ratio: float | None = None
    debt_to_assets_ratio: float | None = None
    interest_coverage_ratio: float | None = None
    debt_service_coverage_ratio: float | None = None
    gross_profit_margin: float | None = None
    operating_profit_margin: float | None = None
    net_profit_margin: float | None = None
    ebitda_margin: float | None = None
    return_on_assets: float | None = None
    return_on_equity: float | None = None
    return_on_invested_capital: float | None = None
    asset_turnover_ratio: float | None = None
    inventory_turnover_ratio: float | None = None
    receivables_turnover_ratio: float | None = None
    days_sales_outstanding: float | None = None
    days_inventory_outstanding: float | None = None
    days_payables_outstanding: float | None = None
    earnings_per_share: float | None = None
    price_earnings_ratio: float | None = None
    dividend_yield: float | None = None
    dividend_payout_ratio: float | None = None
    book_value_per_share: float | None = None
    recurring_revenue: float | None = None
    non_recurring_revenue: float | None = None
    revenue_growth_rate: float | None = None
    existing_customer_existing_seats_revenue: float | None = None
    existing_customer_additional_seats_revenue: float | None = None
    new_customer_new_seats_revenue: float | None = None
    discounts_and_refunds: float | None = None
    arr: float | None = None
    mrr: float | None = None
    average_revenue_per_customer: float | None = None
    average_contract_value: float | None = None
    revenue_churn_rate: float | None = None
    net_revenue_retention: float | None = None
    gross_revenue_retention: float | None = None
    growth_rate_cohort_1: float | None = None
    growth_rate_cohort_2: float | None = None
    growth_rate_cohort_3: float | None = None
    total_customers: int | None = None
    new_customers: int | None = None
    churned_customers: int | None = None
    total_users: int | None = None
    active_users: int | None = None
    total_monthly_active_client_users: int | None = None
    existing_customer_existing_seats_users: int | None = None
    existing_customer_additional_seats_users: int | None = None
    new_customer_new_seats_users: int | None = None
    user_growth_rate: float | None = None
    new_customer_total_addressable_seats: int | None = None
    new_customer_new_seats_percent_signed: float | None = None
    new_customer_total_addressable_seats_remaining: int | None = None
    existing_customer_count: int | None = None
    existing_customer_expansion_count: int | None = None
    new_customer_count: int | None = None
    customer_growth_rate: float | None = None
    cac: float | None = None
    ltv: float | None = None
    ltv_cac_ratio: float | None = None
    payback_period: float | None = None
    customer_churn_rate: float | None = None
    customer_acquisition_efficiency: float | None = None
    sales_efficiency: float | None = None
    burn_rate: float | None = None
    runway_months: float | None = None
    runway_gross: float | None = None
    runway_net: float | None = None
    burn_multiple: float | None = None
    rule_of_40: float | None = None
    gross_margin: float | None = None
    contribution_margin: float | None = None
    revenue_per_employee: float | None = None
    profit_per_employee: float | None = None
    capital_efficiency: float | None = None
    cash_conversion_cycle: float | None = None
    capex: float | None = None
    ebitda: float | None = None
    total_costs: float | None = None
    total_employees: int | None = None
    full_time_employees: int | None = None
    part_time_employees: int | None = None
    contractors: int | None = None
    number_of_management: int | None = None
    number_of_sales_marketing_staff: int | None = None
    number_of_research_development_staff: int | None = None
    number_of_customer_service_support_staff: int | None = None
    number_of_general_staff: int | None = None
    employee_growth_rate: float | None = None
    employee_turnover_rate: float | None = None
    average_tenure_months: float | None = None
    management_costs: float | None = None
    sales_marketing_staff_costs: float | None = None
    research_development_staff_costs: float | None = None
    customer_service_support_staff_costs: float | None = None
    general_staff_costs: float | None = None
    staff_costs_total: float | None = None
    notes: str | None = None


class FinancialMetricsUpdate(BaseModel):
    """Schema for updating financial metrics."""

    entity_id: int | None = None
    year: int | None = None
    quarter: Quarter | None = None
    semester: Semester | None = None
    month: Month | None = None
    full_year: bool | None = None
    scenario: Scenario | None = None
    period_end: date_type | None = None

    current_ratio: float | None = None
    quick_ratio: float | None = None
    cash_ratio: float | None = None
    operating_cash_flow_ratio: float | None = None
    debt_to_equity_ratio: float | None = None
    debt_to_assets_ratio: float | None = None
    interest_coverage_ratio: float | None = None
    debt_service_coverage_ratio: float | None = None
    gross_profit_margin: float | None = None
    operating_profit_margin: float | None = None
    net_profit_margin: float | None = None
    ebitda_margin: float | None = None
    return_on_assets: float | None = None
    return_on_equity: float | None = None
    return_on_invested_capital: float | None = None
    asset_turnover_ratio: float | None = None
    inventory_turnover_ratio: float | None = None
    receivables_turnover_ratio: float | None = None
    days_sales_outstanding: float | None = None
    days_inventory_outstanding: float | None = None
    days_payables_outstanding: float | None = None
    earnings_per_share: float | None = None
    price_earnings_ratio: float | None = None
    dividend_yield: float | None = None
    dividend_payout_ratio: float | None = None
    book_value_per_share: float | None = None
    recurring_revenue: float | None = None
    non_recurring_revenue: float | None = None
    revenue_growth_rate: float | None = None
    existing_customer_existing_seats_revenue: float | None = None
    existing_customer_additional_seats_revenue: float | None = None
    new_customer_new_seats_revenue: float | None = None
    discounts_and_refunds: float | None = None
    arr: float | None = None
    mrr: float | None = None
    average_revenue_per_customer: float | None = None
    average_contract_value: float | None = None
    revenue_churn_rate: float | None = None
    net_revenue_retention: float | None = None
    gross_revenue_retention: float | None = None
    growth_rate_cohort_1: float | None = None
    growth_rate_cohort_2: float | None = None
    growth_rate_cohort_3: float | None = None
    total_customers: int | None = None
    new_customers: int | None = None
    churned_customers: int | None = None
    total_users: int | None = None
    active_users: int | None = None
    total_monthly_active_client_users: int | None = None
    existing_customer_existing_seats_users: int | None = None
    existing_customer_additional_seats_users: int | None = None
    new_customer_new_seats_users: int | None = None
    user_growth_rate: float | None = None
    new_customer_total_addressable_seats: int | None = None
    new_customer_new_seats_percent_signed: float | None = None
    new_customer_total_addressable_seats_remaining: int | None = None
    existing_customer_count: int | None = None
    existing_customer_expansion_count: int | None = None
    new_customer_count: int | None = None
    customer_growth_rate: float | None = None
    cac: float | None = None
    ltv: float | None = None
    ltv_cac_ratio: float | None = None
    payback_period: float | None = None
    customer_churn_rate: float | None = None
    customer_acquisition_efficiency: float | None = None
    sales_efficiency: float | None = None
    burn_rate: float | None = None
    runway_months: float | None = None
    runway_gross: float | None = None
    runway_net: float | None = None
    burn_multiple: float | None = None
    rule_of_40: float | None = None
    gross_margin: float | None = None
    contribution_margin: float | None = None
    revenue_per_employee: float | None = None
    profit_per_employee: float | None = None
    capital_efficiency: float | None = None
    cash_conversion_cycle: float | None = None
    capex: float | None = None
    ebitda: float | None = None
    total_costs: float | None = None
    total_employees: int | None = None
    full_time_employees: int | None = None
    part_time_employees: int | None = None
    contractors: int | None = None
    number_of_management: int | None = None
    number_of_sales_marketing_staff: int | None = None
    number_of_research_development_staff: int | None = None
    number_of_customer_service_support_staff: int | None = None
    number_of_general_staff: int | None = None
    employee_growth_rate: float | None = None
    employee_turnover_rate: float | None = None
    average_tenure_months: float | None = None
    management_costs: float | None = None
    sales_marketing_staff_costs: float | None = None
    research_development_staff_costs: float | None = None
    customer_service_support_staff_costs: float | None = None
    general_staff_costs: float | None = None
    staff_costs_total: float | None = None
    notes: str | None = None


class FinancialMetricsResponse(BaseModel):
    """Response containing a single financial metrics snapshot."""

    success: bool
    data: FinancialMetrics | None = None
    error: str | None = None


class FinancialMetricsListResponse(BaseModel):
    """Response containing multiple financial metrics snapshots."""

    success: bool
    data: list[FinancialMetrics] | None = None
    error: str | None = None
