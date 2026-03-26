"""
Nexotype Models — Sections 7 & 8: User Bridge + Personalization & SaaS

User profiles, data sources, genomic files, user variants, biomarker readings,
treatment logs, pathway scores, recommendations.
"""

from __future__ import annotations
from datetime import datetime, date
from sqlalchemy import Integer, String, ForeignKey, Text, Float, DateTime, Date, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin, OwnableMixin


# ==========================================
# 7. USER BRIDGE
# ==========================================

class UserProfile(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Biological Context
    Purpose: Links the external 'accounts.User' to the internal 'nexotype.Subject'.
    Scope: SaaS Integration.
    Usage: Connecting a Login to their DNA/Lab data.
    Type: RELATION
    Connects: User → Subject
    """
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Loose coupling to external Accounts app (not a FK to avoid cross-app dependency)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), unique=True)

    # Relationships
    subject: Mapped["Subject"] = relationship()


# ==========================================
# 8. PERSONALIZATION & SAAS
# ==========================================

class DataSource(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Integration Source
    Purpose: Origin tracker for user data.
    Scope: SaaS.
    Usage: "Oura Ring", "LabCorp", "Manual Entry".
    Type: NODE
    """
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    source_type: Mapped[str] = mapped_column(String(50))  # "Wearable", "Lab", "Genetic"


class GenomicFile(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Raw Data
    Purpose: Reference to uploaded genetic files.
    Scope: SaaS Ingestion.
    Usage: "23andMe_raw_v5.txt".
    Type: NODE
    """
    __tablename__ = "genomic_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    file_url: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50))  # "Processing", "Completed"


class UserVariant(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Detected Genotype
    Purpose: Specific instance of a Variant found in a User.
    Scope: Personalization.
    Usage: "User X has Variant Y".
    Type: RELATION
    Connects: Subject → Variant
    """
    __tablename__ = "user_variants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    variant_id: Mapped[int] = mapped_column(ForeignKey("variants.id"))
    zygosity: Mapped[str] = mapped_column(String(20))  # "Heterozygous"

    __table_args__ = (
        UniqueConstraint("subject_id", "variant_id", name="uq_user_variant"),
    )


class UserBiomarkerReading(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Time-Series Data
    Purpose: Longitudinal history of a biomarker.
    Scope: SaaS / Dashboard.
    Usage: "NAD+ = 45 on Jan 15".
    Type: RELATION
    Connects: Subject → Biomarker
    """
    __tablename__ = "user_biomarker_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    biomarker_id: Mapped[int] = mapped_column(ForeignKey("biomarkers.id"))
    source_id: Mapped[int] = mapped_column(ForeignKey("data_sources.id"))

    value: Mapped[float] = mapped_column(Float)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units_of_measure.id"))
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class UserTreatmentLog(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Adherence Log
    Purpose: Intervention history.
    Scope: SaaS / Dashboard.
    Usage: "Took NMN 500mg".
    Type: RELATION
    Connects: Subject → Asset
    """
    __tablename__ = "user_treatment_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))

    dosage: Mapped[str] = mapped_column(String(100))  # "500 mg"
    started_at: Mapped[date] = mapped_column(Date)
    ended_at: Mapped[date | None] = mapped_column(Date)


class PathwayScore(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Polygenic Score / Health Score
    Purpose: Algorithm output for a system.
    Scope: Dashboard.
    Usage: "mTOR Health: 45/100".
    Type: RELATION
    Connects: Subject → Pathway
    """
    __tablename__ = "pathway_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    pathway_id: Mapped[int] = mapped_column(ForeignKey("pathways.id"))
    score: Mapped[float] = mapped_column(Float)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Recommendation(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Action Plan
    Purpose: Final output of the Graph Engine.
    Scope: SaaS Dashboard.
    Usage: "Take NMN (Priority High)".
    Type: RELATION
    Connects: UserProfile → Asset
    """
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_profile_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"))
    asset_id: Mapped[int] = mapped_column(ForeignKey("therapeutic_assets.id"))

    reason: Mapped[str] = mapped_column(Text)  # "Due to NMNAT1 variant"
    priority: Mapped[str] = mapped_column(String(20))  # "High", "Medium"
