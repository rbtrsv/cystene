"""
Nexotype Models — Section 6: LIMS & Empirical Data

Subjects, biospecimens, assay protocols, runs, and readouts.
"""

from __future__ import annotations
from datetime import datetime
from typing import List
from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin, OwnableMixin


# ==========================================
# 6. LIMS & EMPIRICAL DATA
# ==========================================

class Subject(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Donor / Model
    Purpose: The Biological Identity (Patient or Animal).
    Scope: Clinical & Pre-clinical.
    Usage: "Patient 10425" or "Mouse 55".
    Type: NODE
    """
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_identifier: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    organism_id: Mapped[int] = mapped_column(ForeignKey("organisms.id"))
    cohort_name: Mapped[str | None] = mapped_column(String(100))
    sex: Mapped[str | None] = mapped_column(String(10))

    # Relationships
    biospecimens: Mapped[List["Biospecimen"]] = relationship(back_populates="subject")


class Biospecimen(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Aliquot / Sample
    Purpose: Physical biological material custody.
    Scope: LIMS.
    Usage: "Blood Tube - Freezer B".
    Type: NODE
    """
    __tablename__ = "biospecimens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    barcode: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    sample_type: Mapped[str] = mapped_column(String(50))  # "Plasma", "Tissue"
    freezer_location: Mapped[str | None] = mapped_column(String(100))

    # Relationships
    subject: Mapped["Subject"] = relationship(back_populates="biospecimens")


class AssayProtocol(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: SOP
    Purpose: Version-controlled experimental recipe.
    Scope: LIMS / Quality Control.
    Usage: "Horvath Clock v2.0".
    Type: NODE
    """
    __tablename__ = "assay_protocols"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    version: Mapped[str] = mapped_column(String(20))
    method_description: Mapped[str | None] = mapped_column(Text)


class AssayRun(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Batch
    Purpose: The execution event of an experiment.
    Scope: LIMS.
    Usage: "Run 2024-05-12 by Operator X".
    Type: NODE
    """
    __tablename__ = "assay_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protocol_id: Mapped[int] = mapped_column(ForeignKey("assay_protocols.id"))
    run_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    operator_id: Mapped[int | None] = mapped_column(Integer)  # ID of user running it


class AssayReadout(Base, BaseMixin, OwnableMixin):
    """
    Professional Term: Raw Data Point
    Purpose: The quantitative result.
    Scope: LIMS Source of Truth.
    Usage: "IC50 = 5.4 nM".
    Type: RELATION
    Connects: AssayRun + Biospecimen + Asset
    """
    __tablename__ = "assay_readouts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("assay_runs.id"))
    biospecimen_id: Mapped[int | None] = mapped_column(ForeignKey("biospecimens.id"))

    # Polymorphic target (Candidate or Asset)
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("therapeutic_assets.id"))

    raw_value: Mapped[float] = mapped_column(Float)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units_of_measure.id"))
