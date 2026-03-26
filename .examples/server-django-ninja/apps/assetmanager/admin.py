from django.contrib import admin
from django.db import models
from .models import (
    # Core models
    Entity, EntityOrganizationMember, EntityOrganizationInvitation,
    # Stakeholders
    Stakeholder, Syndicate, SyndicateMember,
    # Securities & Transactions
    Security, SecurityStock, SecurityConvertible, SecurityOption, SecurityBond, SecuritySAFE,
    SecurityTransaction, CashTransaction,
    # Deals & Fundraising
    Deal, DealCommitment, DealPipeline, FundingRound,
    # Financial Statements
    IncomeStatement, CashFlowStatement, BalanceSheet, FinancialRatios,
    # Metrics & KPIs
    TeamMetrics, RevenueMetrics, CustomerMetrics, OperationalMetrics, KPI, KPIValue,
    # Investment & Portfolio
    PortfolioInvestment, PortfolioCashFlow, PortfolioPerformance, NAV, Fee,
    # Cap Table
    CapTableSnapshot, CapTableEntry,
    # Deal Information & Profiles
    EntityDealProfile, DealProfileMember, DealProfileRelationship,
)

# Customize admin site header and title
admin.site.site_header = "Asset Manager Administration"
admin.site.site_title = "Asset Manager Portal"
admin.site.index_title = "Welcome to Asset Manager Admin"

# =============================================================================
# CORE MODELS
# =============================================================================

@admin.register(Entity)
class EntityAdmin(admin.ModelAdmin):
    list_display = ('name', 'entity_type', 'parent', 'current_valuation', 'cash_balance', 'organization')
    list_filter = ('entity_type', 'organization')
    search_fields = ('name',)
    raw_id_fields = ('parent', 'organization')

@admin.register(EntityOrganizationMember)
class EntityOrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ('entity', 'organization', 'role', 'joined_at')
    list_filter = ('role',)
    search_fields = ('entity__name', 'organization__name')
    raw_id_fields = ('entity', 'organization')

@admin.register(EntityOrganizationInvitation)
class EntityOrganizationInvitationAdmin(admin.ModelAdmin):
    list_display = ('entity', 'organization', 'role', 'status', 'invited_by', 'invited_at')
    list_filter = ('role', 'status')
    search_fields = ('entity__name', 'organization__name', 'invited_by__email')
    raw_id_fields = ('entity', 'organization', 'invited_by')

# =============================================================================
# TEAM & PARTNERS
# =============================================================================

# =============================================================================
# STAKEHOLDERS
# =============================================================================

@admin.register(Stakeholder)
class StakeholderAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'entity', 'carried_interest_percentage', 'board_seats')
    list_filter = ('type', 'voting_rights', 'pro_rata_rights')
    search_fields = ('name', 'entity__name')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'type', 'entity')
        }),
        ('Investment Rights', {
            'fields': ('carried_interest_percentage', 'preferred_return_rate', 'distribution_tier')
        }),
        ('Governance Rights', {
            'fields': ('board_seats', 'voting_rights', 'pro_rata_rights', 'drag_along', 'tag_along', 'observer_rights')
        }),
        ('Investment Terms', {
            'fields': ('minimum_investment', 'maximum_investment')
        })
    )

class SyndicateMemberInline(admin.TabularInline):
    model = SyndicateMember
    extra = 1
    fields = ['member', 'ownership_percentage', 'investment_amount', 'joined_date']
    raw_id_fields = ['member']
    fk_name = 'syndicate'

@admin.register(Syndicate)
class SyndicateAdmin(admin.ModelAdmin):
    list_display = ['name', 'lead_investor', 'total_members', 'total_ownership']
    list_filter = ['lead_investor']
    search_fields = ['name', 'lead_investor__name']
    raw_id_fields = ['lead_investor']
    inlines = [SyndicateMemberInline]
    
    def total_members(self, obj):
        return obj.memberships.count()
    
    def total_ownership(self, obj):
        total = obj.memberships.aggregate(
            total=models.Sum('ownership_percentage')
        )['total'] or 0
        return f"{total}%"

@admin.register(SyndicateMember)
class SyndicateMemberAdmin(admin.ModelAdmin):
    list_display = ['syndicate', 'member', 'ownership_percentage', 'investment_amount', 'joined_date']
    list_filter = ['syndicate', 'joined_date']
    search_fields = ['syndicate__name', 'member__name']
    raw_id_fields = ['syndicate', 'member']

# =============================================================================
# SECURITIES & TRANSACTIONS
# =============================================================================

