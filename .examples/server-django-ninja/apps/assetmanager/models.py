from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.accounts.models import Organization, User
from datetime import datetime
import numpy as np


# =============================================================================
# CORE MODELS
# =============================================================================

class Entity(models.Model):
    """
    Core model representing any financial entity (company or fund).
    - Can be a traditional company or a fund
    - Can raise money from other entities
    - Can invest in other entities
    - Has its own financials and KPIs
    - Can have a parent entity (e.g., a portfolio company has a fund as parent)
    - Belongs to an organization that controls access
    - Ownership structure tracked through OwnershipSnapshot
    """
    
    class EntityTypes(models.TextChoices):
        FUND = 'fund', 'Investment Fund'
        COMPANY = 'company', 'Company'
        INDIVIDUAL = 'individual', 'Individual'
    
    name = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=20, choices=EntityTypes.choices)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='assets')
    current_valuation = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='entities')
    cash_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_entity_type_display()})"
    
    def calculate_nav(self):
        """Calculate NAV based on assets and financials"""
        nav = self.cash_balance
        for asset in self.assets.all():
            latest_financials = asset.financial_statements.order_by('-statement_date').first()
            if latest_financials:
                nav += latest_financials.total_assets - latest_financials.total_liabilities
        return nav

    class Meta:
        verbose_name = "Entity"
        verbose_name_plural = "Entities"


class EntityOrganizationMember(models.Model):
    """
    Links organizations to entities with specific roles.
    
    This model enables organization-level access to entities:
    - An organization can have one role per entity
    - Roles determine what actions organization members can perform
    - Similar structure to OrganizationMember for consistency
    """
    class RoleTypes(models.TextChoices):
        OWNER = 'OWNER', 'Owner'
        ADMIN = 'ADMIN', 'Admin'
        EDITOR = 'EDITOR', 'Editor'
        VIEWER = 'VIEWER', 'Viewer'
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='entity_memberships')
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='entity_organization_members')
    role = models.CharField(max_length=50, choices=RoleTypes.choices, default=RoleTypes.VIEWER)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['organization', 'entity']
        verbose_name = "Entity Organization Member"
        verbose_name_plural = "Entity Organization Members"
    
    def __str__(self):
        return f"{self.organization.name} - {self.entity.name} ({self.get_role_display()})"


class EntityOrganizationInvitation(models.Model):
    """
    Invitation system for entity-organization access.
    
    Allows entities to invite organizations to access entity data.
    """
    class StatusTypes(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='organization_invitations')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='entity_invitations')
    role = models.CharField(max_length=50, choices=EntityOrganizationMember.RoleTypes.choices, 
                          default=EntityOrganizationMember.RoleTypes.VIEWER)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_entity_organization_invitations')
    invited_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=StatusTypes.choices, default=StatusTypes.PENDING)
    
    def __str__(self):
        return f"{self.entity.name} invited {self.organization.name} ({self.get_role_display()})"
    
    class Meta:
        verbose_name = "Entity Organization Invitation"
        verbose_name_plural = "Entity Organization Invitations"

class Stakeholder(models.Model):
    """
    Represents any party with a stake in an entity.
    - Can be investors (LPs), fund managers (GPs), employees, etc.
    - Can also be a Syndicate (through inheritance)
    """
    class StakeholderTypes(models.TextChoices):
        GENERAL_PARTNER = 'general_partner', 'General Partner (GP)'
        LIMITED_PARTNER = 'limited_partner', 'Limited Partner (LP)'
        EMPLOYEE = 'employee', 'Employee'
        ADVISOR = 'advisor', 'Advisor'
        FOUNDER = 'founder', 'Founder'
        ENTITY = 'entity', 'Entity Investor'
        SYNDICATE = 'syndicate', 'Syndicate'
        OTHER = 'other', 'Other'
    
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=StakeholderTypes.choices)
    entity = models.ForeignKey(Entity, null=True, blank=True, on_delete=models.SET_NULL, related_name='stakeholders')
    
    # Investment Rights
    carried_interest_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="For GP, percentage after LP return")
    preferred_return_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="LP's hurdle rate")
    distribution_tier = models.IntegerField(default=1, help_text="Distribution waterfall order")
    
    # Governance Rights
    board_seats = models.IntegerField(default=0)
    voting_rights = models.BooleanField(default=True)
    pro_rata_rights = models.BooleanField(default=False)
    drag_along = models.BooleanField(default=False)
    tag_along = models.BooleanField(default=False)
    observer_rights = models.BooleanField(default=False)
    
    # Investment Terms
    minimum_investment = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    maximum_investment = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
    
    class Meta:
        verbose_name = "Stakeholder"
        verbose_name_plural = "Stakeholders"


class Syndicate(Stakeholder):
    """
    A syndicate is a type of stakeholder representing a group.
    Inherits from Stakeholder for basic stakeholder properties.
    """
    lead_investor = models.ForeignKey(
        Stakeholder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_syndicates'
    )
    
    class Meta:
        verbose_name = "Syndicate"
        verbose_name_plural = "Syndicates"
    
    def __str__(self):
        return f"Syndicate: {self.name}"


class SyndicateMember(models.Model):
    """
    Represents a member's participation in a syndicate.
    """
    syndicate = models.ForeignKey(Syndicate, on_delete=models.CASCADE, related_name='memberships')
    member = models.ForeignKey(Stakeholder, on_delete=models.CASCADE, related_name='syndicate_memberships')
    ownership_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    investment_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    joined_date = models.DateField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Syndicate Member"
        verbose_name_plural = "Syndicate Members"
        unique_together = ['syndicate', 'member']
    
    def __str__(self):
        return f"{self.member.name} - {self.ownership_percentage}% in {self.syndicate.name}"


# =============================================================================
# FUNDRAISING & DEAL HISTORY
# =============================================================================

class FundingRound(models.Model):
    """
    Historical record of a completed fundraising round.
    Tracks investment terms, valuations, documents,
    and securities issued. Links to cap table changes
    and stakeholder transactions.
    """
    class RoundTypes(models.TextChoices):
        SEED = 'seed', 'Seed'
        ANGEL = 'angel', 'Angel'
        SERIES_A = 'series_a', 'Series A'
        SERIES_B = 'series_b', 'Series B'
        SERIES_C = 'series_c', 'Series C'
        SERIES_D = 'series_d', 'Series D'
        PRIVATE = 'private', 'Private'
        PUBLIC = 'public', 'Public'
        SAFE = 'safe', 'SAFE'
        OTHER = 'other', 'Other'
    
    # Core fields
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='funding_rounds')
    name = models.CharField(max_length=255, help_text="Custom round name e.g. 'Seed II', 'Pre-Series A'")
    round_type = models.CharField(max_length=20, choices=RoundTypes.choices)
    date = models.DateField()

    # Investment terms
    target_amount = models.DecimalField(max_digits=15, decimal_places=2)
    raised_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    pre_money_valuation = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    post_money_valuation = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_round_type_display()} - {self.entity.name}"
    
    class Meta:
        verbose_name = "Funding Round"
        verbose_name_plural = "Funding Rounds"


class Security(models.Model):
    """
    Securities are created for specific funding rounds.
    - Each round can issue different types of securities
    - Securities have round-specific terms and prices
    - Used to track ownership and transactions
    """
    class SecurityTypes(models.TextChoices):
        COMMON = 'common', 'Common Stock'
        PREFERRED = 'preferred', 'Preferred Stock'
        CONVERTIBLE = 'convertible', 'Convertible Note'
        SAFE = 'safe', 'Simple Agreement for Future Equity'
        WARRANT = 'warrant', 'Warrant'
        OPTION = 'option', 'Option'
        BOND = 'bond', 'Bond'
        VIRTUAL = 'virtual', 'Virtual Security'
    
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, related_name='securities')
    type = models.CharField(max_length=20, choices=SecurityTypes.choices)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.funding_round}"
    
    class Meta:
        verbose_name = "Security"
        verbose_name_plural = "Securities"


