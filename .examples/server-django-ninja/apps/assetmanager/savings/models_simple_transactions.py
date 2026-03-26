from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from apps.accounts.models import Organization, User, OrganizationMember
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

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
    
    ENTITY_TYPE_CHOICES = [
        ('fund', 'Investment Fund'),
        ('company', 'Company'),
    ]
    
    name = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES)
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

class EntityInvitation(models.Model):
    """Allows entities (like funds) to invite other entities (like portfolio companies) 
    to share specific data"""
    inviting_entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='invitations_sent')
    email = models.EmailField()
    access_type = models.CharField(max_length=20, choices=[
        ('financials', 'Financial Statements'),
        ('kpis', 'KPI Data'),
        ('all', 'Full Access')
    ])
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.inviting_entity.name} invited {self.email}"

    class Meta:
        verbose_name = "Entity Invitation"
        verbose_name_plural = "Entity Invitations"

class Stakeholder(models.Model):
    """
    Represents any party that has a stake in an entity.
    - Can be investors (LPs), fund managers (GPs), employees, etc
    - Tracks contact information and rights
    - Records investment terms and governance rights
    - Handles carried interest and preferred returns
    - Manages distribution waterfall positions
    - Supports entities as stakeholders in other entities
    - Tracks board seats and voting rights
    - Records pro-rata and other special rights
    """
    STAKEHOLDER_TYPE_CHOICES = [
        ('general_partner', 'General Partner (GP)'),
        ('limited_partner', 'Limited Partner (LP)'),
        ('employee', 'Employee'),
        ('advisor', 'Advisor'),
        ('founder', 'Founder'),
        ('entity', 'Entity Investor'),
        ('other', 'Other'),
    ]
    
    """Basic Information"""
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=STAKEHOLDER_TYPE_CHOICES, default='other')
    entity = models.ForeignKey(Entity, null=True, blank=True, 
                             on_delete=models.SET_NULL, 
                             related_name='entity_as_stakeholder')
    
    """Investment Rights"""
    carried_interest_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        help_text="For GP, percentage of profits after LP return"
    )
    preferred_return_rate = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        help_text="For LP, hurdle rate before GP gets carried interest"
    )
    distribution_tier = models.IntegerField(
        default=1,
        help_text="Order in distribution waterfall (1=first money out)"
    )
    
    """Governance Rights"""
    board_seats = models.IntegerField(default=0)
    voting_rights = models.BooleanField(default=True)
    pro_rata_rights = models.BooleanField(default=False)
    drag_along = models.BooleanField(default=False)
    tag_along = models.BooleanField(default=False)
    observer_rights = models.BooleanField(default=False)
    
    """Investment Terms"""
    minimum_investment = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    maximum_investment = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

    class Meta:
        verbose_name = "Stakeholder"
        verbose_name_plural = "Stakeholders"

class Syndicate(models.Model):
    """
    Represents a group of stakeholders who invest together.
    - Allows stakeholders to pool resources
    - Can participate in funding rounds as a single unit
    - Helps manage group investments
    """
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Syndicate"
        verbose_name_plural = "Syndicates"

class SyndicateMember(models.Model):
    """
    Links stakeholders to syndicates they belong to.
    - Tracks membership in investment groups
    - One stakeholder can be part of multiple syndicates
    - One syndicate can have multiple stakeholders
    """
    syndicate = models.ForeignKey(Syndicate, on_delete=models.CASCADE, related_name='members')
    stakeholder = models.ForeignKey(Stakeholder, on_delete=models.CASCADE, related_name='syndicate_memberships')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Syndicate Member"
        verbose_name_plural = "Syndicate Members"
        unique_together = ('syndicate', 'stakeholder')

    def __str__(self):
        return f"{self.stakeholder.name} - {self.syndicate.name}"