@admin.register(Security)
class SecurityAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'funding_round', 'price', 'created_at')
    list_filter = ('type', 'funding_round')
    search_fields = ('name', 'funding_round__name')
    raw_id_fields = ('funding_round',)

@admin.register(SecurityStock)
class SecurityStockAdmin(admin.ModelAdmin):
    list_display = (
        'security',
        'is_preferred',
        'liquidation_preference',
        'seniority',
        'has_dividend_rights',
        'has_voting_rights',
        'has_conversion_rights'
    )
    
    list_filter = (
        'is_preferred',
        'has_participation',
        'has_dividend_rights',
        'is_dividend_cumulative',
        'has_conversion_rights',
        'has_redemption_rights',
        'has_voting_rights',
        'anti_dilution'
    )
    
    search_fields = ('security__name',)
    raw_id_fields = ('security',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'security',
                'is_preferred',
            )
        }),
        ('Liquidation Preferences', {
            'fields': (
                'liquidation_preference',
                'has_participation',
                'participation_cap',
                'seniority',
            ),
            'classes': ('collapse',),
            'description': 'Settings for liquidation preferences and participation rights'
        }),
        ('Dividend Rights', {
            'fields': (
                'has_dividend_rights',
                'dividend_rate',
                'is_dividend_cumulative',
            ),
            'classes': ('collapse',),
            'description': 'Configuration for dividend payments and terms'
        }),
        ('Conversion Rights', {
            'fields': (
                'has_conversion_rights',
                'conversion_ratio',
            ),
            'classes': ('collapse',),
            'description': 'Settings for converting preferred to common stock'
        }),
        ('Anti-dilution Protection', {
            'fields': (
                'anti_dilution',
            ),
            'classes': ('collapse',),
            'description': 'Protection against dilution in future rounds'
        }),
        ('Redemption Rights', {
            'fields': (
                'has_redemption_rights',
                'redemption_term',
            ),
            'classes': ('collapse',),
            'description': 'Configuration for stock redemption terms'
        }),
        ('Voting Rights', {
            'fields': (
                'has_voting_rights',
                'voting_ratio',
            ),
            'classes': ('collapse',),
            'description': 'Settings for voting power and rights'
        })
    )

@admin.register(SecurityConvertible)
class SecurityConvertibleAdmin(admin.ModelAdmin):
    list_display = (
        'security',
        'interest_rate',
        'maturity_date',
        'valuation_cap',
        'conversion_ratio'
    )
    list_filter = ('maturity_date',)
    search_fields = ('security__name',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('security',)
        }),
        ('Convertible Terms', {
            'fields': (
                'interest_rate',
                'maturity_date',
                'valuation_cap',
                'conversion_ratio'
            )
        })
    )

@admin.register(SecurityOption)
class SecurityOptionAdmin(admin.ModelAdmin):
    list_display = (
        'security',
        'option_type',
        'expiration_date',
        'exercise_price',
        'is_virtual',
        'pool_name',
        'vesting_schedule'
    )
    list_filter = (
        'option_type',
        'is_virtual',
        'vesting_schedule',
        'settlement_type'
    )
    search_fields = ('security__name', 'pool_name')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('security', 'option_type', 'is_virtual')
        }),
        ('Exercise Terms', {
            'fields': ('expiration_date', 'exercise_price', 'exercise_window_days')
        }),
        ('Vesting Terms', {
            'fields': (
                'total_shares',
                'vesting_start',
                'vesting_months',
                'cliff_months',
                'vesting_schedule'
            )
        }),
        ('Virtual Security Details', {
            'fields': (
                'reference_price',
                'settlement_type'
            ),
            'classes': ('collapse',),
            'description': 'Specific fields for VSOP and SAR'
        }),
        ('Pool/Plan Details', {
            'fields': (
                'pool_name',
                'pool_size',
                'pool_available'
            )
        }),
        ('Status', {
            'fields': ('is_active', 'termination_date')
        })
    )

@admin.register(SecurityBond)
class SecurityBondAdmin(admin.ModelAdmin):
    list_display = (
        'security',
        'face_value',
        'coupon_rate',
        'maturity_date',
        'interest_frequency'
    )
    list_filter = (
        'interest_frequency',
        'maturity_date'
    )
    search_fields = ('security__name',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('security',)
        }),
        ('Bond Terms', {
            'fields': (
                'face_value',
                'coupon_rate',
                'maturity_date',
                'interest_frequency'
            )
        })
    )