class SecurityStock(models.Model):
    """
    Stock-specific details including:
    - Common vs Preferred stock distinction
    - Liquidation preferences
    - Dividend rights
    - Conversion rights
    - Redemption rights
    - Voting rights
    - Anti-dilution protection
    """
    class AntiDilutionTypes(models.TextChoices):
        NONE = 'none', 'None'
        FULL_RATCHET = 'full_ratchet', 'Full Ratchet'
        WEIGHTED_AVERAGE = 'weighted_average', 'Weighted Average'
    
    security = models.OneToOneField(Security, on_delete=models.CASCADE, related_name='stock')
    
    # Common stock vs Preferred stock distinction
    is_preferred = models.BooleanField(default=False)
     
    # Liquidation preferences (for preferred stock)
    liquidation_preference = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    has_participation = models.BooleanField(default=False)
    participation_cap = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    seniority = models.IntegerField(default=1, help_text="Priority level in liquidation preferences")
    
    # Anti-dilution protection (for preferred stock)
    anti_dilution = models.CharField(max_length=50, choices=AntiDilutionTypes.choices, default=AntiDilutionTypes.NONE)
    
    # Dividend rights (for preferred stock)
    has_dividend_rights = models.BooleanField(default=False)
    dividend_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_dividend_cumulative = models.BooleanField(default=False)
    
    # Conversion rights (for preferred stock)
    has_conversion_rights = models.BooleanField(default=True)
    conversion_ratio = models.DecimalField(max_digits=10, decimal_places=4, default=1.0)
    
    # Redemption rights (often included with preferred stock)
    has_redemption_rights = models.BooleanField(default=False)
    redemption_term = models.IntegerField(null=True, blank=True, help_text="Redemption term in months")
    
    # Voting rights
    has_voting_rights = models.BooleanField(default=True)
    voting_ratio = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Stock details for {self.security}"
    
    class Meta:
        verbose_name = "Security Stock"
        verbose_name_plural = "Security Stocks"


class SecurityConvertible(models.Model):
    """Convertible note details"""
    security = models.OneToOneField(Security, on_delete=models.CASCADE, related_name='convertible')
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    maturity_date = models.DateField()
    valuation_cap = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    conversion_ratio = models.DecimalField(max_digits=10, decimal_places=4, default=1.0)
    
    def __str__(self):
        return f"Convertible details for {self.security}"
    
    class Meta:
        verbose_name = "Security Convertible"
        verbose_name_plural = "Security Convertibles"


class SecuritySAFE(models.Model):
    """
    Simple Agreement for Future Equity (SAFE) details.
    Represents a SAFE agreement with its specific terms.
    """
    security = models.OneToOneField(Security, on_delete=models.CASCADE, related_name='safe')
    
    # Core SAFE terms
    valuation_cap = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    discount_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    most_favored_nation = models.BooleanField(default=False)
    pro_rata_rights = models.BooleanField(default=False)
    
    # Additional terms
    conversion_trigger = models.TextField(help_text="Events that trigger conversion")
    post_money_valuation_cap = models.BooleanField(
        default=True,
        help_text="Whether the valuation cap is post-money (True) or pre-money (False)"
    )
    
    def __str__(self):
        return f"SAFE details for {self.security}"
    
    class Meta:
        verbose_name = "Security SAFE"
        verbose_name_plural = "Security SAFEs"


class SecurityOption(models.Model):
    """
    Option details including vesting schedule.
    Handles various types of option-based compensation:
    - Traditional Stock Options (ESOP)
    - Virtual Stock Options (VSOP)
    - Stock Appreciation Rights (SAR)
    """
    class OptionType(models.TextChoices):
        ESOP = 'esop', 'Employee Stock Option Plan'
        VSOP = 'vsop', 'Virtual Stock Option Plan'
        SAR = 'sar', 'Stock Appreciation Rights'
        OTHER = 'other', 'Other Option Type'

    security = models.OneToOneField(Security, on_delete=models.CASCADE, related_name='option')
    option_type = models.CharField(max_length=20, choices=OptionType.choices, default=OptionType.ESOP)
    
    # Exercise Terms
    expiration_date = models.DateField()
    exercise_price = models.DecimalField(max_digits=15, decimal_places=2)
    exercise_window_days = models.IntegerField(default=90)
    
    # Vesting Terms
    total_shares = models.DecimalField(max_digits=15, decimal_places=2)
    vesting_start = models.DateField()
    vesting_months = models.IntegerField(default=48)
    cliff_months = models.IntegerField(default=12)
    
    # Virtual/SAR specific fields
    is_virtual = models.BooleanField(
        default=False,
        help_text="Whether this is a virtual security (VSOP/SAR) that doesn't represent actual shares"
    )
    reference_price = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Reference price for virtual options/SAR value calculation"
    )
    settlement_type = models.CharField(
        max_length=20,
        choices=[
            ('cash', 'Cash Settlement'),
            ('shares', 'Share Settlement'),
            ('mixed', 'Mixed Settlement')
        ],
        default='cash',
        help_text="How the virtual security will be settled upon exercise"
    )
    
    # Pool/Plan Details
    pool_name = models.CharField(max_length=255, blank=True, help_text="Name of the option pool/plan")
    pool_size = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Total size of the option pool"
    )
    pool_available = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Remaining available options in the pool"
    )
    
    class VestingScheduleTypes(models.TextChoices):
        STANDARD = 'standard', 'Standard 4 Year with 1 Year Cliff'
        MONTHLY = 'monthly', 'Monthly Vesting'
        QUARTERLY = 'quarterly', 'Quarterly Vesting'
        CUSTOM = 'custom', 'Custom Schedule'
    
    vesting_schedule = models.CharField(max_length=20, choices=VestingScheduleTypes.choices, default=VestingScheduleTypes.STANDARD)
    
    # Status
    is_active = models.BooleanField(default=True)
    termination_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.get_option_type_display()} details for {self.security}"
    
    class Meta:
        verbose_name = "Security Option"
        verbose_name_plural = "Security Options"


class SecurityBond(models.Model):
    """Bond details"""
    class InterestFrequency(models.TextChoices):
        ANNUAL = 'annual', 'Annual'
        SEMI_ANNUAL = 'semi_annual', 'Semi-Annual'
        QUARTERLY = 'quarterly', 'Quarterly'
        MONTHLY = 'monthly', 'Monthly'
    
    security = models.OneToOneField(Security, on_delete=models.CASCADE, related_name='bond')
    face_value = models.DecimalField(max_digits=15, decimal_places=2)
    coupon_rate = models.DecimalField(max_digits=5, decimal_places=2)
    maturity_date = models.DateField()
    interest_frequency = models.CharField(max_length=20, choices=InterestFrequency.choices)
    
    def __str__(self):
        return f"Bond details for {self.security}"
    
    class Meta:
        verbose_name = "Security Bond"
        verbose_name_plural = "Security Bonds"


class SecurityTransaction(models.Model):
    """
    Double-entry security transaction tracking.
    - Records issuance, transfers, conversions with debit/credit entries
    - Each transaction should have matching entries (debits = credits)
    - Transaction reference groups related entries together
    """
    class SecurityTransactionTypes(models.TextChoices):
        ISSUANCE = 'issuance', 'Share Issuance'
        TRANSFER = 'transfer', 'Share Transfer'
        CONVERSION = 'conversion', 'Share Conversion'
        REDEMPTION = 'redemption', 'Share Redemption'
        SPLIT = 'split', 'Share Split'
        CONSOLIDATION = 'consolidation', 'Share Consolidation'
        GRANT = 'grant', 'Option Grant'
        VEST = 'vest', 'Shares Vested'
        EXERCISE = 'exercise', 'Option Exercise'
        EXPIRE = 'expire', 'Option Expiry'
    
    # Core relationships
    stakeholder = models.ForeignKey(Stakeholder, on_delete=models.CASCADE, related_name='security_transactions')
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, related_name='security_transactions')
    security = models.ForeignKey(Security, on_delete=models.CASCADE, related_name='security_transactions')
    
    # Transaction details
    transaction_reference = models.CharField(max_length=50, help_text="Groups related entries in a transaction")
    type = models.CharField(max_length=20, choices=SecurityTransactionTypes.choices)
    units_debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    units_credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    transaction_date = models.DateField()
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        movement = f"+{self.units_debit}" if self.units_debit > 0 else f"-{self.units_credit}"
        return f"{self.get_type_display()}: {self.stakeholder.name} {movement} units of {self.security.name}"
    
    class Meta:
        verbose_name = "Security Transaction"
        verbose_name_plural = "Security Transactions"


