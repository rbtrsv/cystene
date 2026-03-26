from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, UniqueConstraint, Date
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from datetime import date as date_type
from typing import Optional
from core.db import Base
from .mixin_models import BaseMixin


class DealPipeline(Base, BaseMixin):
    """
    Tracks potential deals in the pipeline.
    Manages deal flow from initial screening to closing.
    - target_entity_id: if target company is on platform (has Entity record)
    - company_name: fallback if target is not on platform yet
    """
    __tablename__ = "deal_pipeline"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Core Details
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)  # Investor entity
    # SET NULL: deal pipeline belongs to the investor entity. Target company leaving the platform
    # shouldn't wipe the investor's deal records. Falls back to company_name field.
    target_entity_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("entities.id", ondelete="SET NULL"), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Fallback if target not on platform
    deal_name: Mapped[str] = mapped_column(String(255), nullable=False)
    priority: Mapped[str] = mapped_column(String(2), nullable=False)  # 'p1', 'p2', 'p3', 'p4', 'p5'
    status: Mapped[str] = mapped_column(String(50), default="initial_screening", nullable=False)
    round_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'pre_seed', 'seed', 'series_a', etc.
    sector: Mapped[str] = mapped_column(String(50), nullable=False)  # 'fintech', 'healthtech', etc.

    # Investment Details
    target_raise: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    pre_money_valuation: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    post_money_valuation: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    expected_ownership: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    investment_amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    is_lead_investor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    other_investors: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timeline
    first_contact_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    last_interaction_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    next_meeting_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    expected_close_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)

    # Notes & Analysis
    investment_thesis: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_risks: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_diligence_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_steps: Mapped[str | None] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Tracking
    assigned_to_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class Holding(Base, BaseMixin):
    """
    Represents any asset or activity belonging to an entity.
    - Investment position: entity owns stake in another entity (target_entity_id set)
    - Business line: entity runs an internal division (company_name set, no target_entity_id)
    - target_entity_id: if target is a full Entity on platform (optional)
    - company_name: fallback if just tracking by name, or business line name
    """
    __tablename__ = "holdings"
    __table_args__ = (UniqueConstraint('entity_id', 'target_entity_id', 'funding_round_id'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Core investment fields
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)  # Owner entity
    # SET NULL: if target company deletes its account, the investor's holding record stays —
    # just loses the platform link. Still shows investment via company_name fallback.
    target_entity_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("entities.id", ondelete="SET NULL"), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Fallback name or business line name
    funding_round_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("funding_rounds.id", ondelete="CASCADE"), nullable=True)

    investment_name: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # From Entity.entity_type
    investment_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'equity', 'debt', 'convertible', etc.
    investment_round: Mapped[str | None] = mapped_column(String(50), nullable=True)
    investment_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)  # 'active', 'exited', 'written_off'
    sector: Mapped[str] = mapped_column(String(50), nullable=False)
    listing_status: Mapped[str] = mapped_column(String(20), default="private", nullable=False)  # 'private', 'public', 'delisted'
    original_investment_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)

    # Investment amounts and ownership
    total_investment_amount: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    ownership_percentage: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    invested_as_percent_capital: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    # Share and price information (primarily for public companies)
    number_of_shares: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    average_cost_per_share: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    current_share_price: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    share_price_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Public company specific information
    stock_ticker: Mapped[str | None] = mapped_column(String(10), nullable=True)
    exchange: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Performance metrics
    current_fair_value: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    moic: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)  # Money on Invested Capital
    irr: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)  # Internal Rate of Return

    # Additional fields
    export_functionality: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    cash_flows: Mapped[list["HoldingCashFlow"]] = relationship(back_populates="holding", cascade="all, delete-orphan")


class HoldingCashFlow(Base, BaseMixin):
    """
    Tracks cash flows for IRR calculation at holding and round level.
    - Records both actual and projected cash flows
    - Groups related cash flows for IRR calculation
    - Supports different types of cash flows (investments, distributions, etc.)
    - Can be used for both historical IRR and forward-looking IRR
    """
    __tablename__ = "holding_cash_flows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Core relationships
    holding_id: Mapped[int] = mapped_column(Integer, ForeignKey("holdings.id", ondelete="CASCADE"), nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    # SET NULL: cash flow records are needed for IRR calculation — losing the target link is fine,
    # losing the cash flow data is not. Keeps the record when target entity is deleted.
    target_entity_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("entities.id", ondelete="SET NULL"), nullable=True)
    funding_round_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("funding_rounds.id", ondelete="CASCADE"), nullable=True)

    # Cash flow details
    date: Mapped[date_type] = mapped_column(Date, nullable=False)

    # Transaction Amounts (debit/credit approach from Drizzle)
    amount_debit: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    amount_credit: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)

    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    cash_flow_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'investment', 'distribution', 'dividend', etc.
    category: Mapped[str] = mapped_column(String(20), default="actual", nullable=False)  # 'actual', 'projected'
    scenario: Mapped[str] = mapped_column(String(20), default="actual", nullable=False)

    # Optional link to actual transaction
    cash_transaction_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("security_transactions.id", ondelete="SET NULL"), nullable=True)

    # Additional fields
    transaction_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    include_in_irr: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    holding: Mapped["Holding"] = relationship(back_populates="cash_flows")


class HoldingPerformance(Base, BaseMixin):
    """
    Comprehensive performance metrics for entities.
    - Tracks key investment metrics
    - Used for both funds and companies
    - Includes standard industry metrics (IRR, TVPI, etc.)
    - Can be tracked at both entity and round level
    """
    __tablename__ = "holding_performances"
    __table_args__ = (UniqueConstraint('entity_id', 'funding_round_id', 'report_date'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    funding_round_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("funding_rounds.id", ondelete="CASCADE"), nullable=True)

    # Performance data
    report_date: Mapped[date_type] = mapped_column(Date, default=func.current_date(), nullable=False)
    total_invested_amount: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    fair_value: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    cash_realized: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Key performance indicators
    tvpi: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)  # Total Value to Paid-in Capital
    dpi: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)   # Distributions to Paid-in Capital
    rvpi: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)  # Residual Value to Paid-in Capital
    irr: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)    # Internal Rate of Return
    multiple_to_cost: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)


class Valuation(Base, BaseMixin):
    """
    Point-in-time valuation for an entity or specific funding round.
    - For funds: this is the NAV (Net Asset Value)
    - For companies: this is the company valuation
    - Works for any entity type
    """
    __tablename__ = "valuations"
    __table_args__ = (UniqueConstraint('entity_id', 'funding_round_id', 'date'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    funding_round_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("funding_rounds.id", ondelete="CASCADE"), nullable=True)

    date: Mapped[date_type] = mapped_column(Date, default=func.current_date(), nullable=False)
    valuation_value: Mapped[float] = mapped_column(Numeric(20, 2), nullable=False)

    # Fund-specific fields (nullable — only fund-type entities use these)
    total_fund_units: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)  # Total units issued
    nav_per_share: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)     # valuation_value / total_fund_units

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