@admin.register(SecurityTransaction)
class SecurityTransactionAdmin(admin.ModelAdmin):
    list_display = ('stakeholder', 'security', 'type', 'transaction_reference', 'units_debit', 'units_credit', 'transaction_date')
    list_filter = ('type', 'transaction_date', 'security__type')
    search_fields = ('stakeholder__name', 'security__name', 'transaction_reference', 'notes')
    raw_id_fields = ('stakeholder', 'security', 'funding_round')

@admin.register(CashTransaction)
class CashTransactionAdmin(admin.ModelAdmin):
    list_display = ('stakeholder', 'type', 'transaction_reference', 'amount_debit', 'amount_credit', 'transaction_date')
    list_filter = ('type', 'transaction_date')
    search_fields = ('stakeholder__name', 'transaction_reference', 'notes')
    raw_id_fields = ('stakeholder', 'funding_round', 'security')

@admin.register(SecuritySAFE)
class SecuritySAFEAdmin(admin.ModelAdmin):
    list_display = (
        'security',
        'valuation_cap',
        'discount_rate',
        'most_favored_nation',
        'pro_rata_rights',
        'post_money_valuation_cap'
    )
    list_filter = (
        'most_favored_nation',
        'pro_rata_rights',
        'post_money_valuation_cap'
    )
    search_fields = ('security__name', 'conversion_trigger')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('security',)
        }),
        ('Core SAFE Terms', {
            'fields': (
                'valuation_cap',
                'discount_rate',
                'most_favored_nation',
                'pro_rata_rights'
            )
        }),
        ('Additional Terms', {
            'fields': (
                'conversion_trigger',
                'post_money_valuation_cap'
            )
        })
    )

# =============================================================================
# DEALS & FUNDRAISING
# =============================================================================

class DealCommitmentInline(admin.TabularInline):
    model = DealCommitment
    extra = 1
    fields = ('entity', 'commitment_type', 'amount', 'notes')
    raw_id_fields = ('entity',)

@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ('name', 'entity', 'deal_type', 'target_amount', 'start_date')
    list_filter = ('deal_type',)
    search_fields = ('name', 'entity__name')
    raw_id_fields = ('entity',)
    inlines = [DealCommitmentInline]
    
    fieldsets = (
        ('Core Details', {
            'fields': ('entity', 'name', 'deal_type')
        }),
        ('Financial Terms', {
            'fields': ('pre_money_valuation', 'post_money_valuation', 'target_amount', 
                      'minimum_investment', 'share_price', 'share_allocation', 'dilution')
        }),
        ('Rights & Governance', {
            'fields': ('liquidation_preference', 'dividend_rights', 'anti_dilution',
                      'pro_rata_rights', 'board_seats', 'veto_rights')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date', 'expected_close_date')
        }),
        ('Status & Progress', {
            'fields': ('soft_commitments', 'firm_commitments', 'profile_views', 'due_diligence_status')
        }),
        ('Documents', {
            'fields': ('pitch_deck', 'financial_model', 'data_room_link', 
                      'term_sheet', 'shareholders_agreement')
        }),
        ('Additional Info', {
            'fields': ('investment_highlights', 'use_of_funds')
        }),
        ('Secondary Details', {
            'fields': ('seller', 'shares_offered'),
            'classes': ('collapse',)
        }),
        ('Debt Details', {
            'fields': ('interest_rate', 'term_length', 'collateral'),
            'classes': ('collapse',)
        }),
        ('M&A Details', {
            'fields': ('acquisition_price', 'payment_structure', 'deal_structure'),
            'classes': ('collapse',)
        })
    )

@admin.register(DealCommitment)
class DealCommitmentAdmin(admin.ModelAdmin):
    list_display = [
        'deal',
        'entity',
        'syndicate',
        'commitment_type',
        'amount',
        'created_at'
    ]
    list_filter = ['commitment_type', 'created_at']
    search_fields = ['entity__name', 'deal__name', 'syndicate__name']
    raw_id_fields = ['deal', 'entity', 'syndicate']

@admin.register(FundingRound)
class FundingRoundAdmin(admin.ModelAdmin):
    list_display = ('entity', 'name', 'round_type', 'target_amount', 'raised_amount', 'date')
    list_filter = ('round_type', 'date')
    search_fields = ('entity__name', 'name')
    raw_id_fields = ('entity',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('entity', 'name', 'round_type', 'date')
        }),
        ('Financial Details', {
            'fields': ('target_amount', 'raised_amount', 'pre_money_valuation', 'post_money_valuation', 'equity_offered')
        }),
        ('Materials', {
            'fields': ('pitch_deck', 'investor_presentation'),
            'classes': ('collapse',)
        })
    )

# =============================================================================
# FINANCIAL STATEMENTS
# =============================================================================