class CashTransaction(models.Model):
    """
    Double-entry cash transaction tracking.
    - Records all money movements with debit/credit entries
    - Each transaction should have matching entries (debits = credits)
    - Transaction reference groups related entries together
    """
    class CashTransactionTypes(models.TextChoices):
        CAPITAL_CALL = 'capital_call', 'Capital Call'
        CASH_IN = 'cash_in', 'Cash In'
        CASH_OUT = 'cash_out', 'Cash Out'
        DISTRIBUTION = 'distribution', 'Distribution'
        BOND_INTEREST = 'bond_interest', 'Bond Interest Payment'
        BOND_MATURITY = 'bond_maturity', 'Bond Maturity Payment'
    
    # Core relationships
    stakeholder = models.ForeignKey(Stakeholder, on_delete=models.CASCADE, related_name='cash_transactions')
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, related_name='cash_transactions')
    security = models.ForeignKey(Security, on_delete=models.CASCADE, related_name='cash_transactions', 
                               null=True, blank=True)
    
    # Transaction details
    transaction_reference = models.CharField(max_length=50, help_text="Groups related entries in a transaction")
    type = models.CharField(max_length=20, choices=CashTransactionTypes.choices)
    amount_debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    amount_credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    transaction_date = models.DateField()
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        movement = f"+{self.amount_debit}" if self.amount_debit > 0 else f"-{self.amount_credit}"
        return f"{self.get_type_display()}: {self.stakeholder.name} {movement}"
    
    class Meta:
        verbose_name = "Cash Transaction"
        verbose_name_plural = "Cash Transactions"


class CapTableSnapshot(models.Model):
    """
    Point-in-time snapshot of entity cap table.
    - Calculated from Transaction history
    - Shows complete ownership structure at a given date
    - Used for reporting and analysis
    - Generated periodically or on-demand
    - Serves as the official cap table for the entity
    - Tracks dilution across funding rounds
    - Shows ownership by security type (common, preferred, etc.)
    - Used for investor reporting and compliance
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='cap_table_snapshots')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        verbose_name = "Cap Table Snapshot"
        verbose_name_plural = "Cap Table Snapshots"
    
    def __str__(self):
        return f"Cap Table Snapshot - {self.entity.name} ({self.date})"


class CapTableEntry(models.Model):
    """
    Individual entries in a cap table snapshot.
    - Details each stakeholder's ownership
    - Links to specific securities and funding rounds
    - Records both percentage and absolute ownership
    - Part of the cap table system
    - Tracks ownership by investment round
    - Shows fully-diluted ownership
    - Includes options and warrants for fully-diluted cap table
    - Maintains historical record of ownership changes
    """
    snapshot = models.ForeignKey(CapTableSnapshot, on_delete=models.CASCADE, related_name='entries')
    security = models.ForeignKey(Security, on_delete=models.CASCADE)
    stakeholder = models.ForeignKey(Stakeholder, on_delete=models.CASCADE)
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, related_name='cap_table_entries', null=True, blank=True)
    ownership_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    number_of_shares = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.stakeholder.name} - {self.security.get_type_display()}"
    
    class Meta:
        verbose_name = "Cap Table Entry"
        verbose_name_plural = "Cap Table Entries"


# =============================================================================
# TIME DIMENSION CHOICES
# =============================================================================
class QuarterChoices(models.TextChoices):
    Q1 = 'Q1', 'Q1'
    Q2 = 'Q2', 'Q2'
    Q3 = 'Q3', 'Q3'
    Q4 = 'Q4', 'Q4'

class SemesterChoices(models.TextChoices):
    S1 = 'S1', 'S1'
    S2 = 'S2', 'S2'

class MonthChoices(models.TextChoices):
    JANUARY = 'January', 'January'
    FEBRUARY = 'February', 'February'
    MARCH = 'March', 'March'
    APRIL = 'April', 'April'
    MAY = 'May', 'May'
    JUNE = 'June', 'June'
    JULY = 'July', 'July'
    AUGUST = 'August', 'August'
    SEPTEMBER = 'September', 'September'
    OCTOBER = 'October', 'October'
    NOVEMBER = 'November', 'November'
    DECEMBER = 'December', 'December'

class FinancialScenario(models.TextChoices):
    """Common scenario types for all financial data"""
    ACTUAL = 'actual', 'Actual'
    FORECAST = 'forecast', 'Forecast'
    BUDGET = 'budget', 'Budget'


# =============================================================================
# FINANCIAL STATEMENTS
# =============================================================================

class IncomeStatement(models.Model):
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
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='income_statements')

    # Detailed time dimensions
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QuarterChoices.choices, null=True, blank=True)
    semester = models.CharField(max_length=2, choices=SemesterChoices.choices, null=True, blank=True)
    month = models.CharField(max_length=9, choices=MonthChoices.choices, null=True, blank=True)
    full_year = models.BooleanField(default=False)
    scenario = models.CharField(max_length=20, choices=FinancialScenario.choices, default=FinancialScenario.ACTUAL)

    # Period dimensions
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    
    # Revenue section
    revenue = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    cost_of_goods = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    gross_profit = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Operating expenses
    research_and_development = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    selling_general_and_administrative = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_operating_expenses = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Results
    operating_income = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    non_operating_interest_income = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    non_operating_interest_expense = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_income_expense = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    pretax_income = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    income_tax = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    net_income = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Additional metrics
    eps_basic = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    eps_diluted = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    basic_shares_outstanding = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    diluted_shares_outstanding = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    ebitda = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    net_income_continuous_operations = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    minority_interests = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    preferred_stock_dividends = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-period_end']
        verbose_name = "Income Statement"
        verbose_name_plural = "Income Statements"
        unique_together = ['entity', 'period_start', 'period_end', 'scenario']
    
    def __str__(self):
        return f"Income Statement for {self.entity.name} ({self.period_start} - {self.period_end})"


class CashFlowStatement(models.Model):
    """
    Cash Flow Statement.
    
    Tracks cash movements across:
    - Operating activities (net income, depreciation, working capital)
    - Investing activities (capital expenditures, investments)
    - Financing activities (debt, equity, dividends)
    
    Includes detailed breakdown of cash sources and uses within each category,
    as well as summary metrics like free cash flow and end cash position.
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='cash_flow_statements')

    # Detailed time dimensions
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QuarterChoices.choices, null=True, blank=True)
    semester = models.CharField(max_length=2, choices=SemesterChoices.choices, null=True, blank=True)
    month = models.CharField(max_length=9, choices=MonthChoices.choices, null=True, blank=True)
    full_year = models.BooleanField(default=False)
    scenario = models.CharField(max_length=20, choices=FinancialScenario.choices, default=FinancialScenario.ACTUAL)

    # Period dimensions
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    
    # Operating activities
    net_income = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    depreciation = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    deferred_taxes = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    stock_based_compensation = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_non_cash_items = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    accounts_receivable = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    accounts_payable = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_assets_liabilities = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    operating_cash_flow = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Investing activities
    capital_expenditures = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    net_intangibles = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    net_acquisitions = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    purchase_of_investments = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    sale_of_investments = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_investing_activity = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    investing_cash_flow = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Financing activities
    long_term_debt_issuance = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    long_term_debt_payments = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    short_term_debt_issuance = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    common_stock_issuance = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    common_stock_repurchase = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    common_dividends = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_financing_charges = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    financing_cash_flow = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Summary
    end_cash_position = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    income_tax_paid = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    interest_paid = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    free_cash_flow = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-period_end']
        verbose_name = "Cash Flow Statement"
        verbose_name_plural = "Cash Flow Statements"
        unique_together = ['entity', 'period_start', 'period_end', 'scenario']
    
    def __str__(self):
        return f"Cash Flow Statement for {self.entity.name} ({self.period_start} - {self.period_end})"