class Security(models.Model):
    """Base security model"""
    SECURITY_TYPE_CHOICES = [
        ('common', 'Common Stock'),
        ('preferred', 'Preferred Stock'),
        ('convertible', 'Convertible Stock'),
        ('warrant', 'Warrant'),
        ('option', 'Option'),
        ('bond', 'Bond'),
    ]
    
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='securities')
    type = models.CharField(max_length=20, choices=SECURITY_TYPE_CHOICES)
    name = models.CharField(max_length=255, blank=True)
    price = models.DecimalField(max_digits=15, decimal_places=2)  # Price per share/unit
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} - {self.entity.name}"

    class Meta:
        verbose_name = "Security"
        verbose_name_plural = "Securities"

class SecurityStock(models.Model):
    """Stock-specific details"""
    security = models.OneToOneField(Security, on_delete=models.CASCADE, related_name='stock')
    is_preferred = models.BooleanField(default=False)
     
    """Only used if is_preferred=True"""
    liquidation_preference = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    has_participation = models.BooleanField(default=False)
    participation_cap = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    anti_dilution = models.CharField(max_length=50, choices=[
        ('none', 'None'),
        ('full_ratchet', 'Full Ratchet'),
        ('weighted_average', 'Weighted Average')
    ], default='none')

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

class SecurityOption(models.Model):
    """Option details (like ESOP)"""
    security = models.OneToOneField(Security, on_delete=models.CASCADE, related_name='option')
    expiration_date = models.DateField()
    is_esop = models.BooleanField(default=False)
    vesting_start = models.DateField(null=True, blank=True)
    vesting_months = models.IntegerField(null=True, blank=True)
    cliff_months = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Option details for {self.security}"

    class Meta:
        verbose_name = "Security Option"
        verbose_name_plural = "Security Options"

class SecurityBond(models.Model):
    """Bond details"""
    security = models.OneToOneField(Security, on_delete=models.CASCADE, related_name='bond')
    face_value = models.DecimalField(max_digits=15, decimal_places=2)
    coupon_rate = models.DecimalField(max_digits=5, decimal_places=2)
    maturity_date = models.DateField()
    interest_frequency = models.CharField(max_length=20, choices=[
        ('annual', 'Annual'),
        ('semi_annual', 'Semi-Annual'),
        ('quarterly', 'Quarterly'),
        ('monthly', 'Monthly')
    ])

    def __str__(self):
        return f"Bond details for {self.security}"

    class Meta:
        verbose_name = "Security Bond"
        verbose_name_plural = "Security Bonds"

class ConversionEvent(models.Model):
    """
    Records security conversion events.
    - Tracks convertible note conversions to equity
    - Records option exercises
    - Maintains conversion price history
    - Links original and resulting securities
    - Calculates conversion ratios and amounts
    - Used for cap table updates
    """
    from_security = models.ForeignKey(Security, on_delete=models.CASCADE, related_name='conversions_from')
    to_security = models.ForeignKey(Security, on_delete=models.CASCADE, related_name='conversions_to')
    stakeholder = models.ForeignKey(Stakeholder, on_delete=models.CASCADE, related_name='conversions')
    conversion_date = models.DateField()
    original_amount = models.DecimalField(max_digits=15, decimal_places=2)
    accrued_interest = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    conversion_price = models.DecimalField(max_digits=15, decimal_places=2)
    new_shares = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversion: {self.from_security} to {self.to_security} for {self.stakeholder.name}"

    class Meta:
        verbose_name = "Conversion Event"
        verbose_name_plural = "Conversion Events"

