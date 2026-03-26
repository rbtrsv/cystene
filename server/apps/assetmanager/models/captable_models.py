from sqlalchemy import Integer, String, Boolean, ForeignKey, Text, Numeric, Date
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import date as date_type
from typing import Optional
from core.db import Base
from .mixin_models import BaseMixin


class FundingRound(Base, BaseMixin):
    """
    Historical record of a completed fundraising round.
    Tracks investment terms, valuations, documents,
    and securities issued. Links to cap table changes
    and stakeholder transactions.
    """
    __tablename__ = "funding_rounds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Core fields
    # RESTRICT: funding rounds have securities → transactions → cap table entries chain.
    # Major financial records — user must consciously delete rounds before deleting entity.
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    round_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'seed', 'series_a', 'series_b', etc.
    date: Mapped[date_type] = mapped_column(Date, nullable=False)

    # Investment terms
    target_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    raised_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    pre_money_valuation: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    post_money_valuation: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)

    # Relationships
    securities: Mapped[list["Security"]] = relationship(back_populates="funding_round", cascade="all, delete-orphan")
    security_transactions: Mapped[list["SecurityTransaction"]] = relationship(back_populates="funding_round", cascade="all, delete-orphan")
    cap_table_entries: Mapped[list["CapTableEntry"]] = relationship(back_populates="funding_round", cascade="all, delete-orphan")
    fees: Mapped[list["Fee"]] = relationship(back_populates="funding_round", cascade="all, delete-orphan")


class Security(Base, BaseMixin):
    """
    All security types in one table (Drizzle approach).
    Securities are created for specific funding rounds.
    - Each round can issue different types of securities
    - Securities have round-specific terms and prices
    - Used to track ownership and transactions
    """
    __tablename__ = "securities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Basic Security Information
    # RESTRICT: securities define ownership terms (shares, SAFEs, options). Can't delete
    # a funding round while securities reference it — must delete securities first.
    funding_round_id: Mapped[int] = mapped_column(Integer, ForeignKey("funding_rounds.id", ondelete="RESTRICT"), nullable=False)
    security_name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    security_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'common', 'preferred', 'convertible', 'safe', 'warrant', 'option', 'bond'
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    issue_price: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    special_terms: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Stock Fields (Common & Preferred Shares)
    is_preferred: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Voting Rights (Both Common & Preferred)
    has_voting_rights: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    voting_ratio: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    # Dividend Rights (Primarily Preferred)
    has_dividend_rights: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    dividend_rate: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    is_dividend_cumulative: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Liquidation & Participation (Preferred Only)
    liquidation_preference: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    has_participation: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    participation_cap: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    seniority: Mapped[int | None] = mapped_column(Integer, nullable=True)
    anti_dilution: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 'none', 'full_ratchet', 'weighted_average'

    # Conversion Rights (Preferred Only)
    has_conversion_rights: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    conversion_ratio: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)

    # Redemption Rights (Preferred Only)
    has_redemption_rights: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    redemption_term: Mapped[int | None] = mapped_column(Integer, nullable=True)  # in months

    # Convertible Security Fields
    interest_rate: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    interest_rate_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    interest_period: Mapped[str | None] = mapped_column(Text, nullable=True)
    maturity_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    valuation_cap: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    conversion_discount: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    conversion_basis: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Option-Specific Fields (Employee Compensation)
    option_type: Mapped[str | None] = mapped_column(Text, nullable=True)  # 'esop', 'vsop', 'sar'

    # Vesting & Exercise Terms (Options Only)
    vesting_start: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    vesting_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cliff_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vesting_schedule_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    exercise_window_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    strike_price: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    expiration_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    termination_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)

    # Option Pool Management (Options Only)
    pool_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    pool_size: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    pool_available: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    is_active: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Warrant-Specific Fields (Investment Instruments)
    warrant_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_detachable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deal_context: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_transferable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Shared Option/Warrant Fields
    total_shares: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    issue_rights: Mapped[str | None] = mapped_column(String(50), nullable=True)
    convert_to: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Bond Fields
    principal: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    coupon_rate: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    coupon_frequency: Mapped[str | None] = mapped_column(Text, nullable=True)
    principal_frequency: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenure_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    moratorium_period: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    funding_round: Mapped["FundingRound"] = relationship(back_populates="securities")
    security_transactions: Mapped[list["SecurityTransaction"]] = relationship(back_populates="security", cascade="all, delete-orphan")
    cap_table_entries: Mapped[list["CapTableEntry"]] = relationship(back_populates="security", cascade="all, delete-orphan")