class BalanceSheet(models.Model):
    """
    Balance Sheet.
    
    Provides a snapshot of an entity's financial position at a specific point in time,
    detailing:
    - Current assets (cash, receivables, inventory)
    - Non-current assets (property, equipment, investments)
    - Current liabilities (payables, short-term debt)
    - Non-current liabilities (long-term debt, provisions)
    - Shareholders' equity (common stock, retained earnings)
    
    Follows standard accounting equation: Assets = Liabilities + Equity
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='balance_sheets')

    # Detailed time dimensions
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QuarterChoices.choices, null=True, blank=True)
    semester = models.CharField(max_length=2, choices=SemesterChoices.choices, null=True, blank=True)
    month = models.CharField(max_length=9, choices=MonthChoices.choices, null=True, blank=True)
    full_year = models.BooleanField(default=False)
    scenario = models.CharField(max_length=20, choices=FinancialScenario.choices, default=FinancialScenario.ACTUAL)

    # Period dimension
    date = models.DateField(null=True, blank=True)
    
    # Current Assets
    cash = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    cash_equivalents = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    cash_and_cash_equivalents = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_short_term_investments = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    accounts_receivable = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_receivables = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    inventory = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    prepaid_assets = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    restricted_cash = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    assets_held_for_sale = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    hedging_assets = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_current_assets = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    total_current_assets = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Non-current Assets
    properties = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    land_and_improvements = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    machinery_furniture_equipment = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    construction_in_progress = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    leases = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    accumulated_depreciation = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    goodwill = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    investment_properties = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    financial_assets = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    intangible_assets = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    investments_and_advances = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_non_current_assets = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    total_non_current_assets = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Total Assets
    total_assets = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Current Liabilities
    accounts_payable = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    accrued_expenses = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    short_term_debt = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    deferred_revenue = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    tax_payable = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    pensions = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_current_liabilities = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    total_current_liabilities = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Non-current Liabilities
    long_term_provisions = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    long_term_debt = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    provision_for_risks_and_charges = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    deferred_liabilities = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    derivative_product_liabilities = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_non_current_liabilities = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    total_non_current_liabilities = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Total Liabilities
    total_liabilities = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Shareholders' Equity
    common_stock = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    retained_earnings = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    other_shareholders_equity = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    total_shareholders_equity = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    additional_paid_in_capital = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    treasury_stock = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    minority_interest = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['entity', 'date', 'scenario']
        verbose_name = "Balance Sheet"
        verbose_name_plural = "Balance Sheets"
    
    def __str__(self):
        return f"Balance Sheet for {self.entity.name} on {self.date}"


class FinancialRatios(models.Model):
    """
    Financial Ratios for comprehensive financial analysis.
    
    Includes multiple categories of financial ratios:
    - Liquidity ratios: Measure ability to meet short-term obligations
    - Solvency ratios: Measure long-term financial stability
    - Profitability ratios: Measure ability to generate profit
    - Efficiency ratios: Measure how effectively assets are used
    - Investment ratios: Measure investment performance
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='financial_ratios')
    
    # Detailed time dimensions
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QuarterChoices.choices, null=True, blank=True)
    semester = models.CharField(max_length=2, choices=SemesterChoices.choices, null=True, blank=True)
    month = models.CharField(max_length=9, choices=MonthChoices.choices, null=True, blank=True)
    full_year = models.BooleanField(default=False)
    scenario = models.CharField(max_length=20, choices=FinancialScenario.choices, default=FinancialScenario.ACTUAL)

    # Period dimension
    date = models.DateField(null=True, blank=True)

    # Liquidity ratios
    current_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    quick_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    cash_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    operating_cash_flow_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    
    # Solvency ratios
    debt_to_equity_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    debt_to_assets_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    interest_coverage_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    debt_service_coverage_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    
    # Profitability ratios
    gross_profit_margin = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    operating_profit_margin = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    net_profit_margin = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    ebitda_margin = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    return_on_assets = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    return_on_equity = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    return_on_invested_capital = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Efficiency ratios
    asset_turnover_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    inventory_turnover_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    receivables_turnover_ratio = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    days_sales_outstanding = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    days_inventory_outstanding = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    days_payables_outstanding = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Investment ratios
    earnings_per_share = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    price_earnings_ratio = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    dividend_yield = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    dividend_payout_ratio = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    book_value_per_share = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    
    # Notes
    notes = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['entity', 'date', 'scenario']
        verbose_name = "Financial Ratios"
        verbose_name_plural = "Financial Ratios"
    
    def __str__(self):
        return f"Ratios for {self.entity.name} on {self.date}"

# =============================================================================
# METRICS & KPIs
# =============================================================================

class RevenueMetrics(models.Model):
    """
    Revenue Metrics.
    
    Captures various revenue-related metrics including:
    - Recurring vs non-recurring revenue
    - Growth rates and trends
    - Customer-level metrics
    - SaaS-specific metrics like ARR and MRR
    - Retention and expansion metrics
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='revenue_metrics')
    
    # Detailed time dimensions
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QuarterChoices.choices, null=True, blank=True)
    semester = models.CharField(max_length=2, choices=SemesterChoices.choices, null=True, blank=True)
    month = models.CharField(max_length=9, choices=MonthChoices.choices, null=True, blank=True)
    full_year = models.BooleanField(default=False)
    scenario = models.CharField(max_length=20, choices=FinancialScenario.choices, default=FinancialScenario.ACTUAL)

    # Period dimension
    date = models.DateField(null=True, blank=True)
    
    # Core revenue metrics
    recurring_revenue = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    non_recurring_revenue = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    revenue_growth_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Revenue breakdown
    existing_customer_existing_seats_revenue = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True
    )
    existing_customer_additional_seats_revenue = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True
    )
    new_customer_new_seats_revenue = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True
    )
    discounts_and_refunds = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True
    )
    
    # SaaS-specific metrics
    arr = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)  # Annual Recurring Revenue
    mrr = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)  # Monthly Recurring Revenue
    
    # Per customer metrics
    average_revenue_per_customer = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True
    )
    average_contract_value = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True
    )
    
    # Retention metrics
    revenue_churn_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    net_revenue_retention = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    gross_revenue_retention = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Cohort growth rates
    growth_rate_cohort_1 = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    growth_rate_cohort_2 = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    growth_rate_cohort_3 = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Notes
    notes = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['entity', 'date', 'scenario']
        verbose_name = "Revenue Metrics"
        verbose_name_plural = "Revenue Metrics"
    
    def __str__(self):
        return f"Revenue Metrics for {self.entity.name} on {self.date}"


class CustomerMetrics(models.Model):
    """
    Customer Metrics.
    
    Tracks customer-related metrics including:
    - Customer counts and segments
    - Growth and churn rates
    - Acquisition metrics (CAC, LTV)
    - Retention and efficiency metrics
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='customer_metrics')
    
    # Detailed time dimensions
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QuarterChoices.choices, null=True, blank=True)
    semester = models.CharField(max_length=2, choices=SemesterChoices.choices, null=True, blank=True)
    month = models.CharField(max_length=9, choices=MonthChoices.choices, null=True, blank=True)
    full_year = models.BooleanField(default=False)
    scenario = models.CharField(max_length=20, choices=FinancialScenario.choices, default=FinancialScenario.ACTUAL)

    # Period dimension
    date = models.DateField(null=True, blank=True)
    
    # Customer counts
    total_customers = models.IntegerField(null=True, blank=True)
    new_customers = models.IntegerField(null=True, blank=True)
    churned_customers = models.IntegerField(null=True, blank=True)
    
    # User metrics
    total_users = models.IntegerField(null=True, blank=True)
    active_users = models.IntegerField(null=True, blank=True)
    total_monthly_active_client_users = models.IntegerField(null=True, blank=True)
    
    # User breakdown
    existing_customer_existing_seats_users = models.IntegerField(null=True, blank=True)
    existing_customer_additional_seats_users = models.IntegerField(null=True, blank=True)
    new_customer_new_seats_users = models.IntegerField(null=True, blank=True)
    user_growth_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Addressable market metrics
    new_customer_total_addressable_seats = models.IntegerField(null=True, blank=True)
    new_customer_new_seats_percent_signed = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    new_customer_total_addressable_seats_remaining = models.IntegerField(null=True, blank=True)
    
    # Customer segments
    existing_customer_count = models.IntegerField(null=True, blank=True)
    existing_customer_expansion_count = models.IntegerField(null=True, blank=True)
    new_customer_count = models.IntegerField(null=True, blank=True)
    
    # Growth metrics
    customer_growth_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Customer acquisition
    cac = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)  # Customer Acquisition Cost
    ltv = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)  # Lifetime Value
    ltv_cac_ratio = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    payback_period = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Retention metrics
    customer_churn_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Efficiency metrics
    customer_acquisition_efficiency = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    sales_efficiency = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Notes
    notes = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['entity', 'date', 'scenario']
        verbose_name = "Customer Metrics"
        verbose_name_plural = "Customer Metrics"
    
    def __str__(self):
        return f"Customer Metrics for {self.entity.name} on {self.date}"