class FundingRound(models.Model):
    """
    Represents a fundraising event for an entity.
    - Both companies and funds can have funding rounds
    - Links to securities issued during the round
    - Tracks target and actual amounts raised
    - Used to organize investment transactions
    - Impacts cap table through dilution
    - Records pre and post-money valuations
    - Groups related security issuances
    - Helps track ownership changes by round
    """
    
    ROUND_TYPE_CHOICES = [
        ('seed', 'Seed'),
        ('series_a', 'Series A'),
        ('series_b', 'Series B'),
        ('series_c', 'Series C'),
        ('private', 'Private'),
        ('public', 'Public'),
    ]

    """Core fields for managing the fundraising round basics"""
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='funding_rounds')
    round_type = models.CharField(max_length=20, choices=ROUND_TYPE_CHOICES)
    target_amount = models.DecimalField(max_digits=15, decimal_places=2)
    raised_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    securities = models.ManyToManyField(Security, related_name='funding_rounds')
    date = models.DateField()
    
    """Fields for managing fundraising visibility and materials"""
    is_public = models.BooleanField(default=False, help_text="Whether this round is visible to potential investors")
    pitch_deck = models.FileField(upload_to='pitch_decks/', null=True, blank=True)
    investment_highlights = models.TextField(null=True, blank=True, help_text="Key investment highlights and opportunities")
    use_of_funds = models.TextField(null=True, blank=True, help_text="Detailed explanation of how funds will be used")
    
    """Fields for discovery and categorization of the fundraising round"""
    industry = models.CharField(max_length=100, null=True, blank=True, help_text="Primary industry sector")
    region = models.CharField(max_length=100, null=True, blank=True, help_text="Geographic region")
    stage = models.CharField(max_length=50, null=True, blank=True, help_text="Company/investment stage")
    
    """Timestamp fields for tracking record changes"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_round_type_display()} - {self.entity.name}"

    class Meta:
        verbose_name = "Funding Round"
        verbose_name_plural = "Funding Rounds"

class Transaction(models.Model):
    """
    Records all financial transactions involving securities.
    - Source of truth for all ownership calculations
    - Tracks every change in security ownership
    - Used to generate ownership snapshots (cap tables)
    - Records all types of security events
    - Maintains amount and share history
    - Links to specific funding rounds for investment tracking
    - Supports complex transactions (splits, transfers, conversions)
    - Used to calculate dilution and ownership changes
    - Provides audit trail for all ownership changes
    """
    TYPE_CHOICES = [
        ('issuance', 'Share Issuance'),
        ('transfer', 'Share Transfer'),
        ('conversion', 'Share Conversion'),
        ('redemption', 'Share Redemption'),
        ('capital_call', 'Capital Call'),
        ('distribution', 'Distribution'),
        ('split', 'Share Split'),
        ('consolidation', 'Share Consolidation'),
        ('cash_in', 'Cash In'),
        ('cash_out', 'Cash Out'),
        ('bond_interest', 'Bond Interest Payment'),
        ('bond_maturity', 'Bond Maturity Payment'),
    ]
    
    security = models.ForeignKey(Security, on_delete=models.CASCADE, related_name='transactions')
    stakeholder = models.ForeignKey(Stakeholder, on_delete=models.CASCADE, related_name='transactions')
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    shares = models.DecimalField(max_digits=15, decimal_places=2)
    transaction_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['transaction_date']
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"

    def __str__(self):
        return f"{self.get_type_display()} - {self.security} - {self.stakeholder.name}"

class OwnershipSnapshot(models.Model):
    """
    Point-in-time snapshot of entity ownership (cap table).
    - Calculated from Transaction history
    - Shows complete ownership structure at a given date
    - Used for reporting and analysis
    - Generated periodically or on-demand
    - Serves as the official cap table for the entity
    - Tracks dilution across funding rounds
    - Shows ownership by security type (common, preferred, etc.)
    - Used for investor reporting and compliance
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='ownership_snapshots')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        verbose_name = "Ownership Snapshot"
        verbose_name_plural = "Ownership Snapshots"

    def __str__(self):
        return f"Ownership Snapshot - {self.entity.name} ({self.date})"

