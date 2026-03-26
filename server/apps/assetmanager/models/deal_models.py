from sqlalchemy import Integer, String, Boolean, ForeignKey, Text, Numeric, UniqueConstraint, Date, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import date as date_type
from core.db import Base
from .mixin_models import BaseMixin


class EntityDealProfile(Base, BaseMixin):
    """
    Extended profile information for different entity types:
    - Companies: Product, market, and growth details
    - Funds: Investment strategy and track record
    - M&A Targets: Market position and deal potential
    - Individuals: Professional background and investment history
    """
    __tablename__ = "entity_deal_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), unique=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(20), default="company", nullable=False)  # 'company', 'fund', 'target', 'individual'

    # Basic Info (common to all types)
    industry: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(2), nullable=False)  # Country code e.g. GB
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    year_founded: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Financial Overview (common to all types)
    current_valuation: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    latest_raise_amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    total_raised: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)

    # Company-specific fields
    stage: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g. PreSeed
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    problem_description: Mapped[str] = mapped_column(Text, nullable=False)
    solution_description: Mapped[str] = mapped_column(Text, nullable=False)
    how_it_works: Mapped[str] = mapped_column(Text, nullable=False)
    market_size: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    competitors: Mapped[str | None] = mapped_column(Text, nullable=True)
    competitive_advantage: Mapped[str | None] = mapped_column(Text, nullable=True)
    growth_metrics: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Fund-specific fields
    investment_strategy: Mapped[str | None] = mapped_column(Text, nullable=True)
    fund_size: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    fund_terms: Mapped[str | None] = mapped_column(Text, nullable=True)
    track_record: Mapped[str | None] = mapped_column(Text, nullable=True)
    fund_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g. Venture Capital, Private Equity
    investment_focus: Mapped[str | None] = mapped_column(Text, nullable=True)  # Target sectors, stages, geographies
    fund_lifecycle: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g. Fundraising, Investment Period, Harvest
    vintage_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # M&A-specific fields
    synergy_potential: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_assets: Mapped[str | None] = mapped_column(Text, nullable=True)
    market_position: Mapped[str | None] = mapped_column(Text, nullable=True)
    integration_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    acquisition_rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    financial_metrics: Mapped[str | None] = mapped_column(Text, nullable=True)  # Key financial metrics for valuation
    risk_factors: Mapped[str | None] = mapped_column(Text, nullable=True)
    deal_readiness: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Team & Relationships (stored as JSON for flexibility)
    # Team members format: [{"name": "John Doe", "role": "CEO", "position": "Chief Executive Officer", "bio": "...", "linkedin_url": "...", "photo": "...", "order": 0}]
    team_members: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships format: [{"name": "Google", "relationship_type": "client", "logo": "...", "website_url": "...", "description": "...", "start_date": "2024-01-01", "order": 0}]
    relationships: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class Deal(Base, BaseMixin):
    """
    Active deal tracking (fundraising/M&A/secondary/debt).
    Manages deal progress, commitments, documentation,
    and investor engagement.
    """
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Core Details
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    deal_type: Mapped[str] = mapped_column(String(20), default="fundraising", nullable=False)  # 'fundraising', 'acquisition', 'secondary', 'debt'

    # Financial Terms
    pre_money_valuation: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    post_money_valuation: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    target_amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    minimum_investment: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    share_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    share_allocation: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dilution: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    # Rights & Governance
    liquidation_preference: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    dividend_rights: Mapped[str | None] = mapped_column(String(100), nullable=True)
    anti_dilution: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pro_rata_rights: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    board_seats: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    veto_rights: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Dates
    start_date: Mapped[date_type] = mapped_column(Date, nullable=False)
    end_date: Mapped[date_type] = mapped_column(Date, nullable=False)
    expected_close_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)

    # Status & Progress
    soft_commitments: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    firm_commitments: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    profile_views: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    due_diligence_status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Documents (stored as file paths)
    pitch_deck: Mapped[str | None] = mapped_column(String(255), nullable=True)
    financial_model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    data_room_link: Mapped[str | None] = mapped_column(String(255), nullable=True)
    term_sheet: Mapped[str | None] = mapped_column(String(255), nullable=True)
    shareholders_agreement: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Additional Info
    investment_highlights: Mapped[str | None] = mapped_column(Text, nullable=True)
    use_of_funds: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Secondary Details
    seller_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("stakeholders.id", ondelete="SET NULL"), nullable=True)
    shares_offered: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Debt Details
    interest_rate: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    term_length: Mapped[int | None] = mapped_column(Integer, nullable=True)  # in months
    collateral: Mapped[str | None] = mapped_column(Text, nullable=True)

    # M&A Details
    acquisition_price: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    payment_structure: Mapped[str | None] = mapped_column(Text, nullable=True)
    deal_structure: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    commitments: Mapped[list["DealCommitment"]] = relationship(back_populates="deal", cascade="all, delete-orphan")


class DealCommitment(Base, BaseMixin):
    """
    Tracks commitments (soft and firm) from entities interested in a deal.
    - Soft commitments indicate interest level
    - Firm commitments are binding agreements
    - Tracks commitment history and status changes
    - Commitments can come from direct entities or through syndicates
    """
    __tablename__ = "deal_commitments"
    __table_args__ = (UniqueConstraint('deal_id', 'entity_id', 'syndicate_id'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    deal_id: Mapped[int] = mapped_column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    syndicate_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("syndicates.id", ondelete="SET NULL"), nullable=True)

    commitment_type: Mapped[str] = mapped_column(String(20), default="soft", nullable=False)  # 'soft', 'firm'
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    deal: Mapped["Deal"] = relationship(back_populates="commitments")