class SecurityTransaction(Base, BaseMixin):
    """
    Double-entry security transaction tracking.
    - Records issuance, transfers, conversions with debit/credit entries
    - Each transaction should have matching entries (debits = credits)
    - Transaction reference groups related entries together
    - security_id = NULL means fund-level transaction (capital calls, distributions, fees)
    - security_id = valid_id means security-level transaction (issuance, transfer, conversion)
    """
    __tablename__ = "security_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Core relationships
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    stakeholder_id: Mapped[int] = mapped_column(Integer, ForeignKey("stakeholders.id", ondelete="CASCADE"), nullable=False)
    funding_round_id: Mapped[int] = mapped_column(Integer, ForeignKey("funding_rounds.id", ondelete="CASCADE"), nullable=False)
    # RESTRICT: can't delete a security while transactions reference it — preserves ledger integrity.
    security_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("securities.id", ondelete="RESTRICT"), nullable=True)

    # Transaction details
    transaction_reference: Mapped[str] = mapped_column(String(50), nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'issuance', 'transfer', 'conversion', etc.
    units_debit: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    units_credit: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)

    # Amount fields for cash transactions
    amount_debit: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    amount_credit: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)

    transaction_date: Mapped[date_type] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Optional link to related transaction (e.g., for conversions)
    related_transaction_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("security_transactions.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    funding_round: Mapped["FundingRound"] = relationship(back_populates="security_transactions")
    security: Mapped[Optional["Security"]] = relationship(back_populates="security_transactions")
    related_transaction: Mapped[Optional["SecurityTransaction"]] = relationship("SecurityTransaction", remote_side=[id])


class CapTableSnapshot(Base, BaseMixin):
    """
    Point-in-time snapshot of the complete cap table.
    - Captures full ownership structure at specific moments
    - Typically created after major events (funding rounds, exits, etc.)
    - Allows historical comparison of ownership changes over time
    - Groups related CapTableEntry records together
    """
    __tablename__ = "cap_table_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    funding_round_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("funding_rounds.id", ondelete="CASCADE"), nullable=True)

    # Snapshot metadata
    snapshot_date: Mapped[date_type] = mapped_column(Date, nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)  # e.g., "Post Series A", "Pre-Exit"
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    entries: Mapped[list["CapTableEntry"]] = relationship(back_populates="snapshot", cascade="all, delete-orphan")


class CapTableEntry(Base, BaseMixin):
    """
    Individual entries in a cap table snapshot.
    - Details each stakeholder's ownership
    - Links to specific securities and funding rounds
    - Records both percentage and absolute ownership
    """
    __tablename__ = "cap_table_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    snapshot_id: Mapped[int] = mapped_column(Integer, ForeignKey("cap_table_snapshots.id", ondelete="CASCADE"), nullable=False)
    security_id: Mapped[int] = mapped_column(Integer, ForeignKey("securities.id", ondelete="CASCADE"), nullable=False)
    stakeholder_id: Mapped[int] = mapped_column(Integer, ForeignKey("stakeholders.id", ondelete="CASCADE"), nullable=False)
    funding_round_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("funding_rounds.id", ondelete="CASCADE"), nullable=True)

    # Ownership details
    ownership_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    number_of_shares: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)

    # Relationships
    snapshot: Mapped["CapTableSnapshot"] = relationship(back_populates="entries")
    security: Mapped["Security"] = relationship(back_populates="cap_table_entries")
    funding_round: Mapped[Optional["FundingRound"]] = relationship(back_populates="cap_table_entries")


class Fee(Base, BaseMixin):
    """
    Records fees for an entity.
    Can be tracked at both entity and round level.
    """
    __tablename__ = "fees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    funding_round_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("funding_rounds.id", ondelete="CASCADE"), nullable=True)

    # Time dimensions
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[str | None] = mapped_column(String(2), nullable=True)  # 'Q1', 'Q2', 'Q3', 'Q4'
    semester: Mapped[str | None] = mapped_column(String(2), nullable=True)  # 'S1', 'S2'
    month: Mapped[str | None] = mapped_column(String(9), nullable=True)
    full_year: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    scenario: Mapped[str] = mapped_column(String(20), default="actual", nullable=False)  # 'actual', 'forecast', 'budget'

    # Period dimension
    date: Mapped[date_type | None] = mapped_column(Date, nullable=True)

    # Fee details
    fee_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'management', 'performance', 'setup', 'administrative', etc.
    fee_cost_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    frequency: Mapped[str] = mapped_column(String(20), default="one_time", nullable=False)  # 'one_time', 'monthly', 'quarterly', 'annual'
    amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    percentage: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    transaction_reference: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    funding_round: Mapped[Optional["FundingRound"]] = relationship(back_populates="fees")