class OperationalMetrics(models.Model):
    """
    Operational Metrics.
    
    Tracks key operational indicators including:
    - Cash metrics (burn rate, runway)
    - Efficiency metrics
    - Unit economics
    - Productivity metrics
    - Investment performance metrics
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='operational_metrics')
    
    # Detailed time dimensions
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QuarterChoices.choices, null=True, blank=True)
    semester = models.CharField(max_length=2, choices=SemesterChoices.choices, null=True, blank=True)
    month = models.CharField(max_length=9, choices=MonthChoices.choices, null=True, blank=True)
    full_year = models.BooleanField(default=False)
    scenario = models.CharField(max_length=20, choices=FinancialScenario.choices, default=FinancialScenario.ACTUAL)

    # Period dimension
    date = models.DateField(null=True, blank=True)
    
    # Cash metrics
    burn_rate = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    runway_months = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    runway_gross = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    runway_net = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Efficiency metrics
    burn_multiple = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    rule_of_40 = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Unit economics
    gross_margin = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    contribution_margin = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Productivity metrics
    revenue_per_employee = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    profit_per_employee = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Investment performance metrics
    capital_efficiency = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    cash_conversion_cycle = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Capex / Operating metrics
    capex = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    ebitda = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    total_costs = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Notes
    notes = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['entity', 'date', 'scenario']
        verbose_name = "Operational Metrics"
        verbose_name_plural = "Operational Metrics"
    
    def __str__(self):
        return f"Operational Metrics for {self.entity.name} on {self.date}"


class TeamMetrics(models.Model):
    """
    Team Metrics.
    
    Tracks team and workforce metrics including:
    - Headcount breakdowns
    - Department distributions
    - Growth and efficiency metrics
    - Retention and satisfaction metrics
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='team_metrics')
    
    # Detailed time dimensions
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QuarterChoices.choices, null=True, blank=True)
    semester = models.CharField(max_length=2, choices=SemesterChoices.choices, null=True, blank=True)
    month = models.CharField(max_length=9, choices=MonthChoices.choices, null=True, blank=True)
    full_year = models.BooleanField(default=False)
    scenario = models.CharField(max_length=20, choices=FinancialScenario.choices, default=FinancialScenario.ACTUAL)

    # Period dimension
    date = models.DateField(null=True, blank=True)
    
    # Headcount
    total_employees = models.IntegerField(null=True, blank=True)
    full_time_employees = models.IntegerField(null=True, blank=True)
    part_time_employees = models.IntegerField(null=True, blank=True)
    contractors = models.IntegerField(null=True, blank=True)
    
    # Department breakdown
    number_of_management = models.IntegerField(null=True, blank=True)  
    number_of_sales_marketing_staff = models.IntegerField(null=True, blank=True)
    number_of_research_development_staff = models.IntegerField(null=True, blank=True)
    number_of_customer_service_support_staff = models.IntegerField(null=True, blank=True)
    number_of_general_staff = models.IntegerField(null=True, blank=True)
    
    # Growth and efficiency metrics
    employee_growth_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Retention and satisfaction metrics
    employee_turnover_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    average_tenure_months = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Staff costs
    management_costs = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    sales_marketing_staff_costs = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    research_development_staff_costs = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    customer_service_support_staff_costs = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    general_staff_costs = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    staff_costs_total = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # Notes
    notes = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['entity', 'date', 'scenario']
        verbose_name = "Team Metrics"
        verbose_name_plural = "Team Metrics"
    
    def __str__(self):
        return f"Team Metrics for {self.entity.name} on {self.date}"



# =============================================================================
# DYNAMIC KPI SYSTEM
# =============================================================================