@admin.register(IncomeStatement)
class IncomeStatementAdmin(admin.ModelAdmin):
    list_display = (
        'entity',
        'period_start',
        'period_end',
        'scenario',
        'revenue',
        'gross_profit',
        'operating_income',
        'net_income'
    )
    list_filter = (
        'scenario',
        'year',
        'quarter',
        'semester',
        'month',
        'full_year'
    )
    search_fields = ('entity__name',)
    raw_id_fields = ('entity',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'entity',
                'year',
                'quarter',
                'semester',
                'month',
                'full_year',
                'scenario',
                'period_start',
                'period_end'
            )
        }),
        ('Revenue Section', {
            'fields': (
                'revenue',
                'cost_of_goods',
                'gross_profit'
            )
        }),
        ('Operating Expenses', {
            'fields': (
                'research_and_development',
                'selling_general_and_administrative',
                'other_operating_expenses'
            )
        }),
        ('Results', {
            'fields': (
                'operating_income',
                'non_operating_interest_income',
                'non_operating_interest_expense',
                'other_income_expense',
                'pretax_income',
                'income_tax',
                'net_income'
            )
        }),
        ('Additional Metrics', {
            'fields': (
                'eps_basic',
                'eps_diluted',
                'basic_shares_outstanding',
                'diluted_shares_outstanding',
                'ebitda',
                'net_income_continuous_operations',
                'minority_interests',
                'preferred_stock_dividends'
            ),
            'classes': ('collapse',)
        })
    )

@admin.register(CashFlowStatement)
class CashFlowStatementAdmin(admin.ModelAdmin):
    list_display = (
        'entity',
        'period_start',
        'period_end',
        'scenario',
        'operating_cash_flow',
        'investing_cash_flow',
        'financing_cash_flow'
    )
    list_filter = (
        'scenario',
        'year',
        'quarter',
        'semester',
        'month',
        'full_year'
    )
    search_fields = ('entity__name',)
    raw_id_fields = ('entity',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'entity',
                'year',
                'quarter',
                'semester',
                'month',
                'full_year',
                'scenario',
                'period_start',
                'period_end'
            )
        }),
        ('Operating Activities', {
            'fields': (
                'net_income',
                'depreciation',
                'deferred_taxes',
                'stock_based_compensation',
                'other_non_cash_items',
                'accounts_receivable',
                'accounts_payable',
                'other_assets_liabilities',
                'operating_cash_flow'
            )
        }),
        ('Investing Activities', {
            'fields': (
                'capital_expenditures',
                'net_intangibles',
                'net_acquisitions',
                'purchase_of_investments',
                'sale_of_investments',
                'other_investing_activity',
                'investing_cash_flow'
            )
        }),
        ('Financing Activities', {
            'fields': (
                'long_term_debt_issuance',
                'long_term_debt_payments',
                'short_term_debt_issuance',
                'common_stock_issuance',
                'common_stock_repurchase',
                'common_dividends',
                'other_financing_charges',
                'financing_cash_flow'
            )
        }),
        ('Summary', {
            'fields': (
                'end_cash_position',
                'income_tax_paid',
                'interest_paid',
                'free_cash_flow'
            )
        })
    )

@admin.register(BalanceSheet)
class BalanceSheetAdmin(admin.ModelAdmin):
    list_display = (
        'entity',
        'date',
        'scenario',
        'total_assets',
        'total_liabilities',
        'total_shareholders_equity'
    )
    list_filter = (
        'scenario',
        'year',
        'quarter',
        'semester',
        'month',
        'full_year'
    )
    search_fields = ('entity__name',)
    raw_id_fields = ('entity',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'entity',
                'year',
                'quarter',
                'semester',
                'month',
                'full_year',
                'scenario',
                'date'
            )
        }),
        ('Current Assets', {
            'fields': (
                'cash',
                'cash_equivalents',
                'cash_and_cash_equivalents',
                'other_short_term_investments',
                'accounts_receivable',
                'other_receivables',
                'inventory',
                'prepaid_assets',
                'restricted_cash',
                'assets_held_for_sale',
                'hedging_assets',
                'other_current_assets',
                'total_current_assets'
            )
        }),
        ('Non-current Assets', {
            'fields': (
                'properties',
                'land_and_improvements',
                'machinery_furniture_equipment',
                'construction_in_progress',
                'leases',
                'accumulated_depreciation',
                'goodwill',
                'investment_properties',
                'financial_assets',
                'intangible_assets',
                'investments_and_advances',
                'other_non_current_assets',
                'total_non_current_assets'
            )
        }),
        ('Total Assets', {
            'fields': ('total_assets',)
        }),
        ('Current Liabilities', {
            'fields': (
                'accounts_payable',
                'accrued_expenses',
                'short_term_debt',
                'deferred_revenue',
                'tax_payable',
                'pensions',
                'other_current_liabilities',
                'total_current_liabilities'
            )
        }),
        ('Non-current Liabilities', {
            'fields': (
                'long_term_provisions',
                'long_term_debt',
                'provision_for_risks_and_charges',
                'deferred_liabilities',
                'derivative_product_liabilities',
                'other_non_current_liabilities',
                'total_non_current_liabilities'
            )
        }),
        ('Total Liabilities', {
            'fields': ('total_liabilities',)
        }),
        ("Shareholders' Equity", {
            'fields': (
                'common_stock',
                'retained_earnings',
                'other_shareholders_equity',
                'total_shareholders_equity',
                'additional_paid_in_capital',
                'treasury_stock',
                'minority_interest'
            )
        })
    )