class OwnershipEntry(models.Model):
    """
    Individual entries in an ownership snapshot (cap table entries).
    - Details each stakeholder's ownership
    - Links to specific securities and funding rounds
    - Records both percentage and absolute ownership
    - Part of the ownership snapshot system
    - Tracks ownership by investment round
    - Shows fully-diluted ownership
    - Includes options and warrants for fully-diluted cap table
    - Maintains historical record of ownership changes
    """
    snapshot = models.ForeignKey(OwnershipSnapshot, on_delete=models.CASCADE, related_name='entries')
    security = models.ForeignKey(Security, on_delete=models.CASCADE)
    stakeholder = models.ForeignKey(Stakeholder, on_delete=models.CASCADE)
    funding_round = models.ForeignKey(FundingRound, on_delete=models.CASCADE, related_name='ownership_entries', null=True, blank=True)
    ownership_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    number_of_shares = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.stakeholder.name} - {self.security.get_type_display()}"

    class Meta:
        verbose_name = "Ownership Entry"
        verbose_name_plural = "Ownership Entries"

class IncomeStatement(models.Model):
    """Records detailed profit & loss data for entities"""
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='income_statements')
    frequency = models.CharField(max_length=10, choices=[
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual')
    ], default='quarterly')
    period_start = models.DateField()
    period_end = models.DateField()
    revenue = models.DecimalField(max_digits=20, decimal_places=2)
    cost_of_goods_sold = models.DecimalField(max_digits=20, decimal_places=2)
    gross_profit = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    operating_expenses = models.DecimalField(max_digits=20, decimal_places=2)
    operating_income = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    non_operating_income = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    net_income = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_end']
        verbose_name = "Income Statement"
        verbose_name_plural = "Income Statements"

    def save(self, *args, **kwargs):
        self.gross_profit = self.revenue - self.cost_of_goods_sold
        self.operating_income = self.gross_profit - self.operating_expenses
        self.net_income = self.operating_income + self.non_operating_income
        super().save(*args, **kwargs)

class BalanceSheet(models.Model):
    """Tracks assets, liabilities and equity for entities"""
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='balance_sheets')
    frequency = models.CharField(max_length=10, choices=[
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual')
    ], default='quarterly')
    as_of_date = models.DateField()
    current_assets = models.DecimalField(max_digits=20, decimal_places=2)
    non_current_assets = models.DecimalField(max_digits=20, decimal_places=2)
    total_assets = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    current_liabilities = models.DecimalField(max_digits=20, decimal_places=2)
    non_current_liabilities = models.DecimalField(max_digits=20, decimal_places=2)
    total_liabilities = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    equity = models.DecimalField(max_digits=20, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-as_of_date']
        verbose_name = "Balance Sheet"
        verbose_name_plural = "Balance Sheets"

    def save(self, *args, **kwargs):
        self.total_assets = self.current_assets + self.non_current_assets
        self.total_liabilities = self.current_liabilities + self.non_current_liabilities
        super().save(*args, **kwargs)

class CashFlowStatement(models.Model):
    """Monitors cash movements across operating, investing and financing activities"""
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='cash_flow_statements')
    frequency = models.CharField(max_length=10, choices=[
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual')
    ], default='quarterly')
    period_start = models.DateField()
    period_end = models.DateField()
    cash_flow_operating = models.DecimalField(max_digits=20, decimal_places=2)
    cash_flow_investing = models.DecimalField(max_digits=20, decimal_places=2)
    cash_flow_financing = models.DecimalField(max_digits=20, decimal_places=2)
    net_change_in_cash = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_end']
        verbose_name = "Cash Flow Statement"
        verbose_name_plural = "Cash Flow Statements"

    def save(self, *args, **kwargs):
        self.net_change_in_cash = (
            self.cash_flow_operating + 
            self.cash_flow_investing + 
            self.cash_flow_financing
        )
        super().save(*args, **kwargs)

