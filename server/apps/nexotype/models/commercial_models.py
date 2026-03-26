"""
Nexotype Models — Section 10: Commercial Intelligence (IP & Deals)

Market organizations, patents, claims, assignees, asset ownership, transactions,
licensing agreements, development pipelines, regulatory approvals, technology platforms.
"""

from __future__ import annotations
from datetime import date
from sqlalchemy import Integer, String, ForeignKey, Text, Float, Date, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin, OwnableMixin


# ==========================================
# 10. COMMERCIAL INTELLIGENCE (IP & Deals)
# ==========================================

class MarketOrganization(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Issuer / Entity
    Purpose: Represents a player in the biotech market (Companies, Universities).
    Scope: Commercial Intelligence. Distinct from SaaS 'Organization' tenants.
    Usage: "Pfizer", "Harvard University".
    Type: NODE
    """
    __tablename__ = "market_organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    legal_name: Mapped[str] = mapped_column(String(255), index=True)

    # Financial Identifiers
    isin: Mapped[str | None] = mapped_column(String(12), unique=True, index=True)  # Global ID
    ticker_symbol: Mapped[str | None] = mapped_column(String(20), index=True)  # "PFE"
    primary_exchange: Mapped[str | None] = mapped_column(String(50))  # "NASDAQ"

    org_type: Mapped[str] = mapped_column(String(50))  # "Public", "Private", "University"
    status: Mapped[str] = mapped_column(String(50), default="Active")  # "Active", "Inactive", "Acquired", "Bankrupt"

    # Operational Data
    founded: Mapped[date | None] = mapped_column(Date)
    headquarters: Mapped[str | None] = mapped_column(String(255))
    website: Mapped[str | None] = mapped_column(String(500))
    employee_count: Mapped[int | None] = mapped_column(Integer)
    revenue_usd: Mapped[float | None] = mapped_column(Float)


class Patent(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: IP Instrument
    Purpose: Legal protection document.
    Scope: Commercial.
    Usage: "US Patent 11,234,567".
    Type: NODE
    """
    __tablename__ = "patents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    jurisdiction: Mapped[str] = mapped_column(String(10))  # "US", "WO", "EP", "CN", "JP"
    patent_number: Mapped[str] = mapped_column(String(50), index=True)
    title: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="Pending")  # "Pending", "Granted", "Expired", "Abandoned"
    filing_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)

    __table_args__ = (
        UniqueConstraint("jurisdiction", "patent_number", name="uq_patent_jurisdiction_number"),
    )


class PatentClaim(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Coverage Map
    Purpose: Links IP to Assets.
    Scope: Commercial.
    Usage: "Patent X covers Composition of Drug Y".
    Type: RELATION
    Connects: Patent → Asset
    """
    __tablename__ = "patent_claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patent_id: Mapped[int] = mapped_column(ForeignKey("patents.id"))
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    claim_type: Mapped[str] = mapped_column(String(50))  # "Composition", "Method"

    __table_args__ = (
        UniqueConstraint("patent_id", "asset_id", "claim_type", name="uq_patent_claim"),
    )


class PatentAssignee(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Rights Holder
    Purpose: Multiple organizations can co-own a patent.
    Scope: Commercial.
    Usage: "Pfizer and BioNTech co-own COVID vaccine patent".
    Type: RELATION
    Connects: Patent → Organization
    """
    __tablename__ = "patent_assignees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patent_id: Mapped[int] = mapped_column(ForeignKey("patents.id"))
    market_organization_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))
    assignment_date: Mapped[date] = mapped_column(Date)

    # Include assignment_date for ownership history tracking
    __table_args__ = (
        UniqueConstraint("patent_id", "market_organization_id", "assignment_date", name="uq_patent_assignee"),
    )


class AssetOwnership(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Rights Holder
    Purpose: Tracks current owner of an asset.
    Scope: Commercial.
    Usage: "Pfizer owns Rapamycin (Originator)".
    Type: RELATION
    Connects: Organization → Asset
    """
    __tablename__ = "asset_ownerships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    market_organization_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    ownership_type: Mapped[str] = mapped_column(String(50))  # "Originator", "Licensee"

    __table_args__ = (
        UniqueConstraint("market_organization_id", "asset_id", "ownership_type", name="uq_asset_ownership"),
    )


class Transaction(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Deal / M&A
    Purpose: Commercial events.
    Scope: Commercial Intelligence.
    Usage: "Pfizer acquired Seagen for $43B", "Pfizer licensed Drug X from BioNTech".
    Type: RELATION
    Connects: Organization → Organization (optionally via Asset or Patent)
    """
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))
    seller_id: Mapped[int | None] = mapped_column(ForeignKey("market_organizations.id"))

    # What was transacted (optional, for asset/patent-specific deals)
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("therapeutic_assets.id"))
    patent_id: Mapped[int | None] = mapped_column(ForeignKey("patents.id"))

    transaction_type: Mapped[str] = mapped_column(String(50))  # "Acquisition", "Licensing", "Divestiture"
    value_usd: Mapped[float | None] = mapped_column(Float)
    announced_date: Mapped[date] = mapped_column(Date)