@admin.register(FinancialRatios)
class FinancialRatiosAdmin(admin.ModelAdmin):
    list_display = (
        'entity',
        'date',
        'scenario',
        'current_ratio',
        'debt_to_equity_ratio',
        'return_on_equity',
        'gross_profit_margin'
    )
    list_filter = (
        'scenario',
        'year',
        'quarter',
        'semester',
        'month',
        'full_year'
    )
    search_fields = ('entity__name', 'notes')
    raw_id_fields = ('entity',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'entity',
                'year',
                'quarter',
                'semester',
                'month',
                'full_year',
                'scenario',
                'date'
            )
        }),
        ('Liquidity Ratios', {
            'fields': (
                'current_ratio',
                'quick_ratio',
                'cash_ratio',
                'operating_cash_flow_ratio'
            )
        }),
        ('Solvency Ratios', {
            'fields': (
                'debt_to_equity_ratio',
                'debt_to_assets_ratio',
                'interest_coverage_ratio',
                'debt_service_coverage_ratio'
            )
        }),
        ('Profitability Ratios', {
            'fields': (
                'gross_profit_margin',
                'operating_profit_margin',
                'net_profit_margin',
                'ebitda_margin',
                'return_on_assets',
                'return_on_equity',
                'return_on_invested_capital'
            )
        }),
        ('Efficiency Ratios', {
            'fields': (
                'asset_turnover_ratio',
                'inventory_turnover_ratio',
                'receivables_turnover_ratio',
                'days_sales_outstanding',
                'days_inventory_outstanding',
                'days_payables_outstanding'
            )
        }),
        ('Investment Ratios', {
            'fields': (
                'earnings_per_share',
                'price_earnings_ratio',
                'dividend_yield',
                'dividend_payout_ratio',
                'book_value_per_share'
            )
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        })
    )

# =============================================================================
# METRICS & KPIs
# =============================================================================

@admin.register(RevenueMetrics)
class RevenueMetricsAdmin(admin.ModelAdmin):
    list_display = (
        'entity',
        'date',
        'scenario',
        'recurring_revenue',
        'non_recurring_revenue',
        'revenue_growth_rate',
        'arr',
        'mrr'
    )
    list_filter = (
        'scenario',
        'year',
        'quarter',
        'semester',
        'month',
        'full_year'
    )
    search_fields = ('entity__name', 'notes')
    raw_id_fields = ('entity',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'entity',
                'year',
                'quarter',
                'semester',
                'month',
                'full_year',
                'scenario',
                'date'
            )
        }),
        ('Core Revenue Metrics', {
            'fields': (
                'recurring_revenue',
                'non_recurring_revenue',
                'revenue_growth_rate'
            )
        }),
        ('Revenue Breakdown', {
            'fields': (
                'existing_customer_existing_seats_revenue',
                'existing_customer_additional_seats_revenue',
                'new_customer_new_seats_revenue',
                'discounts_and_refunds'
            )
        }),
        ('SaaS Metrics', {
            'fields': (
                'arr',
                'mrr'
            )
        }),
        ('Customer Metrics', {
            'fields': (
                'average_revenue_per_customer',
                'average_contract_value'
            )
        }),
        ('Retention Metrics', {
            'fields': (
                'revenue_churn_rate',
                'net_revenue_retention',
                'gross_revenue_retention'
            )
        }),
        ('Cohort Analysis', {
            'fields': (
                'growth_rate_cohort_1',
                'growth_rate_cohort_2',
                'growth_rate_cohort_3'
            ),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        })
    )