class KPIDefinition(models.Model):
    """Defines custom KPI metrics that can be tracked for any entity"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_global = models.BooleanField(default=True)
    data_type = models.CharField(max_length=50, default='decimal', choices=[
        ('decimal', 'Decimal'),
        ('integer', 'Integer'),
        ('string', 'String')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "KPI Definition"
        verbose_name_plural = "KPI Definitions"

    def __str__(self):
        return self.name

class EntityKPI(models.Model):
    """Records values for entity-specific KPIs"""
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='kpis')
    kpi_definition = models.ForeignKey(KPIDefinition, on_delete=models.CASCADE, related_name='kpi_values')
    date = models.DateField()
    value = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        verbose_name = "Entity KPI"
        verbose_name_plural = "Entity KPIs"

    def __str__(self):
        return f"{self.entity.name} - {self.kpi_definition.name} on {self.date}"

class EntityNAV(models.Model):
    """
    Net Asset Value calculation for entities.
    - Primarily used for fund-type entities
    - Calculated from asset valuations
    - Key metric for fund performance
    - Updated periodically
    - Used for investor reporting
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='nav_reports')
    report_date = models.DateField(default=timezone.now)
    nav_value = models.DecimalField(max_digits=20, decimal_places=2)
    
    class Meta:
        ordering = ['-report_date']
        verbose_name = "Entity NAV"
        verbose_name_plural = "Entity NAVs"
    
    def __str__(self):
        return f"NAV for {self.entity.name} on {self.report_date}"

class EntityFee(models.Model):
    """
    Records management fees, performance fees, and other costs for an Entity.
    - Tracks various fee types (management, performance, setup, etc.)
    - Supports both fixed and percentage-based fees
    - Records fee frequency and payment schedule
    - Maintains audit trail of all entity costs
    - Essential for fund expense tracking and reporting
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='fees')
    
    FEE_TYPE_CHOICES = [
        ('management', 'Management Fee'),
        ('performance', 'Performance Fee'),
        ('setup', 'Setup Fee'),
        ('administrative', 'Administrative Cost'),
        ('legal', 'Legal Cost'),
        ('audit', 'Audit Cost'),
        ('custodian', 'Custodian Fee'),
        ('other', 'Other Cost')
    ]
    
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    frequency = models.CharField(max_length=20, choices=[
        ('one_time', 'One Time'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual')
    ], default='one_time')
    percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        help_text="If fee is percentage based"
    )
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        verbose_name = "Entity Fee"
        verbose_name_plural = "Entity Fees"
    
    def __str__(self):
        return f"{self.get_fee_type_display()} - {self.entity.name} - {self.date}"

class EntityPerformance(models.Model):
    """
    Comprehensive performance metrics for entities.
    - Tracks key investment metrics
    - Used for both funds and companies
    - Includes standard industry metrics (IRR, TVPI, etc.)
    - Supports performance analysis and reporting
    - Critical for investor communications
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='performances')
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
        verbose_name = "Entity Performance"
        verbose_name_plural = "Entity Performances"
    
    def __str__(self):
        return f"Performance for {self.entity.name} on {self.report_date}"

class EntityPortfolioSummary(models.Model):
    """
    Provides an aggregated view of an entity's portfolio and key investment metrics.
    - Summarizes investment performance
    - Tracks ownership and valuation changes
    - Includes ILPA-compliant metrics
    - Used for portfolio monitoring
    - Supports investment decision making
    """
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='portfolio_summaries')
    investment_name = models.CharField(max_length=255)
    investment_type = models.CharField(max_length=50, choices=[('company', 'Company'), ('fund', 'Fund')])
    original_investment_date = models.DateField(null=True, blank=True)
    initial_ownership_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    current_ownership_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    invested_amount_to_date = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    total_original_cost = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    current_fair_value = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    multiple_to_cost = models.DecimalField("Multiple to Cost", max_digits=10, decimal_places=2, null=True, blank=True)
    gross_irr = models.DecimalField("Gross IRR", max_digits=5, decimal_places=2, null=True, blank=True)
    current_nav = models.DecimalField("Current NAV", max_digits=20, decimal_places=2, null=True, blank=True)
    export_functionality = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Entity Portfolio Summary"
        verbose_name_plural = "Entity Portfolio Summaries"

    def __str__(self):
        return f"Portfolio Summary for {self.entity.name} - {self.investment_name}"