class LicensingAgreement(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Commercial Partnership
    Purpose: Ongoing contractual relationships between organizations.
    Scope: Commercial Intelligence.
    Usage: "BioNTech licenses mRNA technology to Pfizer for COVID vaccine, 2020-2030".
    Type: RELATION
    Connects: Organization → Organization (optionally via Asset or Patent)
    """
    __tablename__ = "licensing_agreements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    licensor_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))
    licensee_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))

    # What is being licensed (optional)
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("therapeutic_assets.id"))
    patent_id: Mapped[int | None] = mapped_column(ForeignKey("patents.id"))

    agreement_type: Mapped[str] = mapped_column(String(50))  # "License", "Co-Development", "Distribution", "CMO", "CRADA"
    territory: Mapped[str | None] = mapped_column(String(100))  # "Global", "US", "EU", "Asia-Pacific"
    value_usd: Mapped[float | None] = mapped_column(Float)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(50))  # "Active", "Expired", "Terminated"


class DevelopmentPipeline(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Clinical Status
    Purpose: Tracks asset progress per disease.
    Scope: Commercial Valuation.
    Usage: "Drug X is Phase III for Alzheimer's".
    Type: RELATION
    Connects: Asset → Indication
    """
    __tablename__ = "development_pipelines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    indication_id: Mapped[int] = mapped_column(ForeignKey("indications.id"))

    phase: Mapped[str] = mapped_column(String(50))  # "Phase I", "Phase II", "Phase III"
    status: Mapped[str] = mapped_column(String(50))  # "Active", "Terminated"
    nct_number: Mapped[str | None] = mapped_column(String(20))  # ClinicalTrials.gov ID

    __table_args__ = (
        UniqueConstraint("asset_id", "indication_id", name="uq_development_pipeline"),
    )


class RegulatoryApproval(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Marketing Authorization
    Purpose: Records regulatory approval events for assets.
    Scope: Commercial Intelligence.
    Usage: "Rapamycin received FDA NDA approval for Alzheimer's on 2024-01-15".
    Type: RELATION
    Connects: Asset → Indication (via Agency)
    """
    __tablename__ = "regulatory_approvals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    indication_id: Mapped[int] = mapped_column(ForeignKey("indications.id"))

    agency: Mapped[str] = mapped_column(String(50))  # "FDA", "EMA", "PMDA", "NMPA", "TGA"
    approval_type: Mapped[str] = mapped_column(String(50))  # "NDA", "BLA", "510(k)", "Accelerated", "Conditional"
    approval_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(50))  # "Approved", "Withdrawn", "Tentative"

    __table_args__ = (
        UniqueConstraint("asset_id", "indication_id", "agency", name="uq_regulatory_approval"),
    )


class TechnologyPlatform(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Platform Technology
    Purpose: Strategic categorization of drug development methodologies.
    Scope: Commercial Intelligence.
    Usage: "mRNA", "CRISPR/Cas9", "CAR-T", "ADC", "AI Drug Discovery".
    Type: NODE
    Why: Investors ask "which companies are doing CRISPR?" and "how mature is mRNA?"
         This is distinct from asset_type (modality = what form the drug takes) —
         TechnologyPlatform = the methodology used to create it.
         An AI-designed mRNA drug belongs to both "AI Drug Discovery" and "mRNA" platforms.
    """
    __tablename__ = "technology_platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(100))  # "Gene Editing", "Cell Therapy", "Nucleic Acid Therapeutics", "Computational", "Drug Delivery"
    readiness_level: Mapped[int | None] = mapped_column(Integer)  # Technology Readiness Level (TRL 1-9)
    description: Mapped[str | None] = mapped_column(Text)


class AssetTechnologyPlatform(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Platform Utilization
    Purpose: Links therapeutic assets to the platform technologies used to create them.
    Scope: Commercial Intelligence.
    Usage: "mRNA-1273 was built on mRNA (Primary) and Lipid Nanoparticle Delivery (Enabling)".
    Type: RELATION
    Connects: Asset → TechnologyPlatform (many-to-many)
    Why: An asset can use multiple platforms. Answers "which drugs use CRISPR?"
         and "what platforms were used to develop this drug?"
    """
    __tablename__ = "asset_technology_platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))
    technology_platform_id: Mapped[int] = mapped_column(ForeignKey("technology_platforms.id"))
    role: Mapped[str] = mapped_column(String(50))  # "Primary", "Secondary", "Enabling"

    __table_args__ = (
        UniqueConstraint("asset_id", "technology_platform_id", name="uq_asset_technology_platform"),
    )


class OrganizationTechnologyPlatform(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Technology Capability
    Purpose: Links market organizations to the platform technologies they utilize.
    Scope: Commercial Intelligence.
    Usage: "Moderna utilizes mRNA (Core) and AI Drug Discovery (Research)".
    Type: RELATION
    Connects: Organization → TechnologyPlatform (many-to-many)
    Why: A company can work with multiple platforms. Answers "which companies are doing CRISPR?"
         and "what is Moderna's technology stack?"
    """
    __tablename__ = "organization_technology_platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    market_organization_id: Mapped[int] = mapped_column(ForeignKey("market_organizations.id"))
    technology_platform_id: Mapped[int] = mapped_column(ForeignKey("technology_platforms.id"))
    utilization_type: Mapped[str] = mapped_column(String(50))  # "Core", "Licensed", "Research"

    __table_args__ = (
        UniqueConstraint("market_organization_id", "technology_platform_id", name="uq_org_technology_platform"),
    )