@admin.register(CustomerMetrics)
class CustomerMetricsAdmin(admin.ModelAdmin):
    list_display = (
        'entity',
        'date',
        'scenario',
        'total_customers',
        'new_customers',
        'churned_customers',
        'customer_growth_rate'
    )
    list_filter = (
        'scenario',
        'year',
        'quarter',
        'semester',
        'month',
        'full_year'
    )
    search_fields = ('entity__name', 'notes')
    raw_id_fields = ('entity',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'entity',
                'year',
                'quarter',
                'semester',
                'month',
                'full_year',
                'scenario',
                'date'
            )
        }),
        ('Customer Counts', {
            'fields': (
                'total_customers',
                'new_customers',
                'churned_customers'
            )
        }),
        ('User Metrics', {
            'fields': (
                'total_users',
                'active_users',
                'total_monthly_active_client_users'
            )
        }),
        ('User Breakdown', {
            'fields': (
                'existing_customer_existing_seats_users',
                'existing_customer_additional_seats_users',
                'new_customer_new_seats_users',
                'user_growth_rate'
            )
        }),
        ('Market Metrics', {
            'fields': (
                'new_customer_total_addressable_seats',
                'new_customer_new_seats_percent_signed',
                'new_customer_total_addressable_seats_remaining'
            )
        }),
        ('Customer Segments', {
            'fields': (
                'existing_customer_count',
                'existing_customer_expansion_count',
                'new_customer_count'
            )
        }),
        ('Growth & Acquisition', {
            'fields': (
                'customer_growth_rate',
                'cac',
                'ltv',
                'ltv_cac_ratio',
                'payback_period'
            )
        }),
        ('Retention & Efficiency', {
            'fields': (
                'customer_churn_rate',
                'customer_acquisition_efficiency',
                'sales_efficiency'
            )
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        })
    )

@admin.register(OperationalMetrics)
class OperationalMetricsAdmin(admin.ModelAdmin):
    list_display = (
        'entity',
        'date',
        'scenario',
        'burn_rate',
        'runway_months',
        'burn_multiple',
        'rule_of_40'
    )
    list_filter = (
        'scenario',
        'year',
        'quarter',
        'semester',
        'month',
        'full_year'
    )
    search_fields = ('entity__name', 'notes')
    raw_id_fields = ('entity',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'entity',
                'year',
                'quarter',
                'semester',
                'month',
                'full_year',
                'scenario',
                'date'
            )
        }),
        ('Cash Metrics', {
            'fields': (
                'burn_rate',
                'runway_months',
                'runway_gross',
                'runway_net'
            )
        }),
        ('Efficiency Metrics', {
            'fields': (
                'burn_multiple',
                'rule_of_40'
            )
        }),
        ('Unit Economics', {
            'fields': (
                'gross_margin',
                'contribution_margin'
            )
        }),
        ('Productivity Metrics', {
            'fields': (
                'revenue_per_employee',
                'profit_per_employee'
            )
        }),
        ('Investment Performance', {
            'fields': (
                'capital_efficiency',
                'cash_conversion_cycle'
            )
        }),
        ('Operating Metrics', {
            'fields': (
                'capex',
                'ebitda',
                'total_costs'
            )
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        })
    )

@admin.register(TeamMetrics)
class TeamMetricsAdmin(admin.ModelAdmin):
    list_display = (
        'entity',
        'date',
        'scenario',
        'total_employees',
        'full_time_employees',
        'employee_growth_rate'
    )
    list_filter = (
        'scenario',
        'year',
        'quarter',
        'semester',
        'month',
        'full_year'
    )
    search_fields = ('entity__name', 'notes')
    raw_id_fields = ('entity',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'entity',
                'year',
                'quarter',
                'semester',
                'month',
                'full_year',
                'scenario',
                'date'
            )
        }),
        ('Headcount', {
            'fields': (
                'total_employees',
                'full_time_employees',
                'part_time_employees',
                'contractors'
            )
        }),
        ('Department Breakdown', {
            'fields': (
                'number_of_management',
                'number_of_sales_marketing_staff',
                'number_of_research_development_staff',
                'number_of_customer_service_support_staff',
                'number_of_general_staff'
            )
        }),
        ('Growth & Efficiency', {
            'fields': (
                'employee_growth_rate',
                'employee_turnover_rate',
                'average_tenure_months'
            )
        }),
        ('Staff Costs', {
            'fields': (
                'management_costs',
                'sales_marketing_staff_costs',
                'research_development_staff_costs',
                'customer_service_support_staff_costs',
                'general_staff_costs',
                'staff_costs_total'
            )
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        })
    )

