"""
EntityDealProfile Schemas

Pydantic schemas for the EntityDealProfile model following simplified schema guidelines.
"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum

# ==========================================
# Enum Types
# ==========================================

class EntityDealType(str, Enum):
    """Entity deal profile type options"""
    COMPANY = "company"
    FUND = "fund"
    TARGET = "target"
    INDIVIDUAL = "individual"

# ==========================================
# EntityDealProfile Schema (Full Representation)
# ==========================================

class EntityDealProfile(BaseModel):
    """EntityDealProfile schema - full representation"""
    id: int
    entity_id: int = Field(description="Associated entity ID (unique, 1:1)")
    entity_type: EntityDealType = Field(description="Entity deal profile type")

    # Basic Info (common to all types)
    industry: str = Field(description="Industry sector")
    location: str = Field(max_length=2, description="Country code (e.g. GB)")
    website: str | None = Field(None, description="Website URL")
    year_founded: int | None = Field(None, description="Year founded")

    # Financial Overview (common to all types)
    current_valuation: float | None = Field(None, description="Current valuation")
    latest_raise_amount: float | None = Field(None, description="Latest raise amount")
    total_raised: float | None = Field(None, description="Total amount raised")

    # Company-specific fields
    stage: str | None = Field(None, description="Company stage (e.g. PreSeed)")
    short_description: str = Field(description="Short description")
    problem_description: str = Field(description="Problem description")
    solution_description: str = Field(description="Solution description")
    how_it_works: str = Field(description="How it works")
    market_size: float | None = Field(None, description="Market size")
    competitors: str | None = Field(None, description="Competitors")
    competitive_advantage: str | None = Field(None, description="Competitive advantage")
    growth_metrics: str | None = Field(None, description="Growth metrics")

    # Fund-specific fields
    investment_strategy: str | None = Field(None, description="Investment strategy")
    fund_size: float | None = Field(None, description="Fund size")
    fund_terms: str | None = Field(None, description="Fund terms")
    track_record: str | None = Field(None, description="Track record")
    fund_type: str | None = Field(None, description="Fund type (e.g. Venture Capital)")
    investment_focus: str | None = Field(None, description="Investment focus")
    fund_lifecycle: str | None = Field(None, description="Fund lifecycle stage")
    vintage_year: int | None = Field(None, description="Vintage year")

    # M&A-specific fields
    synergy_potential: str | None = Field(None, description="Synergy potential")
    key_assets: str | None = Field(None, description="Key assets")
    market_position: str | None = Field(None, description="Market position")
    integration_plan: str | None = Field(None, description="Integration plan")
    acquisition_rationale: str | None = Field(None, description="Acquisition rationale")
    financial_metrics: str | None = Field(None, description="Financial metrics for valuation")
    risk_factors: str | None = Field(None, description="Risk factors")
    deal_readiness: str | None = Field(None, description="Deal readiness status")

    # Team & Relationships (JSON)
    team_members: dict | None = Field(None, description="Team members (JSON)")
    relationships: dict | None = Field(None, description="Relationships (JSON)")

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Input Schemas
# ==========================================

class EntityDealProfileCreate(BaseModel):
    """Schema for creating a new entity deal profile"""
    entity_id: int = Field(description="Associated entity ID (unique, 1:1)")
    entity_type: EntityDealType = Field(default=EntityDealType.COMPANY, description="Entity deal profile type")

    # Basic Info
    industry: str = Field(max_length=100, description="Industry sector")
    location: str = Field(max_length=2, description="Country code (e.g. GB)")
    website: str | None = Field(None, max_length=255, description="Website URL")
    year_founded: int | None = Field(None, description="Year founded")

    # Financial Overview
    current_valuation: float | None = Field(None, description="Current valuation")
    latest_raise_amount: float | None = Field(None, description="Latest raise amount")
    total_raised: float | None = Field(None, description="Total amount raised")

    # Company-specific fields
    stage: str | None = Field(None, max_length=50, description="Company stage")
    short_description: str = Field(description="Short description")
    problem_description: str = Field(description="Problem description")
    solution_description: str = Field(description="Solution description")
    how_it_works: str = Field(description="How it works")
    market_size: float | None = Field(None, description="Market size")
    competitors: str | None = Field(None, description="Competitors")
    competitive_advantage: str | None = Field(None, description="Competitive advantage")
    growth_metrics: str | None = Field(None, description="Growth metrics")

    # Fund-specific fields
    investment_strategy: str | None = Field(None, description="Investment strategy")
    fund_size: float | None = Field(None, description="Fund size")
    fund_terms: str | None = Field(None, description="Fund terms")
    track_record: str | None = Field(None, description="Track record")
    fund_type: str | None = Field(None, max_length=50, description="Fund type")
    investment_focus: str | None = Field(None, description="Investment focus")
    fund_lifecycle: str | None = Field(None, max_length=50, description="Fund lifecycle stage")
    vintage_year: int | None = Field(None, description="Vintage year")

    # M&A-specific fields
    synergy_potential: str | None = Field(None, description="Synergy potential")
    key_assets: str | None = Field(None, description="Key assets")
    market_position: str | None = Field(None, description="Market position")
    integration_plan: str | None = Field(None, description="Integration plan")
    acquisition_rationale: str | None = Field(None, description="Acquisition rationale")
    financial_metrics: str | None = Field(None, description="Financial metrics for valuation")
    risk_factors: str | None = Field(None, description="Risk factors")
    deal_readiness: str | None = Field(None, max_length=50, description="Deal readiness status")

    # Team & Relationships (JSON)
    team_members: dict | None = Field(None, description="Team members (JSON)")
    relationships: dict | None = Field(None, description="Relationships (JSON)")

class EntityDealProfileUpdate(BaseModel):
    """Schema for updating an entity deal profile"""
    entity_id: int | None = None
    entity_type: EntityDealType | None = None

    # Basic Info
    industry: str | None = Field(None, max_length=100)
    location: str | None = Field(None, max_length=2)
    website: str | None = Field(None, max_length=255)
    year_founded: int | None = None

    # Financial Overview
    current_valuation: float | None = None
    latest_raise_amount: float | None = None
    total_raised: float | None = None

    # Company-specific fields
    stage: str | None = Field(None, max_length=50)
    short_description: str | None = None
    problem_description: str | None = None
    solution_description: str | None = None
    how_it_works: str | None = None
    market_size: float | None = None
    competitors: str | None = None
    competitive_advantage: str | None = None
    growth_metrics: str | None = None

    # Fund-specific fields
    investment_strategy: str | None = None
    fund_size: float | None = None
    fund_terms: str | None = None
    track_record: str | None = None
    fund_type: str | None = Field(None, max_length=50)
    investment_focus: str | None = None
    fund_lifecycle: str | None = Field(None, max_length=50)
    vintage_year: int | None = None

    # M&A-specific fields
    synergy_potential: str | None = None
    key_assets: str | None = None
    market_position: str | None = None
    integration_plan: str | None = None
    acquisition_rationale: str | None = None
    financial_metrics: str | None = None
    risk_factors: str | None = None
    deal_readiness: str | None = Field(None, max_length=50)

    # Team & Relationships (JSON)
    team_members: dict | None = None
    relationships: dict | None = None

# ==========================================
# Response Types
# ==========================================

class EntityDealProfileResponse(BaseModel):
    """Response containing a single entity deal profile"""
    success: bool
    data: EntityDealProfile | None = None
    error: str | None = None

class EntityDealProfilesResponse(BaseModel):
    """Response containing multiple entity deal profiles"""
    success: bool
    data: list[EntityDealProfile] | None = None
    error: str | None = None