class KPI(models.Model):
    """
    Defines a custom KPI for an entity.
    
    This model merges the KPI definition and calculated KPI concepts.
    It includes:
      - The KPI's name, description, and data type.
      - A flag indicating if it is calculated.
      - An optional formula (as a Python expression) for calculating the KPI.
      - A ManyToMany relation to other KPIs that serve as components in its formula.
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='kpis')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    class DataTypes(models.TextChoices):
        DECIMAL = 'decimal', 'Decimal'
        INTEGER = 'integer', 'Integer'
        STRING = 'string', 'String'
    
    data_type = models.CharField(max_length=50, choices=DataTypes.choices, default=DataTypes.DECIMAL)
    is_calculated = models.BooleanField(default=False)
    formula = models.TextField(
        blank=True, 
        help_text="Python expression for calculated KPIs (e.g., 'Revenue - COGS')"
    )
    components = models.ManyToManyField(
        'self', 
        blank=True, 
        symmetrical=False, 
        help_text="Other KPIs used in the formula"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "KPI"
        verbose_name_plural = "KPIs"
    
    def __str__(self):
        return f"{self.entity.name} - {self.name}"


class KPIValue(models.Model):
    """
    Stores the value of a KPI for a given entity on a specific date,
    under a particular scenario and granularity.
    """
    kpi = models.ForeignKey(KPI, on_delete=models.CASCADE, related_name='values')
    
    # Detailed time dimensions
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QuarterChoices.choices, null=True, blank=True)
    semester = models.CharField(max_length=2, choices=SemesterChoices.choices, null=True, blank=True)
    month = models.CharField(max_length=9, choices=MonthChoices.choices, null=True, blank=True)
    full_year = models.BooleanField(default=False)
    scenario = models.CharField(max_length=20, choices=FinancialScenario.choices, default=FinancialScenario.ACTUAL)

    # Period dimension
    date = models.DateField(null=True, blank=True)

    value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['kpi', 'date', 'scenario']
        verbose_name = "KPI Value"
        verbose_name_plural = "KPI Values"
    
    def __str__(self):
        return f"{self.kpi.name} on {self.date}: {self.value}"


# =============================================================================
# INVESTMENT & PORTFOLIO MODELS
# =============================================================================

class DealPipeline(models.Model):
    """
    Tracks potential deals in the pipeline.
    Manages deal flow from initial screening to closing.
    """
    class PriorityType(models.TextChoices):
        P1 = 'p1', 'Priority 1'
        P2 = 'p2', 'Priority 2'
        P3 = 'p3', 'Priority 3'
        P4 = 'p4', 'Priority 4'
        P5 = 'p5', 'Priority 5'
    
    class StatusType(models.TextChoices):
        INITIAL_SCREENING = 'initial_screening', 'Initial Screening'
        FIRST_MEETING = 'first_meeting', 'First Meeting'
        FOLLOW_UP = 'follow_up', 'Follow Up'
        DUE_DILIGENCE = 'due_diligence', 'Due Diligence'
        NEGOTIATION = 'negotiation', 'Negotiation'
        TERM_SHEET = 'term_sheet', 'Term Sheet'
        LEGAL_REVIEW = 'legal_review', 'Legal Review'
        CLOSING = 'closing', 'Closing'
        CLOSED = 'closed', 'Closed'
        REJECTED = 'rejected', 'Rejected'
        ON_HOLD = 'on_hold', 'On Hold'
    
    class RoundType(models.TextChoices):
        PRE_SEED = 'pre_seed', 'Pre-Seed'
        SEED = 'seed', 'Seed'
        SERIES_A = 'series_a', 'Series A'
        SERIES_B = 'series_b', 'Series B'
        SERIES_C = 'series_c', 'Series C'
        DEBT = 'debt', 'Debt'
        CONVERTIBLE_NOTE = 'convertible_note', 'Convertible Note'
        SAFE = 'safe', 'SAFE'
        BRIDGE = 'bridge', 'Bridge'
        SECONDARY = 'secondary', 'Secondary'
        OTHER = 'other', 'Other'
    
    class SectorType(models.TextChoices):
        FINTECH = 'fintech', 'Fintech'
        HEALTHTECH = 'healthtech', 'Healthtech'
        ECOMMERCE = 'ecommerce', 'E-Commerce'
        SAAS = 'saas', 'SaaS'
        AI_ML = 'ai_ml', 'AI/ML'
        BLOCKCHAIN = 'blockchain', 'Blockchain'
        CLEANTECH = 'cleantech', 'Cleantech'
        EDTECH = 'edtech', 'Edtech'
        ENTERPRISE = 'enterprise', 'Enterprise'
        CONSUMER = 'consumer', 'Consumer'
        OTHER = 'other', 'Other'

    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='pipeline_deals')
    name = models.CharField(max_length=255)
    priority = models.CharField(max_length=2, choices=PriorityType.choices)
    status = models.CharField(max_length=50, choices=StatusType.choices, default=StatusType.INITIAL_SCREENING)
    round_type = models.CharField(max_length=50, choices=RoundType.choices)
    sector = models.CharField(max_length=50, choices=SectorType.choices)

    # Investment Details
    target_raise = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    pre_money_valuation = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    post_money_valuation = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    expected_ownership = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    investment_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, help_text="Our planned investment amount")
    is_lead_investor = models.BooleanField(default=False, help_text="Are we leading this round?")
    other_investors = models.TextField(blank=True, help_text="Other confirmed investors in the round")

    # Timeline
    first_contact_date = models.DateField(null=True, blank=True)
    last_interaction_date = models.DateField(null=True, blank=True)
    next_meeting_date = models.DateField(null=True, blank=True)
    expected_close_date = models.DateField(null=True, blank=True)

    # Deal Materials
    pitch_deck = models.FileField(upload_to='pipeline_decks/', null=True, blank=True)
    financial_model = models.FileField(upload_to='pipeline_models/', null=True, blank=True)
    data_room_link = models.URLField(blank=True, help_text="Link to deal data room")

    # Notes & Analysis
    investment_thesis = models.TextField(blank=True)
    key_risks = models.TextField(blank=True)
    due_diligence_notes = models.TextField(blank=True)
    next_steps = models.TextField(blank=True)
    comments = models.TextField(blank=True, help_text="General comments and updates")

    # Tracking
    assigned_to = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_deals')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Deal Pipeline"
        verbose_name_plural = "Deal Pipeline"
        ordering = ['priority', '-created_at']

    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"


class PortfolioInvestment(models.Model):
    """
    Represents an actual investment in the portfolio.
    Shows investment performance metrics and portfolio allocation.
    Can be tracked at both entity and round level.
    """
    class StatusType(models.TextChoices):
        ACTIVE = 'active', 'Active'
        EXITED = 'exited', 'Exited'
        WRITTEN_OFF = 'written_off', 'Written Off'
        ON_HOLD = 'on_hold', 'On Hold'

    class InvestmentType(models.TextChoices):
        EQUITY = 'equity', 'Equity'
        DEBT = 'debt', 'Debt'
        CONVERTIBLE = 'convertible', 'Convertible'
        WARRANT = 'warrant', 'Warrant'
        OPTION = 'option', 'Option'

    class RoundType(models.TextChoices):
        SEED = 'seed', 'Seed'
        PRE_SERIES_A = 'pre_series_a', 'Pre-Series A'
        SERIES_A = 'series_a', 'Series A'
        SERIES_B = 'series_b', 'Series B'
        SERIES_C = 'series_c', 'Series C'
        SERIES_D = 'series_d', 'Series D'
        BRIDGE = 'bridge', 'Bridge'
        GROWTH = 'growth', 'Growth'
        PRE_IPO = 'pre_ipo', 'Pre-IPO'
        OTHER = 'other', 'Other'
    
    class ListingStatus(models.TextChoices):
        PRIVATE = 'private', 'Private Company'
        PUBLIC = 'public', 'Public Company (Listed)'
        DELISTED = 'delisted', 'Delisted'
        GOING_PUBLIC = 'going_public', 'Going Public (IPO Process)'
    
    class SectorType(models.TextChoices):
        FINTECH = 'fintech', 'Fintech'
        HEALTHTECH = 'healthtech', 'Healthtech'
        ECOMMERCE = 'ecommerce', 'E-Commerce'
        SAAS = 'saas', 'SaaS'
        AI_ML = 'ai_ml', 'AI/ML'
        BLOCKCHAIN = 'blockchain', 'Blockchain'
        CLEANTECH = 'cleantech', 'Cleantech'
        EDTECH = 'edtech', 'Edtech'
        ENTERPRISE = 'enterprise', 'Enterprise'
        CONSUMER = 'consumer', 'Consumer'
        OTHER = 'other', 'Other'

    # Core investment fields
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='portfolio_investments')
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, null=True, blank=True, related_name='portfolio_investments')
    investment_name = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=50, choices=Entity.EntityTypes.choices)
    investment_type = models.CharField(max_length=50, choices=InvestmentType.choices)
    investment_round = models.CharField(max_length=50, choices=RoundType.choices, null=True, blank=True)
    investment_status = models.CharField(max_length=50, choices=StatusType.choices, default=StatusType.ACTIVE)
    sector = models.CharField(max_length=50, choices=SectorType.choices, help_text="Industry sector of the investment")
    listing_status = models.CharField(
        max_length=20, 
        choices=ListingStatus.choices, 
        default=ListingStatus.PRIVATE,
        help_text="Whether the investment is in a public or private company"
    )
    original_investment_date = models.DateField(null=True, blank=True)
    
    # Investment amounts and ownership
    total_investment_amount = models.DecimalField("Total Investment Amount", max_digits=20, decimal_places=2, null=True, blank=True)
    ownership_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    invested_as_percent_capital = models.DecimalField("Invested as % of Invested Capital", max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Share and price information (primarily for public companies)
    number_of_shares = models.DecimalField(
        max_digits=20, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Total number of shares held in the investment"
    )
    average_cost_per_share = models.DecimalField(
        max_digits=20, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Average cost basis per share"
    )
    current_share_price = models.DecimalField(
        max_digits=20, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Latest market price per share (for public companies)"
    )
    share_price_updated_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Timestamp of the last share price update"
    )
    
    # Public company specific information
    stock_ticker = models.CharField(
        max_length=10, 
        null=True, 
        blank=True,
        help_text="Stock ticker symbol for public companies (e.g., AAPL)"
    )
    exchange = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        help_text="Stock exchange where the company is listed (e.g., NASDAQ)"
    )
    
    # Performance metrics
    current_fair_value = models.DecimalField(
        max_digits=20, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Current fair value of investment. For public companies, automatically updated based on market price. For private companies, manually updated based on latest valuation."
    )
    moic = models.DecimalField("MOIC (Money on Invested Capital)", max_digits=10, decimal_places=2, null=True, blank=True)
    irr = models.DecimalField("IRR", max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Additional fields
    export_functionality = models.BooleanField(default=False)
    
    def calculate_public_company_irr(self):
        """
        Calculate IRR for public company investments.
        Uses:
        1. Initial investment cash flow (negative)
        2. All dividends and distributions (positive)
        3. Current market value (positive)
        
        Returns:
            float: The calculated IRR or None if insufficient data
        """
        if not (self.original_investment_date and self.total_investment_amount):
            return None
            
        cash_flows = []
        dates = []
        
        # Initial investment (negative cash flow)
        cash_flows.append(-self.total_investment_amount)
        dates.append(self.original_investment_date)
        
        # Add all dividends and distributions
        distributions = self.cash_flows.filter(
            type__in=['dividend', 'distribution'],
            category='actual'
        ).order_by('date')
        
        for dist in distributions:
            cash_flows.append(dist.amount)
            dates.append(dist.date)
        
        # Add current market value
        if self.number_of_shares and self.current_share_price:
            current_value = self.number_of_shares * self.current_share_price
            cash_flows.append(current_value)
            dates.append(datetime.now().date())
        
        # Need at least two cash flows for IRR
        if len(cash_flows) < 2:
            return None
            
        # Convert dates to years from first investment
        years = [(d - dates[0]).days / 365.0 for d in dates]
        
        try:
            return np.irr(cash_flows, years)
        except:
            return None
    
    def calculate_private_company_irr(self):
        """
        Calculate IRR for private company investments.
        Uses all cash flows from PortfolioCashFlow model.
        
        Returns:
            float: The calculated IRR or None if insufficient data
        """
        import numpy as np
        
        cash_flows = self.cash_flows.filter(
            category='actual',
            is_included_in_irr=True
        ).order_by('date')
        
        if cash_flows.count() < 2:
            return None
            
        amounts = []
        dates = []
        first_date = None
        
        for cf in cash_flows:
            if not first_date:
                first_date = cf.date
            amounts.append(cf.amount)
            dates.append((cf.date - first_date).days / 365.0)
        
        try:
            return np.irr(amounts, dates)
        except:
            return None
    
    def calculate_irr(self):
        """
        Calculate IRR based on listing status.
        Delegates to appropriate method based on whether company is public or private.
        
        Returns:
            float: The calculated IRR or None if insufficient data
        """
        if self.listing_status == self.ListingStatus.PUBLIC:
            return self.calculate_public_company_irr()
        else:
            return self.calculate_private_company_irr()
    
    def update_market_value(self):
        """
        Update current fair value and related metrics.
        For public companies: Uses market price * number of shares
        For private companies: No automatic updates (set manually)
        """
        if self.listing_status == self.ListingStatus.PUBLIC:
            if self.number_of_shares and self.current_share_price:
                # Update fair value based on market price
                self.current_fair_value = self.number_of_shares * self.current_share_price
                
                # Update MOIC
                if self.total_investment_amount and self.total_investment_amount > 0:
                    self.moic = self.current_fair_value / self.total_investment_amount
                
                # Update IRR
                calculated_irr = self.calculate_irr()
                if calculated_irr is not None:
                    self.irr = calculated_irr
                
                self.save()
    
    class Meta:
        verbose_name = "Portfolio Investment"
        verbose_name_plural = "Portfolio Investments"
        unique_together = ['entity', 'funding_round', 'investment_name']
    
    def __str__(self):
        base = f"Portfolio Investment for {self.entity.name} - {self.investment_name}"
        if self.funding_round:
            return f"{base} ({self.funding_round.name})"
        return base


class PortfolioCashFlow(models.Model):
    """
    Tracks cash flows for IRR calculation at portfolio company and round level.
    - Records both actual and projected cash flows
    - Groups related cash flows for IRR calculation
    - Supports different types of cash flows (investments, distributions, etc.)
    - Links to actual transactions for audit trail
    - Can be used for both historical IRR and forward-looking IRR
    """
    class CashFlowType(models.TextChoices):
        INVESTMENT = 'investment', 'Investment (Cash Out)'
        DISTRIBUTION = 'distribution', 'Distribution (Cash In)'
        DIVIDEND = 'dividend', 'Dividend Payment'
        INTEREST = 'interest', 'Interest Payment'
        FEE = 'fee', 'Fee Payment'
        OTHER = 'other', 'Other'
    
    class CashFlowCategory(models.TextChoices):
        ACTUAL = 'actual', 'Actual Cash Flow'
        PROJECTED = 'projected', 'Projected Cash Flow'
    
    # Core relationships
    portfolio_investment = models.ForeignKey(PortfolioInvestment, on_delete=models.CASCADE, related_name='cash_flows')
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='portfolio_cash_flows')
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, null=True, blank=True, related_name='cash_flows')
    
    # Cash flow details
    date = models.DateField()
    amount = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text="Negative for cash out (investments), positive for cash in (distributions)"
    )
    type = models.CharField(max_length=20, choices=CashFlowType.choices)
    category = models.CharField(
        max_length=20, 
        choices=CashFlowCategory.choices,
        default=CashFlowCategory.ACTUAL
    )
    
    # Optional link to actual transaction
    cash_transaction = models.ForeignKey(
        CashTransaction, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='portfolio_cash_flows'
    )
    
    # Additional fields
    description = models.TextField(blank=True)
    is_included_in_irr = models.BooleanField(
        default=True,
        help_text="Whether this cash flow should be included in IRR calculations"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date']
        verbose_name = "Portfolio Cash Flow"
        verbose_name_plural = "Portfolio Cash Flows"
        indexes = [
            models.Index(fields=['entity', 'funding_round', 'date']),
            models.Index(fields=['portfolio_investment', 'date'])
        ]
    
    def __str__(self):
        flow_type = "out" if self.amount < 0 else "in"
        return f"{self.get_type_display()} cash {flow_type} of {abs(self.amount)} on {self.date}"


class PortfolioPerformance(models.Model):
    """
    Comprehensive performance metrics for entities.
    - Tracks key investment metrics
    - Used for both funds and companies
    - Includes standard industry metrics (IRR, TVPI, etc.)
    - Can be tracked at both entity and round level
    - Supports performance analysis and reporting
    - Critical for investor communications
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='performances')
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, null=True, blank=True, related_name='performances')
    report_date = models.DateField(default=timezone.now)
    total_invested_amount = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    fair_value = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    cash_realized = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    tvpi = models.DecimalField("TVPI", max_digits=10, decimal_places=2, null=True, blank=True)
    dpi = models.DecimalField("DPI", max_digits=10, decimal_places=2, null=True, blank=True)
    rvpi = models.DecimalField("RVPI", max_digits=10, decimal_places=2, null=True, blank=True)
    irr = models.DecimalField("IRR", max_digits=5, decimal_places=2, null=True, blank=True)
    multiple_to_cost = models.DecimalField("Multiple to Cost", max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        ordering = ['-report_date']
        verbose_name = "Portfolio Performance"
        verbose_name_plural = "Portfolio Performances"
        unique_together = ['entity', 'funding_round', 'report_date']
    
    def __str__(self):
        base = f"Performance for {self.entity.name}"
        if self.funding_round:
            return f"{base} - {self.funding_round.name} on {self.report_date}"
        return f"{base} (Total) on {self.report_date}"


class NAV(models.Model):
    """
    Net Asset Value (NAV) for an entity or specific funding round.
    Records the point-in-time NAV value.
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='nav_reports')
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, null=True, blank=True, related_name='nav_reports')
    date = models.DateField(default=timezone.now)
    nav_value = models.DecimalField(max_digits=20, decimal_places=2)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        verbose_name = "NAV"
        verbose_name_plural = "NAVs"
        unique_together = ['entity', 'funding_round', 'date']
    
    def __str__(self):
        base = f"NAV for {self.entity.name}"
        if self.funding_round:
            return f"{base} - {self.funding_round.name} on {self.date}"
        return f"{base} (Total) on {self.date}"


class Fee(models.Model):
    """
    Records fees for an entity.
    Can be tracked at both entity and round level.
    """
    class FeeTypes(models.TextChoices):
        MANAGEMENT = 'management', 'Management Fee'
        PERFORMANCE = 'performance', 'Performance Fee'
        SETUP = 'setup', 'Setup Fee'
        ADMINISTRATIVE = 'administrative', 'Administrative Cost'
        LEGAL = 'legal', 'Legal Cost'
        AUDIT = 'audit', 'Audit Cost'
        CUSTODIAN = 'custodian', 'Custodian Fee'
        OTHER = 'other', 'Other Cost'
    
    class FeeFrequency(models.TextChoices):
        ONE_TIME = 'one_time', 'One Time'
        MONTHLY = 'monthly', 'Monthly'
        QUARTERLY = 'quarterly', 'Quarterly'
        ANNUAL = 'annual', 'Annual'
    
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='fees')
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, null=True, blank=True, related_name='fees')

    # Detailed time dimensions
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QuarterChoices.choices, null=True, blank=True)
    semester = models.CharField(max_length=2, choices=SemesterChoices.choices, null=True, blank=True)
    month = models.CharField(max_length=9, choices=MonthChoices.choices, null=True, blank=True)
    full_year = models.BooleanField(default=False)
    scenario = models.CharField(max_length=20, choices=FinancialScenario.choices, default=FinancialScenario.ACTUAL)

    # Period dimension
    date = models.DateField(null=True, blank=True)

    fee_type = models.CharField(max_length=20, choices=FeeTypes.choices)
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    frequency = models.CharField(max_length=20, choices=FeeFrequency.choices, default=FeeFrequency.ONE_TIME)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                     help_text="If fee is percentage based")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        verbose_name = "Entity Fee"
        verbose_name_plural = "Entity Fees"
        unique_together = ['entity', 'funding_round', 'fee_type', 'date', 'scenario']
    
    def __str__(self):
        base = f"{self.get_fee_type_display()} - {self.entity.name}"
        if self.funding_round:
            return f"{base} - {self.funding_round.name} on {self.date}"
        return f"{base} on {self.date}"

# =============================================================================
# DEAL INFORMATION & PROFILES
# =============================================================================

class EntityDealProfile(models.Model):
    """
    Extended profile information for different entity types:
    - Companies: Product, market, and growth details
    - Funds: Investment strategy and track record
    - M&A Targets: Market position and deal potential
    - Individuals: Professional background and investment history
    """
    class EntityType(models.TextChoices):
        COMPANY = 'company', 'Company'
        FUND = 'fund', 'Investment Fund'
        TARGET = 'target', 'M&A Target'
        INDIVIDUAL = 'individual', 'Individual'
    
    entity = models.OneToOneField(Entity, on_delete=models.CASCADE, related_name='deal_profile')
    entity_type = models.CharField(max_length=20, choices=EntityType.choices, default=EntityType.COMPANY)
    
    # Basic Info (common to all types)
    industry = models.CharField(max_length=100, help_text="Industry sector")
    location = models.CharField(max_length=2, help_text="Country code e.g. GB")
    website = models.URLField(null=True, blank=True)
    year_founded = models.IntegerField(null=True, blank=True)
    
    # Financial Overview (common to all types)
    current_valuation = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    latest_raise_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    total_raised = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Company-specific fields
    stage = models.CharField(max_length=50, help_text="e.g. PreSeed", blank=True)
    short_description = models.TextField(help_text="Brief company description")
    problem_description = models.TextField(help_text="Problem the company is solving")
    solution_description = models.TextField(help_text="Company's solution")
    how_it_works = models.TextField(help_text="How the product/service works")
    market_size = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    competitors = models.TextField(blank=True)
    competitive_advantage = models.TextField(blank=True)
    growth_metrics = models.TextField(blank=True)
    
    # Fund-specific fields
    investment_strategy = models.TextField(blank=True)
    fund_size = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    fund_terms = models.TextField(blank=True)
    track_record = models.TextField(blank=True)
    fund_type = models.CharField(max_length=50, blank=True, help_text="e.g. Venture Capital, Private Equity")
    investment_focus = models.TextField(blank=True, help_text="Target sectors, stages, geographies")
    fund_lifecycle = models.CharField(max_length=50, blank=True, help_text="e.g. Fundraising, Investment Period, Harvest")
    vintage_year = models.IntegerField(null=True, blank=True)
    
    # M&A-specific fields
    synergy_potential = models.TextField(blank=True)
    key_assets = models.TextField(blank=True)
    market_position = models.TextField(blank=True)
    integration_plan = models.TextField(blank=True)
    acquisition_rationale = models.TextField(blank=True)
    financial_metrics = models.TextField(blank=True, help_text="Key financial metrics for valuation")
    risk_factors = models.TextField(blank=True)
    deal_readiness = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Entity Deal Profile"
        verbose_name_plural = "Entity Deal Profiles"

    def __str__(self):
        return f"Entity Deal Profile for {self.entity.name}"


# =============================================================================
# TEAM & PARTNERS
# =============================================================================

class DealProfileMember(models.Model):
    """
    Represents key members associated with an entity's deal profile:
    - For Companies: Executives, board members, advisors
    - For Funds: GPs, Investment Committee, Advisors
    - For Individuals: Professional roles, board positions
    Tracks their roles, positions, and professional details.
    """
    class MemberRole(models.TextChoices):
        EXECUTIVE = 'executive', 'Executive Team'
        BOARD = 'board', 'Board Member'
        ADVISOR = 'advisor', 'Advisor'
        GP = 'gp', 'General Partner'
        IC = 'ic', 'Investment Committee'
        KEY_PERSON = 'key_person', 'Key Person'
    
    deal_profile = models.ForeignKey('EntityDealProfile', on_delete=models.CASCADE, related_name='team_members')
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=MemberRole.choices)
    position = models.CharField(max_length=255)
    bio = models.TextField()
    linkedin_url = models.URLField(null=True, blank=True)
    photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'role', 'name']
        verbose_name = "Deal Profile Member"
        verbose_name_plural = "Deal Profile Members"

    def __str__(self):
        return f"{self.name} - {self.get_role_display()} at {self.deal_profile.entity.name}"


class DealProfileRelationship(models.Model):
    """
    Tracks strategic relationships in an entity's deal profile:
    - For Companies: Clients, partners, suppliers
    - For Funds: Portfolio companies, LPs, co-investors
    - For Individuals: Board positions, advisory roles
    Part of the entity's deal profile for relationship mapping and validation.
    """
    class RelationshipType(models.TextChoices):
        CLIENT = 'client', 'Client'
        PARTNER = 'partner', 'Partner'
        SUPPLIER = 'supplier', 'Supplier'
        PORTFOLIO = 'portfolio', 'Portfolio Company'
        LP = 'lp', 'Limited Partner'
        CO_INVESTOR = 'co_investor', 'Co-Investor'
        ADVISOR = 'advisor', 'Advisor To'
    
    deal_profile = models.ForeignKey('EntityDealProfile', on_delete=models.CASCADE, related_name='relationships')
    name = models.CharField(max_length=255)
    relationship_type = models.CharField(max_length=20, choices=RelationshipType.choices)
    logo = models.ImageField(upload_to='relationship_logos/', null=True, blank=True)
    website_url = models.URLField(null=True, blank=True)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Deal Profile Relationship"
        verbose_name_plural = "Deal Profile Relationships"

    def __str__(self):
        return f"{self.name} - {self.get_relationship_type_display()} of {self.deal_profile.entity.name}"


class Deal(models.Model):
    """
    Active deal tracking (fundraising/M&A/secondary/debt).
    Manages deal progress, commitments, documentation,
    and investor engagement.
    """
    class DealType(models.TextChoices):
        FUNDRAISING = 'fundraising', 'Fundraising Round'
        ACQUISITION = 'acquisition', 'M&A'
        SECONDARY = 'secondary', 'Secondary Sale'
        DEBT = 'debt', 'Debt Financing'
    
    # Core Details
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='active_deals')
    name = models.CharField(max_length=255)
    deal_type = models.CharField(max_length=20, choices=DealType.choices, default=DealType.FUNDRAISING)
    
    # Financial Terms
    pre_money_valuation = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    post_money_valuation = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    target_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    minimum_investment = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    share_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    share_allocation = models.IntegerField(null=True, blank=True)
    dilution = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Rights & Governance
    liquidation_preference = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    dividend_rights = models.CharField(max_length=100, blank=True)
    anti_dilution = models.CharField(max_length=100, blank=True)
    pro_rata_rights = models.BooleanField(default=False)
    board_seats = models.IntegerField(default=0)
    veto_rights = models.TextField(blank=True)
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    expected_close_date = models.DateField(null=True, blank=True)
    
    # Status & Progress
    soft_commitments = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    firm_commitments = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    profile_views = models.IntegerField(default=0)
    due_diligence_status = models.CharField(max_length=50, blank=True)
    
    # Documents
    pitch_deck = models.FileField(upload_to='pitch_decks/', null=True, blank=True)
    financial_model = models.FileField(upload_to='deal_models/', null=True, blank=True)
    data_room_link = models.URLField(blank=True)
    term_sheet = models.FileField(upload_to='term_sheets/', null=True, blank=True)
    shareholders_agreement = models.FileField(upload_to='agreements/', null=True, blank=True)
    
    # Additional Info
    investment_highlights = models.TextField(blank=True)
    use_of_funds = models.TextField(blank=True)
    
    # Secondary Details
    seller = models.ForeignKey(Stakeholder, null=True, blank=True, on_delete=models.SET_NULL, related_name='sales')
    shares_offered = models.IntegerField(null=True, blank=True)
    
    # Debt Details
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    term_length = models.IntegerField(null=True, blank=True)
    collateral = models.TextField(blank=True)
    
    # M&A Details
    acquisition_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    payment_structure = models.TextField(blank=True)
    deal_structure = models.TextField(blank=True)

    # System
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Deal"
        verbose_name_plural = "Deals"
    
    def __str__(self):
        return f"{self.name} - {self.entity.name}"
    
    def complete_deal(self):
        """
        Complete the deal and create appropriate records
        """
        if self.deal_type == self.DealType.FUNDRAISING:
            return FundingRound.objects.create(
                entity=self.entity,
                name=self.name,
                raised_amount=self.firm_commitments,
                date=self.end_date,
                pre_money_valuation=self.pre_money_valuation
            )

class DealCommitment(models.Model):
    """
    Tracks commitments (soft and firm) from entities interested in a deal.
    - Soft commitments indicate interest level
    - Firm commitments are binding agreements
    - Tracks commitment history and status changes
    - Commitments can come from:
      * Direct entities (companies, funds)
      * Syndicates (through their entity)
    """
    class CommitmentType(models.TextChoices):
        SOFT = 'soft', 'Soft Commitment'
        FIRM = 'firm', 'Firm Commitment'
    
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='commitments')
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='deal_commitments')
    syndicate = models.ForeignKey(Syndicate, on_delete=models.SET_NULL, null=True, blank=True, related_name='deal_commitments')
    commitment_type = models.CharField(max_length=20, choices=CommitmentType.choices, default=CommitmentType.SOFT)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Deal Commitment"
        verbose_name_plural = "Deal Commitments"
        unique_together = ['deal', 'entity', 'syndicate']

    def __str__(self):
        committer = f"{self.syndicate.name} (Syndicate)" if self.syndicate else self.entity.name
        return f"{committer} - {self.get_commitment_type_display()} commitment of {self.amount} for {self.deal.name}"
    
    def convert_to_firm(self):
        """Convert a soft commitment to a firm commitment"""
        if self.commitment_type == self.CommitmentType.SOFT:
            self.commitment_type = self.CommitmentType.FIRM
            self.save()
            
            # Update deal's commitment totals
            self.deal.soft_commitments -= self.amount
            self.deal.firm_commitments += self.amount
            self.deal.save()