@admin.register(KPI)
class KPIAdmin(admin.ModelAdmin):
    list_display = ('entity', 'name', 'data_type', 'is_calculated')
    list_filter = ('data_type', 'is_calculated')
    search_fields = ('name', 'entity__name')
    filter_horizontal = ('components',)
    raw_id_fields = ('entity',)

@admin.register(KPIValue)
class KPIValueAdmin(admin.ModelAdmin):
    list_display = ('kpi', 'date', 'scenario', 'value')
    list_filter = ('scenario', 'year', 'quarter', 'semester', 'month', 'full_year')
    search_fields = ('kpi__name',)
    raw_id_fields = ('kpi',)

# =============================================================================
# INVESTMENT & PORTFOLIO
# =============================================================================

@admin.register(DealPipeline)
class DealPipelineAdmin(admin.ModelAdmin):
    list_display = ('name', 'entity', 'priority', 'status', 'round_type', 'target_raise')
    list_filter = ('status', 'priority', 'round_type', 'sector')
    search_fields = ('name', 'entity__name')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Core Details', {
            'fields': ('entity', 'name', 'priority', 'status', 'round_type', 'sector')
        }),
        ('Investment Details', {
            'fields': ('target_raise', 'pre_money_valuation', 'post_money_valuation',
                      'expected_ownership', 'investment_amount', 'is_lead_investor', 'other_investors')
        }),
        ('Timeline', {
            'fields': ('first_contact_date', 'last_interaction_date', 
                      'next_meeting_date', 'expected_close_date')
        }),
        ('Materials', {
            'fields': ('pitch_deck', 'financial_model', 'data_room_link')
        }),
        ('Analysis', {
            'fields': ('investment_thesis', 'key_risks', 'due_diligence_notes', 
                      'next_steps', 'comments')
        }),
        ('Tracking', {
            'fields': ('assigned_to',)
        })
    )

@admin.register(PortfolioInvestment)
class PortfolioInvestmentAdmin(admin.ModelAdmin):
    list_display = [
        'investment_name',
        'entity',
        'sector',
        'investment_type',
        'investment_round',
        'investment_status',
        'listing_status',
        'total_investment_amount',
        'current_fair_value',
        'moic',
        'irr'
    ]
    list_filter = [
        'sector',
        'investment_type',
        'investment_round',
        'investment_status',
        'listing_status',
        'entity_type'
    ]
    search_fields = ['investment_name', 'entity__name', 'stock_ticker']
    raw_id_fields = ['entity', 'funding_round']
    
    fieldsets = (
        ('Core Investment Fields', {
            'fields': (
                'entity',
                'funding_round',
                'investment_name',
                'entity_type',
                'investment_type',
                'investment_round',
                'investment_status',
                'sector',
                'listing_status',
                'original_investment_date'
            )
        }),
        ('Investment Amounts & Ownership', {
            'fields': (
                'total_investment_amount',
                'ownership_percentage',
                'invested_as_percent_capital'
            )
        }),
        ('Share & Price Information', {
            'fields': (
                'number_of_shares',
                'average_cost_per_share',
                'current_share_price',
                'share_price_updated_at'
            ),
            'classes': ('collapse',)
        }),
        ('Public Company Information', {
            'fields': (
                'stock_ticker',
                'exchange'
            ),
            'classes': ('collapse',)
        }),
        ('Performance Metrics', {
            'fields': (
                'current_fair_value',
                'moic',
                'irr'
            )
        }),
        ('Additional Settings', {
            'fields': ('export_functionality',),
            'classes': ('collapse',)
        })
    )

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.listing_status == 'public':
            return ['current_fair_value', 'moic', 'irr']
        return []

@admin.register(PortfolioPerformance)
class PortfolioPerformanceAdmin(admin.ModelAdmin):
    list_display = [
        'entity',
        'funding_round',
        'report_date',
        'total_invested_amount',
        'fair_value',
        'cash_realized',
        'tvpi',
        'dpi',
        'rvpi',
        'irr',
        'multiple_to_cost'
    ]
    list_filter = ['entity', 'funding_round', 'report_date']
    search_fields = ['entity__name', 'funding_round__name']
    raw_id_fields = ['entity', 'funding_round']
    date_hierarchy = 'report_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('entity', 'funding_round', 'report_date')
        }),
        ('Performance Metrics', {
            'fields': (
                'total_invested_amount',
                'fair_value',
                'cash_realized',
                'tvpi',
                'dpi',
                'rvpi',
                'irr',
                'multiple_to_cost'
            )
        })
    )

@admin.register(NAV)
class NAVAdmin(admin.ModelAdmin):
    list_display = ('entity', 'funding_round', 'date', 'nav_value')
    list_filter = ('date', 'entity', 'funding_round')
    search_fields = ('entity__name', 'funding_round__name', 'notes')
    raw_id_fields = ('entity', 'funding_round')
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('entity', 'funding_round', 'date', 'nav_value', 'notes')
        }),
    )

@admin.register(Fee)
class FeeAdmin(admin.ModelAdmin):
    list_display = ('entity', 'fee_type', 'amount', 'frequency', 'date')
    list_filter = ('fee_type', 'frequency', 'year', 'quarter', 'semester', 'month', 'full_year')
    search_fields = ('entity__name',)
    raw_id_fields = ('entity',)

@admin.register(PortfolioCashFlow)
class PortfolioCashFlowAdmin(admin.ModelAdmin):
    list_display = [
        'portfolio_investment',
        'entity',
        'date',
        'type',
        'category',
        'amount',
        'is_included_in_irr'
    ]
    list_filter = [
        'type',
        'category',
        'is_included_in_irr',
        'date'
    ]
    search_fields = [
        'portfolio_investment__investment_name',
        'entity__name',
        'description'
    ]
    raw_id_fields = [
        'portfolio_investment',
        'entity',
        'funding_round',
        'cash_transaction'
    ]
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Core Details', {
            'fields': (
                'portfolio_investment',
                'entity',
                'funding_round',
                'date'
            )
        }),
        ('Cash Flow Information', {
            'fields': (
                'amount',
                'type',
                'category',
                'is_included_in_irr'
            )
        }),
        ('Additional Information', {
            'fields': (
                'cash_transaction',
                'description'
            ),
            'classes': ('collapse',)
        })
    )

# =============================================================================
# DEAL INFORMATION & PROFILES
# =============================================================================

@admin.register(EntityDealProfile)
class EntityDealProfileAdmin(admin.ModelAdmin):
    list_display = ('entity', 'entity_type', 'industry', 'location', 'current_valuation')
    list_filter = ('entity_type', 'industry', 'location')
    search_fields = ('entity__name', 'industry', 'short_description')
    raw_id_fields = ('entity',)
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('entity', 'entity_type', 'industry', 'location', 'website', 'year_founded')
        }),
        ('Financial Overview', {
            'fields': ('current_valuation', 'latest_raise_amount', 'total_raised')
        }),
        ('Company Details', {
            'fields': ('stage', 'short_description', 'problem_description', 'solution_description',
                      'how_it_works', 'market_size', 'competitors', 'competitive_advantage', 'growth_metrics'),
            'classes': ('collapse',)
        }),
        ('Fund Details', {
            'fields': ('investment_strategy', 'fund_size', 'fund_terms', 'track_record',
                      'fund_type', 'investment_focus', 'fund_lifecycle', 'vintage_year'),
            'classes': ('collapse',)
        }),
        ('M&A Details', {
            'fields': ('synergy_potential', 'key_assets', 'market_position', 'integration_plan',
                      'acquisition_rationale', 'financial_metrics', 'risk_factors', 'deal_readiness'),
            'classes': ('collapse',)
        })
    )

@admin.register(DealProfileMember)
class DealProfileMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'deal_profile', 'role', 'position', 'order')
    list_filter = ('role',)
    search_fields = ('name', 'deal_profile__entity__name', 'position')
    raw_id_fields = ('deal_profile',)
    ordering = ('order', 'role', 'name')

@admin.register(DealProfileRelationship)
class DealProfileRelationshipAdmin(admin.ModelAdmin):
    list_display = ('name', 'deal_profile', 'relationship_type', 'start_date', 'order')
    list_filter = ('relationship_type',)
    search_fields = ('name', 'deal_profile__entity__name', 'description')
    raw_id_fields = ('deal_profile',)
    ordering = ('order', 'name')

# =============================================================================
# CAP TABLE
# =============================================================================

@admin.register(CapTableSnapshot)
class CapTableSnapshotAdmin(admin.ModelAdmin):
    list_display = ('entity', 'date', 'created_at')
    list_filter = ('date',)
    search_fields = ('entity__name',)
    raw_id_fields = ('entity',)
    date_hierarchy = 'date'

@admin.register(CapTableEntry)
class CapTableEntryAdmin(admin.ModelAdmin):
    list_display = ('stakeholder', 'security', 'number_of_shares', 'ownership_percentage')
    list_filter = ('snapshot__entity', 'security')
    search_fields = ('stakeholder__name', 'security__name')
    raw_id_fields = ('snapshot', 'stakeholder', 'security', 'funding_round')
